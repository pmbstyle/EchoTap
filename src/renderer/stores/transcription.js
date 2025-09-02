import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTranscriptionStore = defineStore('transcription', () => {
  // State
  const isConnected = ref(false)
  const isRecording = ref(false)
  const currentSessionId = ref(null)
  const elapsedTime = ref(0)
  
  // Transcription text management
  const partialText = ref('')
  const finalText = ref('')
  const displayText = ref('')
  const sessionTranscript = ref('') // Accumulated final transcripts for the session
  const isFinal = ref(false)
  
  // Audio visualization
  const waveformData = ref([])
  const audioSource = ref('microphone') // 'microphone' | 'system_audio'
  
  // Session management
  const sessions = ref([])
  const currentSession = ref(null)
  
  // Typing effect state
  const isTyping = ref(false)
  const typingQueue = ref([])
  let typingTimer = null
  
  // Computed
  const formattedTime = computed(() => {
    const minutes = Math.floor(elapsedTime.value / 60).toString().padStart(2, '0')
    const seconds = (elapsedTime.value % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  })
  
  const wordCount = computed(() => {
    // Use sessionTranscript for accurate count, fallback to displayText
    const textToCount = sessionTranscript.value || displayText.value
    if (!textToCount) return 0
    return textToCount.trim().split(/\s+/).length
  })
  
  const charCount = computed(() => {
    // Use sessionTranscript for accurate count, fallback to displayText
    const textToCount = sessionTranscript.value || displayText.value
    return textToCount.length
  })
  
  // Typing effect functions
  const typeText = (text, speed = 25) => {
    return new Promise((resolve) => {
      if (!text) {
        resolve()
        return
      }
      
      stopTyping()
      isTyping.value = true
      let currentIndex = 0
      const targetText = displayText.value + text
      
      const typeChar = () => {
        if (currentIndex >= text.length) {
          isTyping.value = false
          displayText.value = targetText
          resolve()
          return
        }
        
        displayText.value = targetText.slice(0, displayText.value.length + currentIndex + 1)
        currentIndex++
        
        // Add natural variation to typing speed
        const variation = Math.random() * 10 - 5 // ±5ms
        const nextSpeed = Math.max(5, speed + variation)
        
        typingTimer = setTimeout(typeChar, nextSpeed)
      }
      
      typeChar()
    })
  }
  
  const replaceText = (newText, speed = 15) => {
    return new Promise((resolve) => {
      stopTyping()
      displayText.value = ''
      typeText(newText, speed).then(resolve)
    })
  }
  
  const appendText = (newText, speed = 25) => {
    if (!newText) return Promise.resolve()
    return typeText(newText, speed)
  }
  
  const stopTyping = () => {
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
    isTyping.value = false
  }
  
  const instantText = (text) => {
    stopTyping()
    displayText.value = text
  }
  
  // WebSocket message handlers
  const handleConnectionStatus = (connected) => {
    isConnected.value = connected
    console.log('📡 Backend connection:', connected ? 'Connected' : 'Disconnected')
  }
  
  const handleRecordingStarted = (data) => {
    isRecording.value = true
    currentSessionId.value = data.session_id
    elapsedTime.value = 0
    
    // Clear previous text
    displayText.value = ''
    partialText.value = ''
    finalText.value = ''
    sessionTranscript.value = ''
    isFinal.value = false
    
    console.log('🎤 Recording started, session:', data.session_id)
  }
  
  const handleRecordingStopped = (data) => {
    isRecording.value = false
    stopTyping()
    
    // Create session record
    if (displayText.value.trim()) {
      const session = {
        id: currentSessionId.value || Date.now().toString(),
        text: displayText.value,
        timestamp: new Date().toISOString(),
        duration: elapsedTime.value,
        wordCount: wordCount.value,
        source: audioSource.value
      }
      sessions.value.unshift(session)
    }
    
    currentSessionId.value = null
    console.log('⏹️ Recording stopped, session:', data.session_id)
  }
  
  const handlePartialTranscript = async (data) => {
    if (!isRecording.value) return
    
    const newText = data.text?.trim()
    if (!newText) return
    
    partialText.value = newText
    isFinal.value = false
    
    // Simple accumulation: if this text is different from what we have, it's a new segment
    const currentTranscriptWords = sessionTranscript.value.split(' ').filter(w => w.length > 0)
    const newTextWords = newText.split(' ').filter(w => w.length > 0)
    
    // Check if this is a new segment by comparing word overlap
    const isNewSegment = !newTextWords.every(word => 
      currentTranscriptWords.some(existing => existing.includes(word) || word.includes(existing))
    )
    
    if (isNewSegment || !sessionTranscript.value) {
      // This is a new segment - accumulate it and animate only the new part
      if (sessionTranscript.value) {
        const newSegmentText = ' ' + newText
        sessionTranscript.value += newSegmentText
        
        // Only animate the new segment, not the whole transcript
        await appendText(newSegmentText, 25)
      } else {
        // First segment - animate the whole thing
        sessionTranscript.value = newText
        await replaceText(newText, 25)
      }
      console.log(`✅ New segment accumulated: "${newText}"`)
      console.log(`📋 Full session: "${sessionTranscript.value}"`)
    } else {
      console.log(`⏭️ Skipped duplicate: "${newText}"`)
    }
    
    const sourceInfo = data.source ? `[${data.source}]` : ''
    console.log(`📝 Partial ${sourceInfo}:`, newText)
  }
  
  const handleFinalTranscript = async (data) => {
    if (!isRecording.value) return
    
    finalText.value = data.text
    isFinal.value = true
    
    // Accumulate final transcript to session
    if (data.text && data.text.trim()) {
      if (sessionTranscript.value) {
        sessionTranscript.value += ' ' + data.text.trim()
      } else {
        sessionTranscript.value = data.text.trim()
      }
      
      // Update display text to show full session
      await replaceText(sessionTranscript.value, 20) // Medium speed for final text
    }
    
    const sourceInfo = data.source ? `[${data.source}]` : ''
    console.log(`✅ Final ${sourceInfo}:`, data.text?.substring(0, 50) + '...')
    console.log(`📋 Session transcript now:`, sessionTranscript.value?.substring(0, 100) + '...')
  }
  
  const handleWaveformData = (data) => {
    waveformData.value = data.data || []
  }
  
  const handleSourceChanged = (data) => {
    audioSource.value = data.source
    console.log('🔄 Audio source changed to:', data.source)
  }
  
  const handleBackendStatus = (data) => {
    console.log('📊 Backend status received:', data)
    
    // Sync frontend state with backend
    isRecording.value = data.is_recording || false
    currentSessionId.value = data.current_session_id || null
    audioSource.value = data.audio_source || 'microphone'
    
    // If we're recording and have a current transcript, populate sessionTranscript
    if (data.is_recording && data.current_transcript) {
      console.log('📋 Populating sessionTranscript from backend:', data.current_transcript.substring(0, 100) + '...')
      sessionTranscript.value = data.current_transcript
      displayText.value = data.current_transcript
    }
    
    console.log('🔄 State synchronized:', {
      recording: isRecording.value,
      session: currentSessionId.value,
      source: audioSource.value,
      transcriptLength: sessionTranscript.value?.length || 0
    })
  }

  const handleError = (data) => {
    console.error('❌ Transcription error:', data.error)
    // Optionally show error to user
  }
  
  // Main message dispatcher
  const handleBackendMessage = (message) => {
    switch (message.type) {
      case 'connection_status':
        handleConnectionStatus(message.connected)
        break
      case 'recording_started':
        handleRecordingStarted(message)
        break
      case 'recording_stopped':
        handleRecordingStopped(message)
        break
      case 'partial_transcript':
        handlePartialTranscript(message)
        break
      case 'final_transcript':
        handleFinalTranscript(message)
        break
      case 'waveform_data':
        handleWaveformData(message)
        break
      case 'source_changed':
        handleSourceChanged(message)
        break
      case 'backend_status':
        handleBackendStatus(message)
        break
      case 'error':
        handleError(message)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }
  
  // Actions
  const toggleRecording = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'toggle_recording'
        })
      } catch (error) {
        console.error('Error toggling recording:', error)
      }
    }
  }
  
  const startRecording = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'start_recording'
        })
      } catch (error) {
        console.error('Error starting recording:', error)
      }
    }
  }
  
  const stopRecording = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'stop_recording'
        })
      } catch (error) {
        console.error('Error stopping recording:', error)
      }
    }
  }
  
  const toggleSource = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'toggle_source'
        })
      } catch (error) {
        console.error('Error toggling source:', error)
      }
    }
  }
  
  const loadSessions = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'get_sessions'
        })
      } catch (error) {
        console.error('Error loading sessions:', error)
      }
    }
  }

  const queryBackendStatus = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'get_status'
        })
        console.log('📡 Queried backend status')
      } catch (error) {
        console.error('Error querying backend status:', error)
      }
    }
  }
  
  const clearCurrentText = () => {
    stopTyping()
    displayText.value = ''
    partialText.value = ''
    finalText.value = ''
    sessionTranscript.value = ''
    isFinal.value = false
  }
  
  // Cleanup
  const cleanup = () => {
    stopTyping()
  }
  
  return {
    // State
    isConnected,
    isRecording,
    currentSessionId,
    elapsedTime,
    displayText,
    partialText,
    finalText,
    sessionTranscript,
    isFinal,
    waveformData,
    audioSource,
    sessions,
    currentSession,
    isTyping,
    
    // Computed
    formattedTime,
    wordCount,
    charCount,
    
    // Actions
    handleBackendMessage,
    toggleRecording,
    startRecording,
    stopRecording,
    toggleSource,
    loadSessions,
    queryBackendStatus,
    clearCurrentText,
    instantText,
    cleanup,
    
    // Typing effects (exposed for manual control)
    typeText,
    replaceText,
    appendText,
    stopTyping
  }
})