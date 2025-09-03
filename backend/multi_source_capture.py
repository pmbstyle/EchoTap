"""
Multi-Source Audio Capture System
Handles simultaneous recording from microphone and system audio using PyAudioWPatch
"""
import sys
import asyncio
import logging
import threading
import time
import numpy as np
from typing import Optional, Callable, Dict, Any
from collections import deque

# Cross-platform audio import
if sys.platform.startswith("win"):
    import pyaudiowpatch as pyaudio
else:
    import pyaudio

from device_manager import AudioDeviceManager

logger = logging.getLogger(__name__)

class MultiSourceAudioCapture:
    """Multi-source audio capture using PyAudioWPatch"""
    
    def __init__(self):
        # Audio configuration
        self.sample_rate = 16000
        self.channels = 1  # Mono for transcription
        self.chunk_size = 1024
        self.audio_format = pyaudio.paInt16
        
        # Device management
        self.device_manager = AudioDeviceManager()
        
        # Audio streams
        self.microphone_stream = None
        self.system_audio_stream = None
        
        # PyAudio instance
        self.pa = None
        
        # Recording state
        self.is_recording = False
        self.audio_callback: Optional[Callable] = None
        
        # Audio buffers for mixing
        self.microphone_buffer = deque(maxlen=10)
        self.system_audio_buffer = deque(maxlen=10)
        
        # Threading for audio processing
        self.processing_thread = None
        self.stop_processing = threading.Event()
        
        self._initialize()
    
    def _initialize(self):
        """Initialize the multi-source capture system"""
        try:
            self.pa = pyaudio.PyAudio()
            logger.info("🎬 Multi-source audio capture initialized")
            
            # Log available sources
            if self.device_manager.has_microphone():
                mic_info = self.device_manager.get_microphone_config()
                logger.info(f"🎤 Microphone ready: {mic_info['name']}")
            
            if self.device_manager.has_system_audio():
                sys_info = self.device_manager.get_system_audio_config()
                logger.info(f"🔊 System audio ready: {sys_info['name']}")
            else:
                logger.warning("⚠️ System audio not available - microphone only mode")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize multi-source capture: {e}")
            raise
    
    def set_audio_callback(self, callback: Callable[[bytes, int, str], None]):
        """Set callback for processed audio data"""
        self.audio_callback = callback
    
    async def start_recording(self):
        """Start multi-source recording"""
        if self.is_recording:
            logger.warning("Already recording")
            return
        
        try:
            logger.info("🎬 Starting multi-source audio recording...")
            
            # Start microphone stream
            if self.device_manager.has_microphone():
                await self._start_microphone_stream()
            
            # Start system audio stream
            if self.device_manager.has_system_audio():
                await self._start_system_audio_stream()
            
            # Start audio processing thread
            self._start_processing_thread()
            
            self.is_recording = True
            sources = []
            if self.microphone_stream:
                sources.append("microphone")
            if self.system_audio_stream:
                sources.append("system_audio")
            
            logger.info(f"✅ Multi-source recording started: {' + '.join(sources)}")
            
        except Exception as e:
            logger.error(f"❌ Failed to start multi-source recording: {e}")
            await self.stop_recording()
            raise
    
    async def stop_recording(self):
        """Stop multi-source recording"""
        if not self.is_recording:
            return
        
        logger.info("🛑 Stopping multi-source recording...")
        
        try:
            self.is_recording = False
            
            # Stop processing thread
            self.stop_processing.set()
            if self.processing_thread and self.processing_thread.is_alive():
                self.processing_thread.join(timeout=2.0)
            
            # Stop microphone stream
            if self.microphone_stream:
                self.microphone_stream.stop_stream()
                self.microphone_stream.close()
                self.microphone_stream = None
            
            # Stop system audio stream
            if self.system_audio_stream:
                self.system_audio_stream.stop_stream()
                self.system_audio_stream.close()
                self.system_audio_stream = None
            
            logger.info("✅ Multi-source recording stopped")
            
        except Exception as e:
            logger.error(f"❌ Error stopping recording: {e}")
    
    async def _start_microphone_stream(self):
        """Start microphone audio stream"""
        try:
            mic_config = self.device_manager.get_microphone_config()
            if not mic_config:
                raise RuntimeError("No microphone device available")
            
            self.microphone_stream = self.pa.open(
                format=self.audio_format,
                channels=self.channels,
                rate=self.sample_rate,
                input=True,
                input_device_index=mic_config['index'],
                frames_per_buffer=self.chunk_size,
                stream_callback=self._microphone_callback
            )
            
            logger.info(f"🎤 Microphone stream started: {mic_config['name']}")
            
        except Exception as e:
            logger.error(f"❌ Failed to start microphone stream: {e}")
            raise
    
    async def _start_system_audio_stream(self):
        """Start system audio stream (WASAPI loopback)"""
        try:
            sys_config = self.device_manager.get_system_audio_config()
            if not sys_config:
                logger.warning("⚠️ System audio device not available")
                return
            
            # Use system audio device's native sample rate
            device_sample_rate = sys_config.get('sample_rate', self.sample_rate)
            
            self.system_audio_stream = self.pa.open(
                format=self.audio_format,
                channels=self.channels,
                rate=device_sample_rate,  # Use device's native rate
                input=True,
                input_device_index=sys_config['index'],
                frames_per_buffer=self.chunk_size,
                stream_callback=self._system_audio_callback
            )
            
            logger.info(f"🔊 System audio stream started: {sys_config['name']}")
            
        except Exception as e:
            logger.error(f"❌ Failed to start system audio stream: {e}")
            # Don't raise - continue with microphone only
    
    def _microphone_callback(self, in_data, frame_count, time_info, status):
        """Callback for microphone audio data"""
        if self.is_recording and in_data:
            self.microphone_buffer.append(in_data)
        return (None, pyaudio.paContinue)
    
    def _system_audio_callback(self, in_data, frame_count, time_info, status):
        """Callback for system audio data"""
        if self.is_recording and in_data:
            self.system_audio_buffer.append(in_data)
            # Removed verbose callback logging - only log errors
        elif status:
            logger.warning(f"⚠️ System audio callback error: {status}")
        return (None, pyaudio.paContinue)
    
    def _start_processing_thread(self):
        """Start audio processing thread"""
        self.stop_processing.clear()
        self.processing_thread = threading.Thread(
            target=self._audio_processing_loop,
            daemon=True
        )
        self.processing_thread.start()
        logger.info("🔄 Audio processing thread started")
    
    def _audio_processing_loop(self):
        """Main audio processing loop"""
        logger.info("🎛️ Audio processing loop started")
        
        while not self.stop_processing.is_set():
            try:
                # Check buffer states (removed verbose logging)
                mic_buffer_size = len(self.microphone_buffer) if self.microphone_buffer else 0
                sys_buffer_size = len(self.system_audio_buffer) if self.system_audio_buffer else 0
                
                # Process microphone audio
                if self.microphone_buffer and self.audio_callback:
                    mic_data = self.microphone_buffer.popleft()
                    # Create a new event loop for this thread
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        loop.run_until_complete(
                            self.audio_callback(mic_data, self.sample_rate, "microphone")
                        )
                    finally:
                        loop.close()
                
                # Process system audio - but accumulate larger chunks first
                # System audio needs larger chunks (5 seconds) for better transcription
                if len(self.system_audio_buffer) >= 40:  # ~5 seconds at 16kHz (40 * 2048 bytes)
                    # Combine multiple small chunks into one large chunk
                    combined_data = bytearray()
                    chunks_to_combine = min(40, len(self.system_audio_buffer))
                    
                    for _ in range(chunks_to_combine):
                        if self.system_audio_buffer:
                            chunk = self.system_audio_buffer.popleft()
                            combined_data.extend(chunk)
                    
                    if combined_data and self.audio_callback:
                        logger.info(f"📤 Processing combined system audio: {len(combined_data)} bytes ({len(combined_data)/(self.sample_rate*2):.1f}s)")
                        # Create a new event loop for this thread
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        try:
                            loop.run_until_complete(
                                self.audio_callback(bytes(combined_data), self.sample_rate, "system_audio")
                            )
                        finally:
                            loop.close()
                
                # Mix audio sources if both are available
                if (self.microphone_buffer and self.system_audio_buffer and 
                    len(self.microphone_buffer) > 0 and len(self.system_audio_buffer) > 0):
                    mixed_data = self._mix_audio_sources()
                    if mixed_data and self.audio_callback:
                        # Create a new event loop for this thread
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        try:
                            loop.run_until_complete(
                                self.audio_callback(mixed_data, self.sample_rate, "mixed")
                            )
                        finally:
                            loop.close()
                
                time.sleep(0.01)  # 10ms processing interval
                
            except Exception as e:
                if not self.stop_processing.is_set():
                    logger.error(f"❌ Error in audio processing loop: {e}")
        
        logger.info("🛑 Audio processing loop stopped")
    
    def _mix_audio_sources(self) -> Optional[bytes]:
        """Mix microphone and system audio sources"""
        try:
            # Get latest data from both buffers
            mic_data = self.microphone_buffer[-1] if self.microphone_buffer else None
            sys_data = self.system_audio_buffer[-1] if self.system_audio_buffer else None
            
            if not mic_data or not sys_data:
                return None
            
            # Convert to numpy arrays
            mic_audio = np.frombuffer(mic_data, dtype=np.int16)
            sys_audio = np.frombuffer(sys_data, dtype=np.int16)
            
            # Ensure same length
            min_len = min(len(mic_audio), len(sys_audio))
            mic_audio = mic_audio[:min_len]
            sys_audio = sys_audio[:min_len]
            
            # Mix with equal weighting
            mixed = (mic_audio.astype(np.float32) + sys_audio.astype(np.float32)) / 2
            mixed = np.clip(mixed, -32768, 32767).astype(np.int16)
            
            return mixed.tobytes()
            
        except Exception as e:
            logger.error(f"❌ Error mixing audio sources: {e}")
            return None
    
    def get_waveform_data(self) -> list:
        """Get waveform visualization data"""
        try:
            # Always generate exactly 20 samples for consistent visualization
            target_length = 20
            waveform = []
            
            # Use microphone data if available
            if self.microphone_buffer and len(self.microphone_buffer) > 0:
                # Use only the most recent chunk for real-time response
                latest_data = list(self.microphone_buffer)[-1]
                audio_np = np.frombuffer(latest_data, dtype=np.int16)
                
                # Split the latest chunk into exactly 20 samples for consistent bars
                if len(audio_np) > 0:
                    chunk_size = max(1, len(audio_np) // target_length)
                    
                    for i in range(target_length):
                        start_idx = i * chunk_size
                        end_idx = min(start_idx + chunk_size, len(audio_np))
                        
                        if start_idx < len(audio_np):
                            sample = audio_np[start_idx:end_idx]
                            if len(sample) > 0:
                                rms = np.sqrt(np.mean(sample.astype(np.float32) ** 2))
                                # Sensitive normalization with consistent scaling
                                normalized_rms = float(min(1.0, max(0.05, (rms / 500.0) * 2.5)))
                                waveform.append(normalized_rms)
                            else:
                                waveform.append(0.05)
                        else:
                            waveform.append(0.05)
            
            # Check system audio buffer as fallback
            elif self.system_audio_buffer and len(self.system_audio_buffer) > 0:
                latest_data = list(self.system_audio_buffer)[-1]
                audio_np = np.frombuffer(latest_data, dtype=np.int16)
                
                if len(audio_np) > 0:
                    # Same approach for system audio - split into 20 consistent samples
                    chunk_size = max(1, len(audio_np) // target_length)
                    
                    for i in range(target_length):
                        start_idx = i * chunk_size
                        end_idx = min(start_idx + chunk_size, len(audio_np))
                        
                        if start_idx < len(audio_np):
                            sample = audio_np[start_idx:end_idx]
                            if len(sample) > 0:
                                rms = np.sqrt(np.mean(sample.astype(np.float32) ** 2))
                                normalized_rms = float(min(1.0, max(0.05, (rms / 500.0) * 2.5)))
                                waveform.append(normalized_rms)
                            else:
                                waveform.append(0.05)
                        else:
                            waveform.append(0.05)
            
            # Ensure we always return exactly 20 values
            while len(waveform) < target_length:
                waveform.append(0.05)
                
            return waveform[:target_length]
            
        except Exception as e:
            logger.error(f"❌ Error generating waveform: {e}")
            return [0.05] * 20  # Small baseline instead of 0.0
    
    def get_current_sources(self) -> str:
        """Get description of current recording sources"""
        sources = []
        if self.microphone_stream:
            sources.append("microphone")
        if self.system_audio_stream:
            sources.append("system_audio")
        return " + ".join(sources) if sources else "none"
    
    def cleanup(self):
        """Clean up resources"""
        try:
            if self.is_recording:
                asyncio.run(self.stop_recording())
            
            if self.pa:
                self.pa.terminate()
                self.pa = None
            
            if self.device_manager:
                self.device_manager.cleanup()
            
            logger.info("🧹 Multi-source capture cleaned up")
            
        except Exception as e:
            logger.error(f"❌ Cleanup error: {e}")
    
    def __del__(self):
        """Destructor"""
        self.cleanup()