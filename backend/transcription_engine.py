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
    from faster_whisper import WhisperModel, download_model
    FASTER_WHISPER_AVAILABLE = True
except ImportError:
    FASTER_WHISPER_AVAILABLE = False
    WhisperModel = None
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
        # Model configuration - using 'large-v3-turbo' for best accuracy + speed
        self.model_name = "large-v3-turbo"
        self.model_size = "large-v3-turbo"
        self.model: Optional[WhisperModel] = None
        self.language = None  # Auto-detect
        self.device = "cpu"  # Will try to use GPU if available
        self.compute_type = "int8"  # Quantization for speed
        
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
        """Detect best compute device and type"""
        try:
            # Try CUDA first
            import torch
            if torch.cuda.is_available():
                self.device = "cuda"
                self.compute_type = "float16"
                logger.info("Using CUDA GPU acceleration")
                return
        except ImportError:
            pass
            
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
            
        # Default to CPU
        self.device = "cpu"
        self.compute_type = "int8"
        logger.info("Using CPU inference")
        
    def _load_model(self, model_name: str):
        """Load Whisper model"""
        if not FASTER_WHISPER_AVAILABLE:
            logger.error("faster-whisper not available")
            return
            
        try:
            logger.info(f"Loading model: {model_name}")
            
            # Download model if not cached
            model_path = self.model_cache_dir / model_name
            if not model_path.exists():
                logger.info(f"Downloading model {model_name}...")
                download_model(model_name, output_dir=str(self.model_cache_dir))
            
            # Load model
            self.model = WhisperModel(
                model_name,
                device=self.device,
                compute_type=self.compute_type,
                download_root=str(self.model_cache_dir)
            )
            
            self.model_name = model_name
            logger.info(f"Model {model_name} loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            # Try to load base model as fallback
            if model_name != "base":
                self._load_model("base")
                
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
                
            # Audio enhancement for both sources
            if source == "microphone":
                # Enhanced preprocessing for microphone audio
                max_val = np.max(np.abs(audio_np))
                
                # Normalize quiet microphone audio
                if max_val > 0:
                    # Apply normalization to improve weak signals
                    audio_np = audio_np * (0.7 / max_val)
                    
                    # Apply gentle compression for consistent levels
                    compressed = np.sign(audio_np) * np.power(np.abs(audio_np), 0.8)
                    audio_np = compressed * 0.9
                
                # Simple high-pass filter for microphone noise
                if len(audio_np) > 1:
                    audio_np[1:] = audio_np[1:] - 0.95 * audio_np[:-1]
                
                # Final normalization
                final_max = np.max(np.abs(audio_np))
                if final_max > 0:
                    audio_np = audio_np * (0.8 / final_max)
            
            # Enhanced preprocessing for system audio
            elif source == "system_audio":
                # Advanced audio preprocessing for YouTube/system audio
                max_val = np.max(np.abs(audio_np))
                
                # Handle WASAPI loopback silence issues
                if max_val < 0.01:  # Very quiet audio
                    # Add very low-level noise to prevent Whisper VAD confusion
                    noise_level = 0.001
                    audio_np += np.random.normal(0, noise_level, audio_np.shape)
                
                # Advanced normalization with dynamic range compression
                max_val = np.max(np.abs(audio_np))
                if max_val > 0:
                    # More aggressive normalization for system audio
                    audio_np = audio_np * (0.95 / max_val)
                    
                    # Apply gentle compression to even out volume levels
                    # This helps with YouTube videos that have varying volume
                    compressed = np.sign(audio_np) * np.power(np.abs(audio_np), 0.7)
                    audio_np = compressed * 0.8
                
                # Multi-stage filtering for better speech isolation
                if len(audio_np) > 1:
                    # High-pass filter to remove low-frequency noise/music
                    audio_np[1:] = audio_np[1:] - 0.9 * audio_np[:-1]
                    
                    # Simple de-emphasis to reduce harsh frequencies
                    if len(audio_np) > 2:
                        audio_np[2:] = audio_np[2:] - 0.3 * audio_np[1:-1]
                
                # Adaptive noise gate based on content
                rms_level = np.sqrt(np.mean(audio_np ** 2))
                adaptive_threshold = max(0.002, rms_level * 0.1)
                audio_np[np.abs(audio_np) < adaptive_threshold] = 0
                
                # Final normalization to ensure consistent levels
                final_max = np.max(np.abs(audio_np))
                if final_max > 0:
                    audio_np = audio_np * (0.8 / final_max)
                
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
            logger.info(f"🎵 Pre-transcription audio: duration={audio_duration:.2f}s, RMS={audio_rms:.4f}, shape={audio_np.shape}, source={source}")
            
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
                # Optimized transcription for microphone with large-v3-turbo model
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
            
            if not full_text:
                logger.info(f"🔍 No text detected in {source} audio chunk (duration: {len(audio_np)/sample_rate:.2f}s)")
                return None
                
            # Filter out repetitive or low-quality transcriptions for system audio
            if source == "system_audio":
                logger.info(f"🎵 System audio transcribed: '{full_text[:50]}...' (confidence: {info.language_probability:.2f})")
                
                if self._is_repetitive_text(full_text):
                    logger.info(f"❌ Filtering repetitive system audio: '{full_text[:30]}...'")
                    return None
                if self._is_low_quality_transcription(full_text, info.language_probability):
                    logger.info(f"❌ Filtering low-quality system audio: '{full_text[:30]}...' (confidence: {info.language_probability:.2f})")
                    return None
                    
                logger.info(f"✅ System audio passed filters: '{full_text[:50]}...'")
            else:
                logger.info(f"🎤 Microphone transcribed: '{full_text[:50]}...' (confidence: {info.language_probability:.2f})")
                
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
            
    def _get_context_prompt(self) -> str:
        """Get context prompt from recent transcript"""
        if not self.session_transcript:
            return ""
            
        # Use last few segments as context
        recent_segments = self.session_transcript[-3:]
        context = " ".join([seg["text"] for seg in recent_segments])
        
        return context
        
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
            sentences = text.split('.')
            if len(sentences) > 2:
                first_sentence = sentences[0].strip().lower()
                if len(first_sentence) > 5:
                    # Count how many sentences are very similar to the first
                    similar_count = 0
                    for sentence in sentences[1:]:
                        sentence = sentence.strip().lower()
                        if len(sentence) > 3 and first_sentence in sentence:
                            similar_count += 1
                    if similar_count >= 2:  # 3+ similar sentences
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