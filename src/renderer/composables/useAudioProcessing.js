import { ref, watch, onUnmounted, onMounted } from 'vue'
import * as vad from '@ricky0123/vad-web'

export function useAudioProcessing() {
  // VAD instance
  const vadInstance = ref(null)
  const isVadInitializing = ref(false)
  const isListening = ref(false)
  const isSpeechDetected = ref(false)
  
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
      // Request microphone access
      mediaStream.value = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Create audio context
      audioContext.value = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      })
      
      // Create source and analyser
      mediaStreamSource.value = audioContext.value.createMediaStreamSource(mediaStream.value)
      analyserNode.value = audioContext.value.createAnalyser()
      
      // Configure analyser for waveform visualization
      analyserNode.value.fftSize = 64  // Small FFT for 20 frequency bins
      analyserNode.value.smoothingTimeConstant = 0.3
      
      // Connect audio graph
      mediaStreamSource.value.connect(analyserNode.value)
      
      // Initialize audio data array
      audioDataArray.value = new Uint8Array(analyserNode.value.frequencyBinCount)
      
      // Initialize MediaRecorder for 1-second chunked streaming
      chunkingMediaRecorder.value = new MediaRecorder(mediaStream.value, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000
      })
      
      chunkingMediaRecorder.value.ondataavailable = async (event) => {
        if (event.data.size > 0 && isStreamingChunks.value) {
          console.log(`📦 Processing 1-second chunk: ${event.data.size} bytes`)
          await processAudioChunk(event.data)
        }
      }
      
      console.log('✅ Audio context initialized successfully')
      return true
      
    } catch (error) {
      console.error('❌ Failed to initialize audio context:', error)
      return false
    }
  }
  
  const startWaveformVisualization = () => {
    if (!analyserNode.value || waveformUpdateInterval.value) return
    
    const updateWaveform = () => {
      if (!analyserNode.value || !audioDataArray.value || !isRecording.value) return
      
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
  
  const processAudioRecording = async (audioFloat32Array) => {
    if (!audioFloat32Array || audioFloat32Array.length === 0) {
      console.warn('⚠️ No audio data to process')
      return
    }
    
    try {
      console.log(`🎤 Processing VAD audio: ${audioFloat32Array.length} samples`)
      
      // Convert to WAV format
      const wavBuffer = float32ArrayToWav(audioFloat32Array, 16000)
      
      // Send to backend for transcription
      if (window.electronAPI) {
        await window.electronAPI.sendToBackend({
          type: 'transcribe_audio',
          audio_data: Array.from(new Uint8Array(wavBuffer)),
          sample_rate: 16000
        })
      }
      
    } catch (error) {
      console.error('❌ Error processing VAD audio:', error)
    }
  }
  
  const processAudioChunk = async (audioBlob) => {
    try {
      console.log(`📦 Processing 1-second chunk: ${audioBlob.size} bytes`)
      
      // Convert WebM audio to Float32Array using Web Audio API
      const arrayBuffer = await audioBlob.arrayBuffer()
      
      if (arrayBuffer.byteLength === 0) {
        console.log('⚠️ Empty audio chunk, skipping')
        return
      }
      
      const audioBuffer = await audioContext.value.decodeAudioData(arrayBuffer)
      
      // Extract audio samples (mono channel)
      const audioSamples = audioBuffer.getChannelData(0)
      
      // Convert to WAV format
      const wavBuffer = float32ArrayToWav(audioSamples, audioBuffer.sampleRate)
      
      // Send to backend for transcription
      if (window.electronAPI) {
        await window.electronAPI.sendToBackend({
          type: 'transcribe_audio',
          audio_data: Array.from(new Uint8Array(wavBuffer)),
          sample_rate: audioBuffer.sampleRate
        })
      }
      
    } catch (error) {
      console.warn('⚠️ Error processing 1-second chunk:', error.message)
    }
  }
  
  const startChunkedStreaming = () => {
    if (!chunkingMediaRecorder.value || isStreamingChunks.value) return
    
    try {
      isStreamingChunks.value = true
      // Start recording in 1-second chunks
      chunkingMediaRecorder.value.start(1000) // 1000ms = 1 second
      console.log('🎬 Started 1-second chunked streaming')
    } catch (error) {
      console.error('❌ Error starting chunked streaming:', error)
      isStreamingChunks.value = false
    }
  }
  
  const stopChunkedStreaming = () => {
    if (!chunkingMediaRecorder.value || !isStreamingChunks.value) return
    
    try {
      if (chunkingMediaRecorder.value.state === 'recording') {
        chunkingMediaRecorder.value.stop()
      }
      isStreamingChunks.value = false
      console.log('🛑 Stopped 1-second chunked streaming')
    } catch (error) {
      console.error('❌ Error stopping chunked streaming:', error)
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
          isSpeechDetected.value = true
          lastVadActivityTime.value = Date.now()
          console.log('🗣️ Speech started - beginning 1-second chunked streaming')
          startChunkedStreaming()
        },
        onSpeechEnd: (audio) => {
          console.log(`🔇 Speech ended: ${audio?.length} samples`)
          isSpeechDetected.value = false
          
          // Stop chunked streaming and process final VAD chunk
          stopChunkedStreaming()
          
          if (isListening.value && audio && audio.length > 0) {
            processAudioRecording(audio)
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
    
    // Clean up 1-second chunked MediaRecorder
    if (chunkingMediaRecorder.value && chunkingMediaRecorder.value.state !== 'inactive') {
      chunkingMediaRecorder.value.stop()
    }
    chunkingMediaRecorder.value = null
    isStreamingChunks.value = false
    
    audioDataArray.value = null
  }
  
  const startRecording = async () => {
    if (isRecording.value) return
    
    // Initialize audio context if needed
    if (!audioContext.value) {
      const success = await initializeAudioContext()
      if (!success) {
        console.error('Failed to start recording: Audio context initialization failed')
        return
      }
    }
    
    if (!vadInstance.value) {
      await initializeVAD()
    }
    
    if (vadInstance.value) {
      vadInstance.value.start()
      isListening.value = true
    }
    
    startWaveformVisualization()
    
    isRecording.value = true
  }
  
  const stopRecording = async () => {
    if (!isRecording.value) return
    
    // Stop any ongoing chunked streaming
    stopChunkedStreaming()
    
    if (vadInstance.value) {
      vadInstance.value.pause()
      isListening.value = false
    }
    
    stopWaveformVisualization()
    
    if (window.electronAPI) {
      await window.electronAPI.sendToBackend({
        type: 'frontend_recording_stopped'
      })
    }
    
    isRecording.value = false
    isSpeechDetected.value = false
    
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
    
    // Methods
    startRecording,
    stopRecording,
    toggleRecording,
    initializeVAD,
    destroyVAD
  }
}