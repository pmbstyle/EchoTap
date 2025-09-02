"""
Windows Audio Device Manager
Discovers and manages microphone and WASAPI loopback devices
"""
import sys
import logging
from typing import Dict, List, Optional, Any

# Cross-platform audio import
if sys.platform.startswith("win"):
    import pyaudiowpatch as pyaudio
else:
    import pyaudio

logger = logging.getLogger(__name__)

class AudioDeviceManager:
    """Manages audio device discovery and configuration"""
    
    def __init__(self):
        self.pa = None
        self.devices = {
            'microphone': None,
            'system_audio': None,
            'all_input_devices': [],
            'all_output_devices': []
        }
        self._initialize()
    
    def _initialize(self):
        """Initialize PyAudio and discover devices"""
        try:
            self.pa = pyaudio.PyAudio()
            self._discover_devices()
            logger.info("✅ Audio device manager initialized")
        except Exception as e:
            logger.error(f"❌ Failed to initialize audio device manager: {e}")
            raise
    
    def _discover_devices(self):
        """Discover all available audio devices"""
        if not self.pa:
            return
        
        try:
            # Discover microphone (default input)
            self._find_microphone()
            
            # Discover system audio (WASAPI loopback)
            self._find_system_audio()
            
            # List all devices for reference
            self._list_all_devices()
            
        except Exception as e:
            logger.error(f"❌ Error during device discovery: {e}")
    
    def _find_microphone(self):
        """Find the best microphone device"""
        try:
            default_input = self.pa.get_default_input_device_info()
            self.devices['microphone'] = {
                'index': default_input['index'],
                'name': default_input['name'],
                'channels': default_input['maxInputChannels'],
                'sample_rate': int(default_input['defaultSampleRate']),
                'type': 'microphone'
            }
            logger.info(f"🎤 Found microphone: {default_input['name']}")
            
        except Exception as e:
            logger.warning(f"⚠️ No default microphone found: {e}")
    
    def _find_system_audio(self):
        """Find WASAPI loopback device for system audio"""
        try:
            if sys.platform.startswith("win"):
                # Get WASAPI info
                wasapi_info = self.pa.get_host_api_info_by_type(pyaudio.paWASAPI)
                
                # Get default speakers
                default_speakers = self.pa.get_device_info_by_index(wasapi_info["defaultOutputDevice"])
                
                # Find corresponding loopback device
                if not default_speakers["isLoopbackDevice"]:
                    for loopback in self.pa.get_loopback_device_info_generator():
                        if default_speakers["name"] in loopback["name"]:
                            self.devices['system_audio'] = {
                                'index': loopback['index'],
                                'name': loopback['name'],
                                'channels': loopback['maxInputChannels'],
                                'sample_rate': int(loopback['defaultSampleRate']),
                                'type': 'system_audio'
                            }
                            logger.info(f"🔊 Found system audio: {loopback['name']}")
                            break
                    else:
                        logger.warning("⚠️ WASAPI loopback device not found")
                else:
                    logger.warning("⚠️ Default speakers is already a loopback device")
            else:
                logger.info("ℹ️ System audio capture not available on non-Windows platforms")
                
        except OSError:
            logger.warning("⚠️ WASAPI not available on this system")
        except Exception as e:
            logger.error(f"❌ Error finding system audio device: {e}")
    
    def _list_all_devices(self):
        """List all available devices for debugging"""
        try:
            device_count = self.pa.get_device_count()
            logger.info(f"📱 Total audio devices found: {device_count}")
            
            input_count = 0
            output_count = 0
            
            for i in range(device_count):
                device_info = self.pa.get_device_info_by_index(i)
                
                if device_info['maxInputChannels'] > 0:
                    input_count += 1
                    self.devices['all_input_devices'].append({
                        'index': i,
                        'name': device_info['name'],
                        'channels': device_info['maxInputChannels']
                    })
                
                if device_info['maxOutputChannels'] > 0:
                    output_count += 1
                    self.devices['all_output_devices'].append({
                        'index': i,
                        'name': device_info['name'],
                        'channels': device_info['maxOutputChannels']
                    })
            
            logger.info(f"📊 Found {input_count} input devices, {output_count} output devices")
            
        except Exception as e:
            logger.error(f"❌ Error listing devices: {e}")
    
    def get_microphone_config(self) -> Optional[Dict[str, Any]]:
        """Get microphone device configuration"""
        return self.devices.get('microphone')
    
    def get_system_audio_config(self) -> Optional[Dict[str, Any]]:
        """Get system audio device configuration"""
        return self.devices.get('system_audio')
    
    def has_system_audio(self) -> bool:
        """Check if system audio capture is available"""
        return self.devices.get('system_audio') is not None
    
    def has_microphone(self) -> bool:
        """Check if microphone is available"""
        return self.devices.get('microphone') is not None
    
    def get_device_summary(self) -> Dict[str, Any]:
        """Get summary of available devices"""
        return {
            'microphone_available': self.has_microphone(),
            'system_audio_available': self.has_system_audio(),
            'microphone_info': self.devices.get('microphone'),
            'system_audio_info': self.devices.get('system_audio'),
            'total_input_devices': len(self.devices.get('all_input_devices', [])),
            'total_output_devices': len(self.devices.get('all_output_devices', []))
        }
    
    def cleanup(self):
        """Clean up resources"""
        try:
            if self.pa:
                self.pa.terminate()
                self.pa = None
                logger.info("🧹 Audio device manager cleaned up")
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {e}")
    
    def __del__(self):
        """Destructor"""
        self.cleanup()