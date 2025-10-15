import { ref, watch, onUnmounted, onMounted } from 'vue'
import * as vad from '@ricky0123/vad-web'

export function useAudioProcessing() {
  // VAD instance
  const vadInstance = ref(null)
  const isVadInitializing = ref(false)
  const isListening = ref(false)
  const isSpeechDetected = ref(false)
  const lastVadActivityTime = ref(0)

  // Audio processing
  const audioContext = ref(null)
  const mediaStream = ref(null)
  const mediaStreamSource = ref(null)
  const analyserNode = ref(null)
  const waveformData = ref(new Array(20).fill(0))
  const isRecording = ref(false)

  // 1-second chunked streaming during speech
  const chunkingMediaRecorder = ref(null)
  const isStreamingChunks = ref(false)

  // Audio analysis for real-time waveform
  const audioDataArray = ref(null)
  const waveformUpdateInterval = ref(null)

  const initializeAudioContext = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      console.log(`🎧 Found ${audioInputs.length} audio input devices:`, audioInputs.map(d => d.label || 'Unnamed device'))
      
      mediaStream.value = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      console.log('✅ Microphone access granted')

      audioContext.value = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      })
      console.log(`✅ Audio context created, state: ${audioContext.value.state}`)

      mediaStreamSource.value = audioContext.value.createMediaStreamSource(mediaStream.value)
      analyserNode.value = audioContext.value.createAnalyser()

      analyserNode.value.fftSize = 64
      analyserNode.value.smoothingTimeConstant = 0.3

      mediaStreamSource.value.connect(analyserNode.value)

      audioDataArray.value = new Uint8Array(analyserNode.value.frequencyBinCount)

      console.log('📢 Using backend recording - frontend chunking disabled')
      console.log('✅ Audio context initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error)
      
      if (error.name === 'NotAllowedError') {
        console.error('🚫 Microphone access denied by user or browser policy')
      } else if (error.name === 'NotFoundError') {
        console.error('🔍 No microphone device found')
      } else if (error.name === 'NotReadableError') {
        console.error('🔒 Microphone is already in use by another application')
      } else if (error.name === 'OverconstrainedError') {
        console.error('⚙️ Audio constraints cannot be satisfied')
      } else if (error.name === 'SecurityError') {
        console.error('🛡️ Security error - check HTTPS and permissions')
      } else if (error.name === 'AbortError') {
        console.error('⏹️ Audio initialization was aborted')
      } else {
        console.error('🔧 Unknown audio error:', {
          name: error.name,
          message: error.message,
          code: error.code,
          stack: error.stack
        })
      }
      
      return false
    }
  }

  const startWaveformVisualization = () => {
    if (!analyserNode.value || waveformUpdateInterval.value) return

    const updateWaveform = () => {
      if (!analyserNode.value || !audioDataArray.value || !isRecording.value)
        return

      // Get frequency data from analyser
      analyserNode.value.getByteFrequencyData(audioDataArray.value)

      // Convert to normalized waveform data (20 bars)
      const newWaveformData = []
      const binSize = Math.max(1, Math.floor(audioDataArray.value.length / 20))

      for (let i = 0; i < 20; i++) {
        let sum = 0
        const startBin = i * binSize
        const endBin = Math.min(startBin + binSize, audioDataArray.value.length)

        // Average the frequency bins for this bar
        for (let j = startBin; j < endBin; j++) {
          sum += audioDataArray.value[j]
        }

        // Normalize to 0-1 range with reduced sensitivity
        const average = sum / (endBin - startBin)
        const normalized = Math.min(1.0, Math.max(0.02, (average / 255) * 1.5))
        newWaveformData.push(normalized)
      }

      waveformData.value = newWaveformData
    }

    // Update at 60 FPS for smooth visualization
    waveformUpdateInterval.value = setInterval(updateWaveform, 16)
    console.log('🎵 Waveform visualization started')
  }

  const stopWaveformVisualization = () => {
    if (waveformUpdateInterval.value) {
      clearInterval(waveformUpdateInterval.value)
      waveformUpdateInterval.value = null
      waveformData.value = new Array(20).fill(0)
      console.log('🔇 Waveform visualization stopped')
    }
  }

  const float32ArrayToWav = (samples, sampleRate = 16000) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2)
    const view = new DataView(buffer)

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, samples.length * 2, true)

    // Convert float32 to int16
    let index = 44
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]))
      const val = s < 0 ? s * 0x8000 : s * 0x7fff
      view.setInt16(index, val, true)
      index += 2
    }

    return buffer
  }

  const processVADAudio = async (audioFloat32Array) => {
    if (!audioFloat32Array || audioFloat32Array.length === 0) {
      console.warn('⚠️ No VAD audio data to process')
      return
    }

    try {
      // Processing VAD speech segment

      // Convert to WAV format
      const wavBuffer = float32ArrayToWav(audioFloat32Array, 16000)

      // Send to backend for transcription
      if (window.electronAPI) {
        try {
          // Convert to base64 safely to avoid stack overflow
          const uint8Array = new Uint8Array(wavBuffer)
          
          // Use chunked conversion to avoid stack overflow with large arrays
          let binaryString = ''
          const chunkSize = 8192
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            const chunk = uint8Array.slice(i, i + chunkSize)
            binaryString += String.fromCharCode(...chunk)
          }
          const base64Audio = btoa(binaryString)
          
          const result = await window.electronAPI.sendToBackend({
            type: 'transcribe_audio',
            audio_data: base64Audio,
            sample_rate: 16000,
          })
          
          if (!result || !result.success) {
            console.warn('⚠️ Backend communication failed:', result?.error)
          }
        } catch (ipcError) {
          console.error('❌ IPC communication error:', ipcError)
        }
      }
    } catch (error) {
      console.error('❌ Error processing VAD audio:', error)
    }
  }


  const initializeVAD = async () => {
    if (vadInstance.value || isVadInitializing.value) {
      console.log('VAD already initialized or initializing')
      return
    }

    console.log('🎙️ Initializing VAD...')
    isVadInitializing.value = true

    try {
      // Ensure audio context is initialized
      if (!audioContext.value) {
        const success = await initializeAudioContext()
        if (!success) {
          throw new Error('Failed to initialize audio context')
        }
      }

      const vad_instance = await vad.MicVAD.new({
        onSpeechStart: () => {
          // Only respond to VAD if we're actively recording
          if (!isRecording.value || !isListening.value) {
            return
          }
          
          isSpeechDetected.value = true
          lastVadActivityTime.value = Date.now()
          console.log('🗣️ Speech started - VAD will process final audio')
        },
        onSpeechEnd: audio => {
          // Only respond to VAD if we're actively recording
          if (!isRecording.value || !isListening.value) {
            return
          }
          
          console.log(`🔇 Speech ended: ${audio?.length} samples`)
          isSpeechDetected.value = false

          // Process the final VAD audio chunk which contains the complete speech segment
          if (audio && audio.length > 0) {
            // Processing complete VAD speech segment
            processVADAudio(audio)
          }
        },
        // Use default model paths (will be loaded from node_modules)
      })

      vadInstance.value = vad_instance
      console.log('✅ VAD initialized successfully')
    } catch (error) {
      console.error('❌ VAD initialization failed:', error)
    } finally {
      isVadInitializing.value = false
    }
  }

  const destroyVAD = async () => {
    if (!vadInstance.value) return

    console.log('🗑️ Destroying VAD...')
    try {
      vadInstance.value.pause()
      vadInstance.value = null
    } catch (error) {
      console.error('❌ Error destroying VAD:', error)
    }

    isSpeechDetected.value = false
  }

  const cleanupAudio = () => {
    stopWaveformVisualization()

    if (mediaStreamSource.value) {
      mediaStreamSource.value.disconnect()
      mediaStreamSource.value = null
    }

    if (analyserNode.value) {
      analyserNode.value.disconnect()
      analyserNode.value = null
    }

    if (audioContext.value) {
      audioContext.value.close()
      audioContext.value = null
    }

    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach(track => track.stop())
      mediaStream.value = null
    }


    audioDataArray.value = null
  }

  const startRecording = async () => {
    if (isRecording.value) return

    console.log('🎬 Starting recording - initializing audio and VAD')

    // Initialize audio context if needed
    if (!audioContext.value) {
      const success = await initializeAudioContext()
      if (!success) {
        console.error(
          'Failed to start recording: Audio context initialization failed'
        )
        return
      }
    }

    // Initialize VAD if needed
    if (!vadInstance.value) {
      await initializeVAD()
    }

    // Start VAD and set recording state BEFORE starting VAD to prevent race conditions
    isRecording.value = true
    isListening.value = true

    if (vadInstance.value) {
      vadInstance.value.start()
      console.log('✅ VAD started for recording session')
    }

    startWaveformVisualization()
  }

  const stopRecording = async () => {
    if (!isRecording.value) return

    console.log('🛑 Stopping recording - pausing VAD and cleaning up')

    // Stop recording state FIRST to prevent VAD from processing during shutdown
    isRecording.value = false
    isListening.value = false
    isSpeechDetected.value = false

    // Pause VAD
    if (vadInstance.value) {
      vadInstance.value.pause()
      console.log('✅ VAD paused for recording session')
    }

    stopWaveformVisualization()

    // Send session completion message to backend
    if (window.electronAPI) {
      await window.electronAPI.sendToBackend({
        type: 'frontend_recording_stopped',
      })
    }
    
    console.log('🛑 Frontend recording stopped - session completion sent to backend')
  }

  const toggleRecording = async () => {
    if (isRecording.value) {
      await stopRecording()
    } else {
      await startRecording()
    }
  }

  // Cleanup on unmount
  onUnmounted(async () => {
    await stopRecording()
    await destroyVAD()
    cleanupAudio()
  })

  return {
    // State
    isRecording,
    isListening,
    isSpeechDetected,
    isVadInitializing,
    waveformData,
    lastVadActivityTime,

    // Methods
    startRecording,
    stopRecording,
    toggleRecording,
    initializeVAD,
    destroyVAD,
  }
}
