import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAudioProcessing } from '../composables/useAudioProcessing.js'

export const useTranscriptionStore = defineStore('transcription', () => {
  let audioProcessing = null

  const urlParams = new URLSearchParams(window.location.search)
  const isMainWindow = !urlParams.get('mode')

  if (isMainWindow) {
    audioProcessing = useAudioProcessing()
  }

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
    charCount: 0,
  })

  const sessions = ref([])
  const isRecording = computed(() => globalState.value.isRecording)
  const isListening = computed(
    () =>
      globalState.value.isListening ||
      audioProcessing?.isListening?.value ||
      false
  )
  const isSpeechDetected = computed(
    () => audioProcessing?.isSpeechDetected?.value || false
  )
  const currentSessionId = computed(() => globalState.value.currentSessionId)
  const elapsedTime = computed(() => globalState.value.elapsedTime)
  const displayText = computed(() => globalState.value.displayText)
  const sessionTranscript = computed(() => globalState.value.sessionTranscript)
  const partialText = computed(() => globalState.value.partialText)
  const isFinal = computed(() => globalState.value.isFinal)
  const isConnected = computed(() => globalState.value.isConnected)
  const audioSource = computed(() => globalState.value.audioSource)
  const waveformData = computed(
    () => audioProcessing?.waveformData?.value || globalState.value.waveformData
  )
  const currentSession = computed(() => globalState.value.currentSession)
  const wordCount = computed(() => globalState.value.wordCount)
  const charCount = computed(() => globalState.value.charCount)

  const formattedTime = computed(() => {
    const minutes = Math.floor(globalState.value.elapsedTime / 60)
      .toString()
      .padStart(2, '0')
    const seconds = (globalState.value.elapsedTime % 60)
      .toString()
      .padStart(2, '0')
    return `${minutes}:${seconds}`
  })


  const initializeGlobalState = async () => {
    if (window.electronAPI) {
      try {
        const initialState = await window.electronAPI.getAppState()
        globalState.value = { ...globalState.value, ...initialState }

        window.electronAPI.onAppStateChanged((event, newState) => {
          const currentRecording = globalState.value.isRecording
          const newRecording = newState.isRecording
          
          if (isMainWindow && currentRecording && !newRecording && audioProcessing?.isRecording?.value) {
            const stateWithoutRecording = { ...newState }
            delete stateWithoutRecording.isRecording
            delete stateWithoutRecording.isListening
            globalState.value = { ...globalState.value, ...stateWithoutRecording }
          } else {
            globalState.value = { ...globalState.value, ...newState }
          }
        })

        if (isMainWindow && audioProcessing) {
          watch(
            () => audioProcessing.isRecording.value,
            (newRecording, oldRecording) => {
              if (window.electronAPI) {
                window.electronAPI.updateAppState({ isRecording: newRecording })
              }
            },
            { immediate: true }
          )

          watch(
            () => audioProcessing.isListening.value,
            newListening => {
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

  const handleBackendMessage = message => {
    switch (message.type) {
      case 'sessions_list':
        if (message.sessions) {
          sessions.value = message.sessions
        }
        break
      case 'session_completed':
        console.log(
          '🔄 Session completed, refreshing archive...',
          message.session_id
        )
        loadSessions()
        break
      case 'session_transcript':
      case 'session_deleted':
        break
      case 'hotkey_toggle_recording':
        if (isMainWindow && audioProcessing) {
          console.log('⌨️ Hotkey toggle received, toggling recording...')
          audioProcessing.toggleRecording()
        }
        break
      default:
        break
    }
  }

  const toggleRecording = async () => {
    if (!isMainWindow) {
      return
    }

    try {
      if (audioProcessing) {
        await audioProcessing.toggleRecording()
      }
    } catch (error) {}
  }

  const loadSessions = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.sendToBackend({
          type: 'get_sessions',
        })
      } catch (error) {
        console.error('Error loading sessions:', error)
      }
    }
  }

  const queryBackendStatus = async () => {
    if (window.electronAPI) {
      await window.electronAPI.sendToBackend({ type: 'get_status' })
    }
  }

  initializeGlobalState()

  const cleanup = () => {}

  return {
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
    sessions,
    formattedTime,
    toggleRecording,
    queryBackendStatus,
    loadSessions,
    initializeGlobalState,
    handleBackendMessage,
    cleanup,
  }
})
