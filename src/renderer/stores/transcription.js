import { defineStore } from 'pinia'
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAudioProcessing } from '../composables/useAudioProcessing.js'

export const useTranscriptionStore = defineStore('transcription', () => {
  // Initialize audio processing (only for main window that controls recording)
  let audioProcessing = null
  
  // Check if this window should have audio processing (main window only)
  const urlParams = new URLSearchParams(window.location.search)
  const isMainWindow = !urlParams.get('mode') // No mode param = main window
  console.log(`🪟 Window initialized: mode=${urlParams.get('mode')}, isMainWindow=${isMainWindow}`)
  
  if (isMainWindow) {
    audioProcessing = useAudioProcessing()
  }
  
  // Global state from main process (reactive)
  const globalState = ref({
    isRecording: false,
    isListening: false,
    currentSessionId: null,
    elapsedTime: 0,
    displayText: '',
    sessionTranscript: '',
    partialText: '',
    isFinal: false,
    isConnected: false,
    audioSource: 'microphone',
    waveformData: new Array(20).fill(0),
    currentSession: null,
    wordCount: 0,
    charCount: 0
  })
  
  // Session management (local to each window)
  const sessions = ref([])
  
  
  // Computed properties that expose global state reactively
  const isRecording = computed(() => globalState.value.isRecording)
  const isListening = computed(() => globalState.value.isListening || (audioProcessing?.isListening?.value || false))
  const isSpeechDetected = computed(() => audioProcessing?.isSpeechDetected?.value || false)
  const currentSessionId = computed(() => globalState.value.currentSessionId)
  const elapsedTime = computed(() => globalState.value.elapsedTime)
  const displayText = computed(() => globalState.value.displayText)
  const sessionTranscript = computed(() => globalState.value.sessionTranscript)
  const partialText = computed(() => globalState.value.partialText)
  const isFinal = computed(() => globalState.value.isFinal)
  const isConnected = computed(() => globalState.value.isConnected)
  const audioSource = computed(() => globalState.value.audioSource)
  const waveformData = computed(() => audioProcessing?.waveformData?.value || globalState.value.waveformData)
  const currentSession = computed(() => globalState.value.currentSession)
  const wordCount = computed(() => globalState.value.wordCount)
  const charCount = computed(() => globalState.value.charCount)
  
  const formattedTime = computed(() => {
    const minutes = Math.floor(globalState.value.elapsedTime / 60).toString().padStart(2, '0')
    const seconds = (globalState.value.elapsedTime % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
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
      
      typeText(newText, speed).then(() => {
        resolve()
      })
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
  
  // Global State Management via IPC
  const initializeGlobalState = async () => {
    if (window.electronAPI) {
      try {
        // Get initial state from main process
        const initialState = await window.electronAPI.getAppState()
        globalState.value = { ...globalState.value, ...initialState }
        
        // Listen for state changes from main process
        window.electronAPI.onAppStateChanged((event, newState) => {
          globalState.value = { ...globalState.value, ...newState }
        })
        
        // Set up audio processing state synchronization for main window
        if (isMainWindow && audioProcessing) {
          watch(
            () => audioProcessing.isRecording.value,
            (newRecording) => {
              console.log(`🎤 Audio processing recording state changed to: ${newRecording}`)
              // Update global state via IPC
              window.electronAPI.updateAppState({ isRecording: newRecording })
            },
            { immediate: true }
          )
          
          watch(
            () => audioProcessing.isListening.value,
            (newListening) => {
              window.electronAPI.updateAppState({ isListening: newListening })
            },
            { immediate: true }
          )
        }
        
      } catch (error) {
        console.error('❌ Failed to initialize global state:', error)
      }
    }
  }
  
  // Legacy backend message handler (for non-state messages like sessions_list)
  const handleBackendMessage = (message) => {
    // The main process now handles all state-related messages
    // This is only for legacy compatibility with non-state messages
    switch (message.type) {
      case 'sessions_list':
        if (message.sessions) {
          sessions.value = message.sessions
        }
        break
      case 'session_completed':
        // Auto-refresh archive when session is completed
        console.log('🔄 Session completed, refreshing archive...', message.session_id)
        loadSessions() // Remove await since this function isn't async
        break
      case 'session_transcript':
      case 'session_deleted':
        // Forward to any listeners that need these messages
        break
      default:
        // All other messages are handled by main process now
        break
    }
  }
  
  // Actions - Only main window can control recording
  const toggleRecording = async () => {
    
    if (!isMainWindow) {
      return
    }
    
    try {
      if (audioProcessing) {
        await audioProcessing.toggleRecording()
        
        // State synchronization is handled automatically by the watchers above
      } else {
      }
    } catch (error) {
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
  
  // Utility functions for backend compatibility
  const queryBackendStatus = async () => {
    if (window.electronAPI) {
      await window.electronAPI.sendToBackend({ type: 'get_status' })
    }
  }
  
  // Initialize global state when store is created
  initializeGlobalState()
  
  // Cleanup
  const cleanup = () => {
    stopTyping()
  }
  
  return {
    // Reactive State (from global state via IPC)
    isConnected,
    isRecording,
    isListening,
    isSpeechDetected,
    currentSessionId,
    elapsedTime,
    displayText,
    partialText,
    sessionTranscript,
    isFinal,
    waveformData,
    audioSource,
    currentSession,
    wordCount,
    charCount,
    
    // Local State
    sessions,
    
    // Computed
    formattedTime,
    
    // Actions
    toggleRecording,
    queryBackendStatus,
    loadSessions,
    initializeGlobalState,
    
    // Legacy compatibility
    handleBackendMessage,
    
    // Cleanup
    cleanup
  }
})