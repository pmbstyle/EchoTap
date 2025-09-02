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
        return [0.0] * 20
    
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