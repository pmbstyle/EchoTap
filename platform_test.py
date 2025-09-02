import platform
print(f"Platform: {platform.system()}")
print(f"Platform details: {platform.platform()}")

try:
    from windows_audio import WindowsAudioCapture
    print("✅ windows_audio import successful")
    WINDOWS_MULTI_AUDIO_AVAILABLE = True
except ImportError as e:
    print(f"❌ windows_audio import failed: {e}")
    WINDOWS_MULTI_AUDIO_AVAILABLE = False

print(f"WINDOWS_MULTI_AUDIO_AVAILABLE: {WINDOWS_MULTI_AUDIO_AVAILABLE}")