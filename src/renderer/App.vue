<template>
  <div
    class="w-full h-full font-sans antialiased overflow-hidden bg-transparent rounded-full transition-all duration-200 p-3"
    :class="{ 'dark-mode': isDarkMode }"
  >
    <TranscriptWindow v-if="isTranscriptMode" @close="closeWindow" />

    <ArchiveWindow v-else-if="isArchiveMode" @close="closeWindow" />

    <SettingsWindow v-else-if="isSettingsMode" @close="closeWindow" />

    <template v-else>
      <CapsuleBar
        :is-recording="transcriptionStore.isRecording"
        :elapsed-time="transcriptionStore.elapsedTime"
        :waveform-data="transcriptionStore.waveformData"
        :is-dark-mode="isDarkMode"
        :is-connected="transcriptionStore.isConnected"
        :transcript-window-open="transcriptWindowOpen"
        :archive-window-open="archiveWindowOpen"
        @toggle-recording="handleToggleRecording"
        @show-transcript="handleShowTranscript"
        @show-archive="handleShowArchive"
        @show-settings="handleShowSettings"
        @minimize="minimizeWindow"
        @close="closeWindow"
      />


    </template>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from './stores/app'
import { useTranscriptionStore } from './stores/transcription'
import CapsuleBar from './components/CapsuleBar.vue'
import ArchiveWindow from './components/ArchiveWindow.vue'
import SettingsWindow from './components/SettingsWindow.vue'
import TranscriptWindow from './components/TranscriptWindow.vue'

export default {
  name: 'App',
  components: {
    CapsuleBar,
    ArchiveWindow,
    SettingsWindow,
    TranscriptWindow,
  },
  setup() {
    const appStore = useAppStore()
    const transcriptionStore = useTranscriptionStore()

    const isTranscriptMode = ref(false)
    const isArchiveMode = ref(false)
    const isSettingsMode = ref(false)

    const isDarkMode = ref(true)

    const transcriptWindowOpen = ref(false)
    const archiveWindowOpen = ref(false)

    let recordingStartTime = 0
    let timerInterval = null

    const startTimer = () => {
      recordingStartTime = Date.now()
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000)
        if (window.electronAPI) {
          window.electronAPI.updateAppState({ elapsedTime: elapsed })
        }
      }, 1000)
    }

    const stopTimer = () => {
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }
      if (window.electronAPI) {
        window.electronAPI.updateAppState({ elapsedTime: 0 })
      }
    }

    const handleBackendMessage = async (event, message) => {
      if (message.type === 'recording_started') {
        startTimer()
      } else if (message.type === 'recording_stopped') {
        stopTimer()
        
        // Copy transcript to clipboard when recording stops
        if (message.transcript && message.transcript.trim()) {
          try {
            await navigator.clipboard.writeText(message.transcript)
            console.log('✅ Transcript copied to clipboard')
          } catch (error) {
            console.error('❌ Failed to copy transcript to clipboard:', error)
          }
        }
      }

      transcriptionStore.handleBackendMessage(message)
    }

    watch(
      () => transcriptionStore.isRecording,
      (newIsRecording, oldIsRecording) => {
        // Timer state watch triggered
        if (newIsRecording && !oldIsRecording) {
          // Starting timer - recording began
          startTimer()
        } else if (!newIsRecording && oldIsRecording) {
          // Stopping timer - recording ended
          stopTimer()
        }
      }
    )

    const handleToggleRecording = async () => {
      // Toggle recording clicked
      await transcriptionStore.toggleRecording()
    }

    const minimizeWindow = () => {
      if (window.electronAPI) {
        window.electronAPI.minimizeWindow()
      } else {
        console.log('Minimize window (browser mode)')
      }
    }

    const closeWindow = () => {
      if (window.electronAPI) {
        window.electronAPI.closeWindow()
      } else {
        console.log('Close window (browser mode)')
        window.close()
      }
    }

    const handleShowTranscript = () => {
      // Show transcript clicked
      if (window.electronAPI) {
        if (transcriptWindowOpen.value) {
          window.electronAPI.closeTranscript()
          transcriptWindowOpen.value = false
        } else {
          window.electronAPI.showTranscript()
          transcriptWindowOpen.value = true
        }
      }
    }

    const handleShowArchive = () => {
      if (window.electronAPI) {
        if (archiveWindowOpen.value) {
          window.electronAPI.closeArchive()
          archiveWindowOpen.value = false
        } else {
          window.electronAPI.showArchive()
          archiveWindowOpen.value = true
        }
      }
    }

    const handleShowSettings = () => {
      if (window.electronAPI) {
        window.electronAPI.showSettings()
      }
    }


    onMounted(async () => {
      const urlParams = new URLSearchParams(window.location.search)
      isTranscriptMode.value = urlParams.get('mode') === 'transcript'
      isArchiveMode.value = urlParams.get('mode') === 'archive'
      isSettingsMode.value = urlParams.get('mode') === 'settings'

      if (window.electronAPI) {
        try {
          window.electronAPI.onBackendMessage(handleBackendMessage)

          if (!isTranscriptMode.value && !isArchiveMode.value && !isSettingsMode.value) {


            window.electronAPI.onTranscriptWindowClosed(() => {
              transcriptWindowOpen.value = false
              console.log('📋 Transcript window closed')
            })
            window.electronAPI.onArchiveWindowClosed(() => {
              archiveWindowOpen.value = false
              console.log('📚 Archive window closed')
            })
            
            // Listen for theme changes
            window.electronAPI.onThemeChanged((event, theme) => {
              isDarkMode.value = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
              document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
              console.log('Theme changed:', theme, 'Dark mode:', isDarkMode.value)
            })
          }

          const theme = await window.electronAPI.getStoreValue('theme')
          isDarkMode.value =
            theme === null || theme === undefined || theme !== 'light'

          document.documentElement.classList.toggle(
            'dark-mode',
            isDarkMode.value
          )
          console.log('Theme loaded:', theme, 'Dark mode:', isDarkMode.value)
        } catch (error) {
          console.warn('Failed to initialize Electron APIs:', error)
        }
      } else {
        console.log('Running in browser mode - Electron APIs not available')
        isDarkMode.value = true
        document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
        console.log('Browser mode - Dark mode forced:', isDarkMode.value)
      }
    })

    onUnmounted(() => {
      if (window.electronAPI) {
        try {
          window.electronAPI.removeAllListeners('backend-message')
          window.electronAPI.removeAllListeners('show-preferences')
          window.electronAPI.removeAllListeners('show-preferences-first-run')
          window.electronAPI.removeAllListeners('theme-changed')
        } catch (error) {
          console.warn('Error cleaning up Electron listeners:', error)
        }
      }

      stopTimer()
      transcriptionStore.cleanup()
    })

    return {
      isTranscriptMode,
      isArchiveMode,
      isSettingsMode,
      transcriptionStore,
      isDarkMode,
      transcriptWindowOpen,
      archiveWindowOpen,
      handleToggleRecording,
      handleShowTranscript,
      handleShowArchive,
      handleShowSettings,
      minimizeWindow,
      closeWindow,
    }
  },
}
</script>

<style>
.dark-mode {
  color-scheme: dark;
}

/* Global transitions */
* {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
