import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAppStore = defineStore('app', () => {
  // State
  const isRecording = ref(false)
  const currentText = ref('')
  const elapsedTime = ref(0)
  const audioSource = ref('microphone') // 'system' | 'microphone'
  const waveformData = ref([])
  const sessions = ref([])
  const preferences = ref({
    audioSource: 'microphone',
    language: 'auto',
    model: 'base',
    vadSensitivity: 50,
    copyMode: 'current',
    copyMinutes: 5,
    theme: 'system',
    overlayFontSize: 16,
    shortcuts: {
      startStop: 'Alt+Shift+S',
      copy: 'Alt+Shift+C',
      toggleOverlay: 'Alt+Shift+O'
    },
    checkForUpdates: false,
    telemetry: false
  })

  // Computed
  const formattedTime = computed(() => {
    const minutes = Math.floor(elapsedTime.value / 60).toString().padStart(2, '0')
    const seconds = (elapsedTime.value % 60).toString().padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  const isDarkMode = computed(() => {
    if (preferences.value.theme === 'dark') return true
    if (preferences.value.theme === 'light') return false
    // System preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Actions
  const updateRecordingState = (recording) => {
    isRecording.value = recording
  }

  const updateCurrentText = (text) => {
    currentText.value = text
  }

  const updateElapsedTime = (time) => {
    elapsedTime.value = time
  }

  const updateWaveformData = (data) => {
    waveformData.value = data
  }

  const updateAudioSource = (source) => {
    audioSource.value = source
  }

  const updatePreferences = (newPreferences) => {
    preferences.value = { ...preferences.value, ...newPreferences }
  }

  const loadSessions = async () => {
    try {
      // This would load from the backend
      // For now, return empty array
      sessions.value = []
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const addSession = (session) => {
    sessions.value.unshift(session)
  }

  // Initialize store
  const initialize = async () => {
    try {
      // Load preferences from electron store
      const savedPreferences = await window.electronAPI?.getStoreValue('preferences')
      if (savedPreferences) {
        updatePreferences(savedPreferences)
      }
      
      // Load sessions
      await loadSessions()
    } catch (error) {
      console.error('Failed to initialize app store:', error)
    }
  }

  return {
    // State
    isRecording,
    currentText,
    elapsedTime,
    audioSource,
    waveformData,
    sessions,
    preferences,
    
    // Computed
    formattedTime,
    isDarkMode,
    
    // Actions
    updateRecordingState,
    updateCurrentText,
    updateElapsedTime,
    updateWaveformData,
    updateAudioSource,
    updatePreferences,
    loadSessions,
    addSession,
    initialize
  }
})