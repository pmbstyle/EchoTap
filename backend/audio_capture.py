"""
Cross-platform audio capture for EchoTap
Multi-source recording: microphone + system audio using PyAudioWPatch
"""


import asyncio
import logging
import platform
from typing import Callable, Optional, Dict, Any

# Multi-source audio capture
try:
    from multi_source_capture import MultiSourceAudioCapture
    MULTI_SOURCE_AVAILABLE = True
except ImportError as e:
    MULTI_SOURCE_AVAILABLE = False
    MultiSourceAudioCapture = None

logger = logging.getLogger(__name__)


class AudioCapture:
    """Simplified audio capture interface using multi-source backend"""
    
    def __init__(self):
        # Multi-source capture system
        self.multi_source_capture = None
        self.is_recording = False
        self.audio_callback: Optional[Callable] = None
        
        # Try to initialize multi-source capture
        if MULTI_SOURCE_AVAILABLE:
            try:
                self.multi_source_capture = MultiSourceAudioCapture()
                logger.info("✅ Multi-source audio capture ready")
            except Exception as e:
                logger.error(f"❌ Multi-source capture failed: {e}")
                self.multi_source_capture = None
        
        if not self.multi_source_capture:
            logger.warning("⚠️ Multi-source capture not available, audio recording disabled")
        
        self._initialize()
        
    def _initialize(self):
        """Initialize audio capture system"""
        try:
            if self.multi_source_capture:
                logger.info("🎬 Multi-source audio system initialized")
            else:
                logger.warning("⚠️ Audio capture system not available")
                
        except Exception as e:
            logger.error(f"Failed to initialize audio capture: {e}")
            
    def set_audio_callback(self, callback: Callable[[bytes, int, str], None]):
        """Set callback function for audio data (includes source parameter)"""
        self.audio_callback = callback
        if self.multi_source_capture:
            self.multi_source_capture.set_audio_callback(callback)
        
    async def start_recording(self):
        """Start audio recording"""
        logger.info("Starting multi-source audio recording...")
        
        if self.is_recording:
            logger.warning("Already recording")
            return
        
        if not self.multi_source_capture:
            raise RuntimeError("Multi-source capture not available")
            
        try:
            await self.multi_source_capture.start_recording()
            self.is_recording = True
            logger.info("✅ Multi-source recording started successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to start recording: {e}")
            raise
            
    async def stop_recording(self):
        """Stop audio recording"""
        if not self.is_recording:
            return
            
        try:
            if self.multi_source_capture:
                await self.multi_source_capture.stop_recording()
            
            self.is_recording = False
            logger.info("🛑 Recording stopped")
            
        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
    
    def get_waveform_data(self) -> list:
        """Get waveform visualization data"""
        if self.multi_source_capture:
            return self.multi_source_capture.get_waveform_data()
        
        # Fallback: generate simulated waveform when recording
        if self.is_recording:
            return self._generate_simulated_waveform()
        return [0.0] * 20
    
    def _generate_simulated_waveform(self) -> list:
        """Generate simulated waveform data for visualization when real audio is not available"""
        import random
        import time
        import math
        
        waveform = []
        current_time = time.time()
        
        speech_phase = (current_time * 1.5) % 2.0
        is_speaking = speech_phase < 1.2
        
        for i in range(20):
            if is_speaking:
                position_factor = i / 19.0
                phoneme_freq = math.sin(current_time * 6 + i * 0.4) * 0.5
                formant_freq = math.sin(current_time * 15 + position_factor * 8) * 0.3
                noise = (random.random() - 0.5) * 0.2
                envelope = 0.6 + 0.4 * abs(math.sin(position_factor * math.pi))
                value = abs(phoneme_freq + formant_freq + noise) * envelope
                value = min(1.0, max(0.1, value * 1.8))
            else:
                noise = (random.random() - 0.5) * 0.1
                breathing = abs(math.sin(current_time * 4 + i * 0.2)) * 0.15
                value = abs(noise + breathing * 0.5)
                value = min(0.3, max(0.05, value * 1.2))
            
            waveform.append(value)
        
        return waveform
    
    def get_current_source(self) -> str:
        """Get current recording source description"""
        if self.multi_source_capture:
            return self.multi_source_capture.get_current_sources()
        return "none"
    
    async def toggle_source(self):
        """Toggle between available sources (not implemented yet)"""
        logger.info("Source toggling not implemented in multi-source mode")
    
    async def update_preferences(self, preferences: dict):
        """Update audio preferences"""
        logger.info("Audio preferences updated")
        # Could be implemented to adjust mixing ratios, etc.
    
    def cleanup(self):
        """Clean up resources"""
        try:
            if self.multi_source_capture:
                self.multi_source_capture.cleanup()
            logger.info("🧹 Audio capture cleaned up")
        except Exception as e:
            logger.error(f"❌ Cleanup error: {e}")
    
    def __del__(self):
        """Destructor"""
        self.cleanup()