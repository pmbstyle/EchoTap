"""
Real-time transcription engine using faster-whisper
Supports streaming transcription with VAD-based segmentation
"""
import asyncio
import logging
import os
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional, Any, Callable
from collections import deque
import threading
from datetime import datetime

import numpy as np
import soundfile as sf

# faster-whisper imports
try:
    from faster_whisper import WhisperModel, BatchedInferencePipeline, download_model
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False
    WhisperModel = None
    BatchedInferencePipeline = None
    download_model = None

# VAD for chunk segmentation
try:
    import webrtcvad
    VAD_AVAILABLE = True
except ImportError:
    VAD_AVAILABLE = False
    webrtcvad = None

logger = logging.getLogger(__name__)

class TranscriptionEngine:
    """Real-time speech-to-text engine with streaming support"""
    
    def __init__(self):
        # Progressive model selection for different hardware capabilities
        self.model_tiers = {
            "minimal": {
                "name": "tiny",
                "size_mb": 39,
                "min_ram_gb": 2,
                "description": "Fastest, lowest accuracy - good for resource-constrained systems"
            },
            "balanced": {
                "name": "base", 
                "size_mb": 74,
                "min_ram_gb": 4,
                "description": "Good balance of speed and accuracy"
            },
            "quality": {
                "name": "small",
                "size_mb": 244, 
                "min_ram_gb": 8,
                "description": "Better accuracy, moderate speed - recommended for most systems"
            },
            "premium": {
                "name": "medium",
                "size_mb": 769,
                "min_ram_gb": 16,
                "description": "Best accuracy, slower - for high-end systems only"
            }
        }
        
        # Auto-select model based on system resources
        self.model_name = self._auto_select_model()
        self.model_size = self.model_name
        self.model: Optional[WhisperModel] = None
        self.batched_model = None  # Batched inference pipeline for faster processing
        self.language = None  # Auto-detect
        
        # Auto-detect compute device and settings
        self.device = "cpu"
        self.compute_type = "int8"  # Default quantization
        
        # Audio processing
        self.sample_rate = 16000
        self.chunk_duration = 4.0  # Slightly longer chunks for better context
        self.overlap_duration = 1.0  # More overlap to prevent missing speech
        self.system_audio_chunk_duration = 6.0  # Longer chunks for system audio
        self.system_audio_overlap_duration = 2.0  # Much more overlap for system audio
        
        # Streaming buffers
        self.audio_buffer = deque()
        self.processing_buffer = bytearray()
        self.last_partial_text = ""
        self.session_transcript = []
        
        # VAD for intelligent segmentation
        self.vad = None
        self.vad_mode = 2  # 0-3, higher = more aggressive
        
        # Threading and async
        self.processing_thread: Optional[threading.Thread] = None
        self.processing_queue = asyncio.Queue()
        self.is_active = False
        self.current_session_id: Optional[str] = None
        
        # Model management
        self.model_cache_dir = self._get_model_cache_dir()
        self.available_models = {
            "tiny": {"size": "39 MB", "description": "Fastest, lowest accuracy"},
            "base": {"size": "74 MB", "description": "Good balance of speed and accuracy"},
            "small": {"size": "244 MB", "description": "Better accuracy, slower"},
            "medium": {"size": "769 MB", "description": "Best accuracy, slowest"}
        }
        
        self._initialize()
    
    def _get_system_resources(self) -> Dict[str, Any]:
        """Get system resource information for model selection"""
        try:
            import psutil
            ram_gb = psutil.virtual_memory().total / (1024**3)
            cpu_count = psutil.cpu_count()
            
            # Try to get GPU memory if available
            gpu_memory_gb = 0
            try:
                import GPUtil
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu_memory_gb = gpus[0].memoryTotal / 1024  # Convert MB to GB
            except ImportError:
                pass
            
            return {
                "ram_gb": ram_gb,
                "cpu_count": cpu_count,
                "gpu_memory_gb": gpu_memory_gb
            }
        except ImportError:
            # Fallback when psutil not available
            logger.warning("psutil not available, using conservative resource estimates")
            return {
                "ram_gb": 4.0,  # Conservative estimate
                "cpu_count": 2,
                "gpu_memory_gb": 0
            }
    
    def _auto_select_model(self) -> str:
        """Automatically select appropriate Whisper model based on system resources"""
        resources = self._get_system_resources()
        ram_gb = resources["ram_gb"]
        
        logger.info(f"System resources: {ram_gb:.1f}GB RAM, {resources['cpu_count']} CPUs, {resources['gpu_memory_gb']:.1f}GB GPU")
        
        # Select tier based on available RAM with safety margin
        if ram_gb < 3:
            tier = "minimal"
        elif ram_gb < 6:
            tier = "balanced"
        elif ram_gb < 12:
            tier = "quality"
        else:
            tier = "premium"
        
        selected_model = self.model_tiers[tier]["name"]
        logger.info(f"Auto-selected Whisper model: {selected_model} ({tier} tier, {self.model_tiers[tier]['size_mb']}MB)")
        
        return selected_model
    
    def get_model_info(self, model_name: str = None) -> Dict[str, Any]:
        """Get information about current or specified model"""
        if model_name is None:
            model_name = self.model_name
        
        # Find tier for this model
        for tier, info in self.model_tiers.items():
            if info["name"] == model_name:
                return {**info, "tier": tier, "current": model_name == self.model_name}
        
        # Fallback for unknown models
        return {
            "name": model_name,
            "tier": "unknown", 
            "size_mb": 0,
            "min_ram_gb": 0,
            "description": "Custom or unknown model",
            "current": model_name == self.model_name
        }
        
    def _initialize(self):
        """Initialize the transcription engine"""
        try:
            # Initialize VAD
            if VAD_AVAILABLE:
                self.vad = webrtcvad.Vad(self.vad_mode)
                logger.info("VAD initialized for chunk segmentation")
            
            # Try to use GPU if available
            self._detect_compute_device()
            
            # Load default model
            self._load_model(self.model_name)
            
            logger.info("Transcription engine initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize transcription engine: {e}")
    
    async def preheat_model(self):
        """
        Preheat the model by running a dummy transcription to eliminate cold start delay.
        This should be called during app startup to improve first transcription speed.
        """
        if not self.model:
            logger.warning("Cannot preheat: model not loaded")
            return
        
        try:
            logger.info("🔥 Preheating transcription model...")
            
            # Create a small silent audio sample (1 second of silence)
            # This warms up the model without significant overhead
            silent_audio = np.zeros(self.sample_rate, dtype=np.float32)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_path = temp_file.name
                sf.write(temp_path, silent_audio, self.sample_rate)
            
            try:
                # Run a quick transcription to warm up the model
                # Use batched model if available for faster warmup
                transcribe_fn = self.batched_model if self.batched_model else self.model
                
                # Transcribe with minimal settings for speed
                segments, _ = transcribe_fn.transcribe(
                    temp_path,
                    beam_size=1,  # Minimal beam for speed
                    language=None,
                    condition_on_previous_text=False,
                    vad_filter=False,  # Skip VAD for warmup
                )
                
                # Consume the generator to actually run the transcription
                list(segments)
                
                logger.info("✅ Model preheated successfully - first transcription will be faster")
                
            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_path)
                except Exception:
                    pass
                    
        except Exception as e:
            logger.warning(f"Model preheat failed (non-critical): {e}")
            
    def _get_model_cache_dir(self) -> Path:
        """Get model cache directory"""
        if os.name == "nt":  # Windows
            cache_dir = Path(os.environ.get("APPDATA", "")) / "EchoTap" / "models"
        elif os.sys.platform == "darwin":  # macOS
            cache_dir = Path.home() / "Library" / "Application Support" / "EchoTap" / "models"
        else:  # Linux
            cache_dir = Path.home() / ".config" / "EchoTap" / "models"
            
        cache_dir.mkdir(parents=True, exist_ok=True)
        return cache_dir
        
    def _detect_compute_device(self):
        """Detect best compute device and type - prioritizes CUDA GPU"""
        try:
            # Try CUDA first - this is the fastest option
            import torch
            
            # Check if CUDA is available and device count > 0
            if torch.cuda.is_available() and torch.cuda.device_count() > 0:
                try:
                    gpu_name = torch.cuda.get_device_name(0)
                    gpu_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                    self.device = "cuda"
                    self.compute_type = "float16"  # float16 is much faster on GPU
                    logger.info(f"✅ CUDA GPU detected: {gpu_name} ({gpu_memory:.1f}GB)")
                    logger.info("🚀 Using GPU acceleration for maximum speed")
                    return
                except Exception as gpu_error:
                    logger.warning(f"⚠️ GPU detected but couldn't access: {gpu_error}")
            else:
                logger.info("ℹ️ No CUDA GPU detected")
        except ImportError:
            logger.info("ℹ️ PyTorch not installed - install with CUDA for GPU acceleration")
        except Exception as e:
            logger.warning(f"⚠️ CUDA detection error: {e}")
            
        try:
            # Try Apple Metal
            if os.sys.platform == "darwin":
                import torch
                if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                    self.device = "cpu"  # faster-whisper doesn't support MPS yet
                    self.compute_type = "int8"
                    logger.info("Apple Silicon detected, using optimized CPU")
                    return
        except ImportError:
            pass
            
        # Fallback to CPU (much slower than GPU)
        self.device = "cpu"
        self.compute_type = "int8"
        logger.warning("⚠️ No GPU detected - using CPU (will be slower)")
        logger.info("💡 For faster transcription, install CUDA-enabled PyTorch")
        
    def _load_model(self, model_name: str):
        """Load Whisper model with automatic fallback and optimization"""
        if not FASTER_WHISPER_AVAILABLE:
            logger.error("faster-whisper not available")
            return
            
        try:
            logger.info(f"Loading model: {model_name}")
            
            # Get system resources for optimization
            resources = self._get_system_resources()
            
            # Download model if not cached
            model_path = self.model_cache_dir / model_name
            if not model_path.exists():
                logger.info(f"Downloading model {model_name}...")
                download_model(model_name, output_dir=str(self.model_cache_dir))
            
            # Optimize settings based on system resources
            cpu_threads = min(resources["cpu_count"], 4)  # Cap at 4 threads
            
            # Load model with optimized settings
            self.model = WhisperModel(
                model_name,
                device=self.device,
                compute_type=self.compute_type,
                download_root=str(self.model_cache_dir),
                cpu_threads=cpu_threads,
                num_workers=1  # Single worker to prevent memory issues
            )
            
            # Create batched inference pipeline for faster real-time processing
            # BatchedInferencePipeline can be 2-4x faster than standard transcribe
            if FASTER_WHISPER_AVAILABLE and BatchedInferencePipeline:
                try:
                    batch_size = 8 if self.device == "cuda" else 4  # Smaller batch for CPU
                    self.batched_model = BatchedInferencePipeline(
                        model=self.model,
                    )
                    logger.info(f"✨ Batched inference pipeline created (batch_size={batch_size})")
                except Exception as batch_error:
                    logger.warning(f"Could not create batched pipeline: {batch_error}, using standard model")
                    self.batched_model = None
            
            self.model_name = model_name
            logger.info(f"Model {model_name} loaded successfully ({cpu_threads} threads, device={self.device}, compute={self.compute_type})")
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            
            # Try progressive fallback
            current_tier = None
            for tier, info in self.model_tiers.items():
                if info["name"] == model_name:
                    current_tier = tier
                    break
            
            # Try fallback models in order: quality -> balanced -> minimal
            fallback_order = ["quality", "balanced", "minimal"]
            if current_tier in fallback_order:
                fallback_tiers = fallback_order[fallback_order.index(current_tier) + 1:]
            else:
                fallback_tiers = fallback_order
            
            for fallback_tier in fallback_tiers:
                fallback_model = self.model_tiers[fallback_tier]["name"]
                if fallback_model != model_name:
                    logger.warning(f"Trying fallback model: {fallback_model}")
                    try:
                        # Recursive call with fallback
                        return self._load_model(fallback_model)
                    except Exception as fallback_error:
                        logger.error(f"Fallback model {fallback_model} also failed: {fallback_error}")
                        continue
            
            # If all fallbacks fail, log error but don't crash
            logger.error("All Whisper models failed to load. Transcription will be unavailable.")
                
    async def start_session(self, session_id: str):
        """Start a new transcription session"""
        self.current_session_id = session_id
        self.session_transcript.clear()
        self.audio_buffer.clear()
        self.processing_buffer.clear()
        self.last_partial_text = ""
        self.is_active = True
        
        # Start processing thread
        self.processing_thread = threading.Thread(
            target=self._processing_loop, daemon=True
        )
        self.processing_thread.start()
        
        logger.info(f"Transcription session started: {session_id}")
        
    async def end_session(self, session_id: str):
        """End transcription session"""
        self.is_active = False
        
        # Wait for processing thread to finish
        if self.processing_thread and self.processing_thread.is_alive():
            self.processing_thread.join(timeout=5.0)
            
        # Process any remaining audio
        if self.processing_buffer:
            await self._process_audio_chunk(self.processing_buffer, self.sample_rate, source="unknown", is_final=True)
            
        logger.info(f"Transcription session ended: {session_id}")
        
    async def process_audio_chunk(self, audio_data: bytes, sample_rate: int, session_id: str, source: str = "unknown") -> Optional[Dict]:
        """Process incoming audio chunk with source awareness"""
        if not self.is_active or session_id != self.current_session_id:
            return None
            
        # Add to buffer
        self.audio_buffer.append((audio_data, time.time()))
        
        # Add to processing buffer
        self.processing_buffer.extend(audio_data)
        
        # Check if we have enough audio to process (different durations for different sources)
        buffer_duration = len(self.processing_buffer) / (sample_rate * 2)  # 16-bit audio
        
        # Use longer chunks for system audio to give Whisper more context
        if source == "system_audio":
            required_duration = self.system_audio_chunk_duration
            overlap_duration = self.system_audio_overlap_duration
        else:
            required_duration = self.chunk_duration
            overlap_duration = self.overlap_duration
        
        if buffer_duration >= required_duration:
            # Extract chunk with overlap
            chunk_size = int(required_duration * sample_rate * 2)
            overlap_size = int(overlap_duration * sample_rate * 2)
            
            chunk_data = self.processing_buffer[:chunk_size]
            
            # Keep overlap for next chunk
            self.processing_buffer = self.processing_buffer[chunk_size - overlap_size:]
            
            # Process chunk with source information
            return await self._process_audio_chunk(chunk_data, sample_rate, source=source, is_final=False)
            
        return None
    
    async def process_wav_audio(self, wav_data: bytes, sample_rate: int = 16000, source: str = "microphone") -> Optional[Dict]:
        """Process WAV audio data directly from frontend"""
        try:
            # Skip WAV header (44 bytes) and convert to float32
            audio_bytes = wav_data[44:]  # Skip WAV header
            audio_np = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            
            if len(audio_np) == 0:
                return None
            
            logger.debug(f"Processing WAV audio: {len(audio_np)} samples from {source}")
            
            # Apply source-specific preprocessing (similar to _process_audio_chunk)
            if source == "microphone":
                max_val = np.max(np.abs(audio_np))
                if max_val > 0:
                    audio_np = audio_np * (0.7 / max_val)
                    audio_np = np.sign(audio_np) * np.power(np.abs(audio_np), 0.8)
            
            # Run transcription with improved punctuation settings
            segments, info = self.model.transcribe(
                audio_np,
                beam_size=5,
                best_of=5,  # Multiple candidates for better quality
                temperature=0.2,  # Slight temperature for natural punctuation
                language=None,  # None for auto-detection
                condition_on_previous_text=True,
                vad_filter=True,
                vad_parameters=dict(min_silence_duration_ms=300),
                initial_prompt=self._get_punctuation_prompt()
            )
            
            # Collect segments
            text_segments = []
            full_text = []
            start_time = 0
            end_time = len(audio_np) / sample_rate
            
            for segment in segments:
                if hasattr(segment, 'text') and segment.text.strip():
                    segment_data = {
                        "text": segment.text.strip(),
                        "start": float(segment.start),
                        "end": float(segment.end),
                        "confidence": float(getattr(segment, "avg_logprob", 0.0))
                    }
                    text_segments.append(segment_data)
                    full_text.append(segment.text.strip())
                    
                    # Update timing
                    if hasattr(segment, 'start'):
                        start_time = min(start_time, segment.start)
                    if hasattr(segment, 'end'):
                        end_time = max(end_time, segment.end)
            
            if not text_segments:
                return None
            
            result_text = " ".join(full_text)
            
            # Clean up result text
            if result_text:
                result_text = self._filter_hallucinations(result_text, source)
                result_text = self._format_transcript_text(result_text)
                result_text = self._clean_repetitive_ending(result_text)
            
            # Update session transcript
            self.session_transcript.extend(text_segments)
            
            result = {
                "type": "final_transcript",
                "text": result_text,
                "segments": text_segments,
                "language": info.language,
                "confidence": float(info.language_probability),
                "is_final": True,
                "timestamp": datetime.now().isoformat(),
                "start_time": start_time,
                "end_time": end_time
            }
            
            logger.info(f"✅ WAV transcription: '{result_text[:50]}...' (lang: {info.language}, conf: {info.language_probability:.3f})")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing WAV audio: {e}")
            return None
        
    async def _process_audio_chunk(self, audio_data: bytes, sample_rate: int, source: str = "unknown", is_final: bool = False) -> Optional[Dict]:
        """Process audio chunk through Whisper with source-aware processing"""
        if not self.model:
            return None
            
        try:
            # Convert bytes to numpy array
            audio_np = np.frombuffer(audio_data, dtype=np.int16).astype(np.float32) / 32768.0
            
            # Resample if necessary (Whisper expects 16kHz)
            if len(audio_np) == 0:
                return None
                
            # Simplified preprocessing for microphone audio
            if source == "microphone":
                # Single normalization pass - remove redundant operations
                max_val = np.max(np.abs(audio_np))
                if max_val > 0:
                    audio_np = audio_np * (0.7 / max_val)
            
            # Simplified preprocessing for system audio
            elif source == "system_audio":
                # Single-pass normalization - remove redundant filtering
                max_val = np.max(np.abs(audio_np))
                if max_val > 0:
                    # Simple normalization without multiple passes
                    audio_np = audio_np * (0.8 / max_val)
                
                # Simple noise gate only
                rms_level = np.sqrt(np.mean(audio_np ** 2))
                if rms_level < 0.002:
                    return None  # Skip very quiet audio
                
            # Check audio quality for system audio sources
            if source == "system_audio":
                # Calculate RMS to detect if this is mostly music/noise
                rms = np.sqrt(np.mean(audio_np ** 2))
                logger.info(f"🔊 System audio RMS: {rms:.4f} (length: {len(audio_np)/sample_rate:.2f}s)")
                
                if rms < 0.001:  # Much lower threshold for system audio
                    logger.info(f"❌ Skipping quiet system audio (RMS: {rms:.4f})")
                    return None
                    
                # For system audio, use more conservative settings
                beam_size = 1  # Always use fastest beam search for system audio
                temperature = 0.3  # Higher temperature to avoid repetition
                condition_on_previous = False  # Don't condition on previous text to avoid repetitive patterns
                initial_prompt = ""  # Remove the problematic prompt that was being transcribed
            else:
                # Standard settings for microphone
                beam_size = 1 if not is_final else 5
                temperature = 0.0
                condition_on_previous = True
                initial_prompt = self._get_context_prompt()
                
            # Debug: log final audio characteristics before transcription
            audio_duration = len(audio_np) / sample_rate
            audio_rms = np.sqrt(np.mean(audio_np.astype(np.float32) ** 2))
            logger.debug(f"Pre-transcription audio: duration={audio_duration:.2f}s, RMS={audio_rms:.4f}, shape={audio_np.shape}, source={source}")
            
            # Use proper onnxruntime-based VAD in faster-whisper instead of custom RMS filtering
            
            # Run transcription with source-specific settings
            if source == "system_audio":
                # For system audio, use optimized parameters for 'large-v3-turbo' model
                segments, info = self.model.transcribe(
                    audio_np,
                    task="transcribe",  # Explicitly set to transcribe (not translate)
                    language=None,  # Force auto-detection for each chunk
                    beam_size=1,  # Reduce beam size to prevent hallucinations
                    best_of=1,    # Single best candidate to avoid confusion
                    temperature=0.0,  # Zero temperature for deterministic results
                    condition_on_previous_text=False,  # Completely disable context
                    initial_prompt=None,  # Remove initial prompt to avoid bias
                    vad_filter=True,   # Enable VAD using onnxruntime for proper speech boundaries
                    no_speech_threshold=0.5,      # With VAD enabled, can use standard threshold
                    compression_ratio_threshold=1.5,  # Much lower to catch made-up content
                    no_repeat_ngram_size=2,  # Prevent 2-gram repetitions
                    word_timestamps=False,
                )
            else:
                # Optimized transcription for microphone with proper punctuation
                segments, info = self.model.transcribe(
                    audio_np,
                    task="transcribe",  # Explicitly set to transcribe (not translate)
                    language=None,  # Force auto-detection for each chunk
                    beam_size=5,  # Increased for better punctuation
                    best_of=5,    # Multiple candidates for better quality
                    temperature=0.2,  # Slight temperature for natural punctuation
                    condition_on_previous_text=True,  # Enable context for better punctuation
                    initial_prompt="Hello! This is a conversation with proper punctuation, capitalization, and natural speech patterns.",  # Encourage proper formatting
                    vad_filter=True,   # Enable VAD using onnxruntime for proper speech boundaries
                    no_speech_threshold=0.5,      # With VAD enabled, can use standard threshold
                    compression_ratio_threshold=2.4,  # Standard threshold for normal content
                    no_repeat_ngram_size=2,  # Prevent 2-gram repetitions
                    word_timestamps=False,
                )
            
            # Extract text from segments
            text_segments = []
            full_text = ""
            
            # Debug: log all segments found (even empty ones)
            segment_count = 0
            for segment in segments:
                segment_count += 1
                # Handle potential encoding issues with non-Latin text
                try:
                    segment_text = segment.text.strip()
                    # Check if the text might be corrupted/encoded incorrectly
                    if segment_text and all(ord(char) < 128 for char in segment_text.replace(' ', '').replace('_', '')):
                        # All ASCII - might be okay for English, but suspicious for non-Latin languages
                        if source == "system_audio" and segment_text.count('_') > len(segment_text) * 0.3:
                            logger.warning(f"🚨 Suspicious text with many underscores: '{segment_text}' - possible transcription issue")
                except Exception as e:
                    logger.error(f"Text encoding error: {e}")
                    segment_text = str(segment.text).strip()
                confidence = float(getattr(segment, "avg_logprob", 0.0))
                
                if source == "system_audio":
                    logger.info(f"📊 System audio segment {segment_count}: '{segment_text}' (start: {segment.start:.1f}s, confidence: {confidence:.2f})")
                
                if segment_text:
                    text_segments.append({
                        "text": segment_text,
                        "start": float(segment.start),
                        "end": float(segment.end),
                        "confidence": confidence
                    })
                    full_text += segment_text + " "
                    
            if source == "system_audio":
                logger.info(f"📋 System audio found {segment_count} segments total, {len(text_segments)} with text")
                    
            full_text = full_text.strip()
            
            # Post-process to remove hallucination patterns
            if full_text:
                full_text = self._filter_hallucinations(full_text, source)
                # Format text with proper punctuation and capitalization
                full_text = self._format_transcript_text(full_text)
                # Clean up repetitive endings (spam removal)
                full_text = self._clean_repetitive_ending(full_text)
            
            if not full_text:
                logger.info(f"🔍 No text detected in {source} audio chunk (duration: {len(audio_np)/sample_rate:.2f}s)")
                return None
                
            # Filter out repetitive or low-quality transcriptions for system audio
            if source == "system_audio":
                logger.debug(f"System audio transcribed: '{full_text[:50]}...' (confidence: {info.language_probability:.2f})")
                
                if self._is_repetitive_text(full_text):
                    logger.info(f"❌ Filtering repetitive system audio: '{full_text[:30]}...'")
                    return None
                if self._is_low_quality_transcription(full_text, info.language_probability):
                    logger.info(f"❌ Filtering low-quality system audio: '{full_text[:30]}...' (confidence: {info.language_probability:.2f})")
                    return None
                    
                logger.info(f"✅ System audio passed filters: '{full_text[:50]}...'")
            else:
                logger.debug(f"Microphone transcribed: '{full_text[:50]}...' (confidence: {info.language_probability:.2f})")
                
            # Determine if this is a partial or final result
            result_type = "final_transcript" if is_final else "partial_transcript"
            
            # Update session transcript
            if is_final and text_segments:
                self.session_transcript.extend(text_segments)
                
            # Enhanced language detection logging
            logger.info(f"🌍 Language detection - Detected: '{info.language}' (probability: {info.language_probability:.3f})")
            
            # Always use auto-detected language (don't lock for session)
            # This prevents the model from getting stuck in wrong language
            logger.info(f"🌍 Auto-detected language: {info.language} (confidence: {info.language_probability:.3f})")
            
            # Debug: Check for unusual characters that might indicate encoding issues
            if full_text and ('_' in full_text or len(set(full_text.replace(' ', ''))) < 3):
                logger.warning(f"⚠️ Unusual transcription pattern detected: '{full_text[:100]}'")
                logger.info(f"   - Language detected: {info.language}")
                logger.info(f"   - Language probability: {info.language_probability:.3f}")
                logger.info(f"   - Segment count: {len(text_segments)}")
                
            # Calculate overall start/end times from segments
            start_time = float(text_segments[0]["start"]) if text_segments else 0.0
            end_time = float(text_segments[-1]["end"]) if text_segments else 0.0
            
            result = {
                "type": result_type,
                "text": full_text,
                "segments": text_segments,
                "language": info.language,
                "confidence": float(info.language_probability),
                "is_final": is_final,
                "timestamp": datetime.now().isoformat(),
                "start_time": start_time,
                "end_time": end_time
            }
            
            logger.info(f"📝 Transcription result: '{full_text[:50]}{'...' if len(full_text) > 50 else ''}' (lang: {info.language}, conf: {info.language_probability:.3f}, final: {is_final})")
            return result
            
        except Exception as e:
            logger.error(f"Error processing audio chunk: {e}")
            return None
    
    def _filter_hallucinations(self, text: str, source: str) -> str:
        """Filter out common Whisper hallucination patterns"""
        import re
        
        original_text = text
        
        # Remove repetitive words (2+ consecutive repeats)
        words = text.split()
        filtered_words = []
        i = 0
        while i < len(words):
            word = words[i]
            # Check for repetitive sequences (even 2 repeats)
            if i + 1 < len(words) and words[i] == words[i+1]:
                # Keep only one instance of repeated word
                filtered_words.append(word)
                while i < len(words) and word == words[i]:
                    i += 1
                continue
            filtered_words.append(word)
            i += 1
        
        text = " ".join(filtered_words)
        
        # Remove common English interjections in non-English text
        english_patterns = [
            r"\b(I'm sorry|thank you|please|excuse me|sorry|okay|yes|no)\b[,\s]*",
            r"\b(and|or|but|the|a|an|to|of|in|on|at|for|with|by)\b(?=\s+[а-я])",  # English words before Cyrillic
        ]
        
        for pattern in english_patterns:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        
        # Detect and filter obvious made-up content
        # If text has very mixed scripts (Latin + Cyrillic), it might be hallucinated
        cyrillic_chars = len(re.findall(r'[а-я]', text.lower()))
        latin_chars = len(re.findall(r'[a-z]', text.lower()))
        total_chars = cyrillic_chars + latin_chars
        
        if total_chars > 5:  # Only check if we have enough characters
            cyrillic_ratio = cyrillic_chars / total_chars
            latin_ratio = latin_chars / total_chars
            
            # If heavily mixed (both > 20%), it might be hallucinated
            if cyrillic_ratio > 0.2 and latin_ratio > 0.2:
                logger.warning(f"🚨 Detected mixed script hallucination: '{text}' (Cyr: {cyrillic_ratio:.1%}, Lat: {latin_ratio:.1%})")
                # Don't completely filter, but flag it
        
        # Clean up extra spaces and punctuation
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'[,\s]+$', '', text)  # Remove trailing commas/spaces
        
        # Log significant filtering
        if len(text) < len(original_text) * 0.7:  # More than 30% removed
            logger.info(f"🔧 Heavy filtering applied to {source}: '{original_text[:50]}...' → '{text[:50]}...'")
        
        return text
    
    def _format_transcript_text(self, text: str) -> str:
        """Format transcript text with proper punctuation and capitalization"""
        import re
        
        if not text or not text.strip():
            return text
            
        # Clean up the text
        text = text.strip()
        
        # Capitalize first letter of the entire text
        if text:
            text = text[0].upper() + text[1:]
        
        # Add periods at sentence boundaries (basic heuristic)
        # Look for natural pause points and capitalize after them
        text = re.sub(r'\b(and then|so|but|well|now|okay|alright)\s+', r'\1. ', text, flags=re.IGNORECASE)
        
        # Capitalize after periods
        text = re.sub(r'(\.\s+)([a-z])', lambda m: m.group(1) + m.group(2).upper(), text)
        
        # Add comma before common conjunctions if missing
        text = re.sub(r'\s+(and|but|or|so)\s+', r', \1 ', text, flags=re.IGNORECASE)
        
        # Add period at end if missing
        if text and not text.endswith(('.', '!', '?')):
            text += '.'
            
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _clean_repetitive_ending(self, text: str) -> str:
        """Remove repetitive spam from the end of transcripts"""
        if len(text) < 100:
            return text
            
        # Split into sentences
        sentences = [s.strip() for s in text.split('.') if s.strip()]
        if len(sentences) < 5:
            return text
            
        # Look for repetitive pattern at the end
        cleaned_sentences = []
        seen_sentences = set()
        repetitive_started = False
        
        for sentence in sentences:
            sentence_lower = sentence.lower().strip()
            
            # If we haven't started seeing repetition yet
            if not repetitive_started:
                cleaned_sentences.append(sentence)
                seen_sentences.add(sentence_lower)
            else:
                # Once repetition starts, only add if it's new
                if sentence_lower not in seen_sentences:
                    cleaned_sentences.append(sentence)
                    seen_sentences.add(sentence_lower)
            
            # Check if current sentence indicates start of repetition
            # (appears in previous sentences)
            if not repetitive_started and sentence_lower in seen_sentences:
                # Count how many times this pattern appears in remaining sentences
                remaining_sentences = sentences[sentences.index(sentence):]
                repeat_count = sum(1 for s in remaining_sentences if s.lower().strip() == sentence_lower)
                
                if repeat_count >= 3:  # Same sentence repeats 3+ times
                    repetitive_started = True
                    # Remove the current duplicate
                    if cleaned_sentences and cleaned_sentences[-1].lower().strip() == sentence_lower:
                        cleaned_sentences.pop()
        
        if cleaned_sentences:
            cleaned_text = '. '.join(cleaned_sentences)
            # Add final period if original had one
            if text.rstrip().endswith('.'):
                cleaned_text += '.'
            return cleaned_text
        
        return text
            
    def _get_context_prompt(self) -> str:
        """Get context prompt from recent transcript"""
        if not self.session_transcript:
            return ""
            
        # Use last few segments as context
        recent_segments = self.session_transcript[-3:]
        context = " ".join([seg["text"] for seg in recent_segments])
        
        return context
    
    def _get_punctuation_prompt(self) -> str:
        """Get enhanced prompt for proper punctuation and formatting"""
        base_prompt = "Hello! This is a conversation with proper punctuation, capitalization, and natural speech patterns."
        
        # Add context if available
        context = self._get_context_prompt()
        if context:
            return f"{base_prompt} Previous context: {context}"
        
        return base_prompt
        
    def _is_repetitive_text(self, text: str) -> bool:
        """Check if text is repetitive (like 'hey hey hey' or 'I'm so stupid' repeated)"""
        words = text.lower().split()
        if len(words) < 2:
            return False
            
        # Check for immediate repetition (word word word)
        consecutive_repeats = 0
        for i in range(1, len(words)):
            if words[i] == words[i-1]:
                consecutive_repeats += 1
            else:
                consecutive_repeats = 0
            if consecutive_repeats >= 2:  # 3 or more consecutive identical words
                return True
                
        # Check for pattern repetition (hey hey hey, la la la)
        if len(words) >= 3:
            # Check if most words are the same
            unique_words = set(words)
            if len(unique_words) == 1:  # All words are identical
                return True
            if len(unique_words) <= 2 and len(words) >= 4:  # Very few unique words
                return True
                
        # Check for phrase repetition (like "I'm so stupid" repeated)
        text_lower = text.lower()
        
        # Check for punctuation/symbol repetition (like comma artifacts)
        if len(text) > 20:  # Only for longer texts
            punctuation_ratio = sum(1 for c in text if c in ',".-*()[]{}') / len(text)
            if punctuation_ratio > 0.7:  # More than 70% punctuation
                return True
        
        # Look for repeated phrases
        common_phrases = ["i'm so", "i am so", "this is", "it's so", "that's so"]
        for phrase in common_phrases:
            if text_lower.count(phrase) >= 3:  # Phrase appears 3+ times
                return True
                
        # Check if the text is mostly the same phrase repeated
        if len(text) > 50:  # Only for longer texts
            # Split into approximate sentences and check for repetition
            sentences = [s.strip() for s in text.split('.') if s.strip()]
            if len(sentences) >= 3:
                first_sentence = sentences[0].strip().lower()
                if len(first_sentence) > 5:
                    # Count how many sentences are identical or very similar to the first
                    similar_count = 0
                    for sentence in sentences[1:]:
                        sentence_lower = sentence.strip().lower()
                        if len(sentence_lower) > 3:
                            # Check for exact match or high similarity
                            if (sentence_lower == first_sentence or 
                                (len(sentence_lower) > 5 and first_sentence in sentence_lower)):
                                similar_count += 1
                    
                    # If more than 50% of sentences are very similar, likely repetitive spam
                    if similar_count >= max(2, len(sentences) // 2):
                        return True
                        
        # Enhanced check for exact phrase repetition patterns
        if len(text) > 100:
            # Look for patterns that repeat many times
            words = text.split()
            if len(words) > 20:  # Only for longer texts
                # Check for repeated short phrases (2-10 words)
                for phrase_len in range(2, min(11, len(words) // 5)):
                    phrase_counts = {}
                    for i in range(len(words) - phrase_len + 1):
                        phrase = ' '.join(words[i:i + phrase_len]).lower()
                        phrase_counts[phrase] = phrase_counts.get(phrase, 0) + 1
                    
                    # Find the most common phrase
                    if phrase_counts:
                        max_count = max(phrase_counts.values())
                        if max_count >= 5:  # Phrase appears 5+ times
                            # Check if this phrase dominates the text
                            most_common_phrase = max(phrase_counts.keys(), key=phrase_counts.get)
                            phrase_coverage = (max_count * len(most_common_phrase.split())) / len(words)
                            if phrase_coverage > 0.3:  # Phrase covers >30% of words
                                return True
                
        return False
        
    def _is_low_quality_transcription(self, text: str, confidence: float) -> bool:
        """Check if transcription is likely low quality"""
        # Very low confidence
        if confidence < 0.3:
            return True
            
        # Very short transcriptions with low confidence
        if len(text.split()) <= 2 and confidence < 0.6:
            return True
            
        # Common noise patterns
        noise_patterns = [
            "mmm", "hmm", "uhh", "ahh", "oh", "mm", "uh", "ah",
            "music", "applause", "noise", "[", "]", "♪", "♫",
            ',"', ",", ".", "...", "- -", "* *"  # Transcription artifacts
        ]
        
        text_lower = text.lower()
        for pattern in noise_patterns:
            if pattern in text_lower and len(text.split()) <= 3:
                return True
                
        return False
        
    def _processing_loop(self):
        """Background processing loop"""
        while self.is_active:
            try:
                # Process audio chunks from queue
                # This runs in a separate thread to avoid blocking
                time.sleep(0.1)  # Small delay to prevent CPU spinning
                
            except Exception as e:
                logger.error(f"Error in processing loop: {e}")
                
    async def get_available_models(self) -> List[Dict]:
        """Get list of available models"""
        models = []
        
        for name, info in self.available_models.items():
            model_path = self.model_cache_dir / name
            is_downloaded = model_path.exists()
            
            models.append({
                "name": name,
                "size": info["size"],
                "description": info["description"],
                "downloaded": is_downloaded,
                "current": name == self.model_name
            })
            
        return models
        
    async def download_model(self, model_name: str, progress_callback: Optional[Callable] = None):
        """Download a specific model"""
        if model_name not in self.available_models:
            raise ValueError(f"Unknown model: {model_name}")
            
        try:
            logger.info(f"Downloading model: {model_name}")
            
            # This would ideally show progress, but faster-whisper doesn't support it yet
            download_model(model_name, output_dir=str(self.model_cache_dir))
            
            if progress_callback:
                await progress_callback(100)  # Report complete
                
            logger.info(f"Model {model_name} downloaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to download model {model_name}: {e}")
            raise
            
    async def switch_model(self, model_name: str):
        """Switch to a different model"""
        if model_name == self.model_name:
            return
            
        # Stop current session if active
        was_active = self.is_active
        current_session = self.current_session_id
        
        if was_active:
            await self.end_session(current_session)
            
        # Load new model
        self._load_model(model_name)
        
        # Restart session if it was active
        if was_active and current_session:
            await self.start_session(current_session)
            
    def get_current_model(self) -> str:
        """Get current model name"""
        return self.model_name
        
    async def update_preferences(self, preferences: Dict[str, Any]):
        """Update transcription preferences"""
        restart_needed = False
        
        if "language" in preferences:
            new_language = preferences["language"]
            if new_language == "auto":
                new_language = None
            self.language = new_language
            
        if "model" in preferences:
            new_model = preferences["model"]
            if new_model != self.model_name:
                await self.switch_model(new_model)
                restart_needed = True
                
        if "vad_sensitivity" in preferences and self.vad:
            # Convert 0-100 to 0-3 scale
            vad_mode = min(3, max(0, int(preferences["vad_sensitivity"] / 25)))
            self.vad_mode = vad_mode
            self.vad.set_mode(vad_mode)
            
        logger.info("Transcription preferences updated")
        
    def get_session_stats(self) -> Dict[str, Any]:
        """Get current session statistics"""
        return {
            "session_id": self.current_session_id,
            "is_active": self.is_active,
            "model": self.model_name,
            "language": self.language or "auto",
            "segments_processed": len(self.session_transcript),
            "buffer_size": len(self.processing_buffer),
            "device": self.device,
            "compute_type": self.compute_type
        }