<template>
  <div class="w-full h-full font-sans antialiased overflow-hidden bg-transparent rounded-full transition-all duration-200 p-3" :class="{ 'dark-mode': isDarkMode }">
    <TranscriptWindow
      v-if="isTranscriptMode"
      @close="closeWindow"
    />
    
    <ArchiveWindow
      v-else-if="isArchiveMode"
      @close="closeWindow"
    />
    
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
        @minimize="minimizeWindow"
        @close="closeWindow"
      />
      
      <PreferencesWindow
        v-if="showPreferences"
        @close="showPreferences = false"
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
import PreferencesWindow from './components/PreferencesWindow.vue'
import TranscriptWindow from './components/TranscriptWindow.vue'

export default {
  name: 'App',
  components: {
    CapsuleBar,
    ArchiveWindow,
    PreferencesWindow,
    TranscriptWindow,
  },
  setup() {
    const appStore = useAppStore()
    const transcriptionStore = useTranscriptionStore()
    
    const isTranscriptMode = ref(false)
    const isArchiveMode = ref(false)
    
    const showArchive = ref(false)
    const showPreferences = ref(false)
    const showTranscript = ref(false)
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

    const handleBackendMessage = (event, message) => {
      if (message.type === 'recording_started') {
        startTimer()
      } else if (message.type === 'recording_stopped') {
        stopTimer()
      }
      
      transcriptionStore.handleBackendMessage(message)
    }

    watch(
      () => transcriptionStore.isRecording,
      (newIsRecording, oldIsRecording) => {
        if (newIsRecording && !oldIsRecording) {
          console.log('⏰ Starting timer - recording began')
          startTimer()
        } else if (!newIsRecording && oldIsRecording) {
          console.log('⏰ Stopping timer - recording ended')
          stopTimer()
        }
      }
    )

    const handleToggleRecording = async () => {
      console.log('🎤 Toggle recording clicked, current state:', transcriptionStore.isRecording)
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
      console.log('📋 Show transcript clicked, current window state:', transcriptWindowOpen.value)
      if (window.electronAPI) {
        if (transcriptWindowOpen.value) {
          window.electronAPI.closeTranscript()
          transcriptWindowOpen.value = false
        } else {
          window.electronAPI.showTranscript()
          transcriptWindowOpen.value = true
        }
      } else {
        showTranscript.value = !showTranscript.value
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
      } else {
        showArchive.value = !showArchive.value
      }
    }

    const handleCopyTranscript = () => {
      if (currentText.value) {
        navigator.clipboard.writeText(currentText.value).catch(error => {
          console.warn('Failed to copy to clipboard:', error)
        })
      }
    }

    onMounted(async () => {
      const urlParams = new URLSearchParams(window.location.search)
      isTranscriptMode.value = urlParams.get('mode') === 'transcript'
      isArchiveMode.value = urlParams.get('mode') === 'archive'

      if (window.electronAPI) {
        try {
          window.electronAPI.onBackendMessage(handleBackendMessage)
          
          if (!isTranscriptMode.value && !isArchiveMode.value) {
            window.electronAPI.onShowPreferences(() => {
              showPreferences.value = true
            })
            window.electronAPI.onCopyTranscript(handleCopyTranscript)
            window.electronAPI.onToggleOverlay(handleToggleOverlay)
            
            window.electronAPI.onTranscriptWindowClosed(() => {
              transcriptWindowOpen.value = false
              console.log('📋 Transcript window closed')
            })
            window.electronAPI.onArchiveWindowClosed(() => {
              archiveWindowOpen.value = false
              console.log('📚 Archive window closed')
            })
          }

          const theme = await window.electronAPI.getStoreValue('theme')
          isDarkMode.value = (theme === null || theme === undefined || theme !== 'light')

          document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
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
          window.electronAPI.removeAllListeners('copy-transcript')
          window.electronAPI.removeAllListeners('toggle-overlay')
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
      transcriptionStore,
      showArchive,
      showPreferences,
      showTranscript,
      isDarkMode,
      handleToggleRecording,
      handleShowTranscript,
      handleShowArchive,
      minimizeWindow,
      closeWindow
    }
  }
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