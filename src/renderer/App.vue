<template>
  <div class="w-full h-full font-sans antialiased overflow-hidden bg-transparent rounded-full transition-all duration-200 p-3" :class="{ 'dark-mode': isDarkMode }">
    <!-- Transcript Mode - Show only transcript -->
    <TranscriptWindow
      v-if="isTranscriptMode"
      @close="closeWindow"
    />
    
    <!-- Archive Mode - Show only archive -->
    <ArchiveWindow
      v-else-if="isArchiveMode"
      @close="closeWindow"
    />
    
    <!-- Normal Mode - Show capsule and modals -->
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
      
      <ArchiveModal 
        v-if="showArchive"
        @close="showArchive = false"
      />
      
      <PreferencesModal
        v-if="showPreferences"
        @close="showPreferences = false"
      />
      
      <OverlayCaption
        v-if="showOverlay"
        :text="transcriptionStore.displayText"
      />
    </template>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from './stores/app'
import { useTranscriptionStore } from './stores/transcription'
import CapsuleBar from './components/CapsuleBar.vue'
import ArchiveModal from './components/ArchiveModal.vue'
import ArchiveWindow from './components/ArchiveWindow.vue'
import PreferencesModal from './components/PreferencesModal.vue'
import TranscriptWindow from './components/TranscriptWindow.vue'
import OverlayCaption from './components/OverlayCaption.vue'

export default {
  name: 'App',
  components: {
    CapsuleBar,
    ArchiveModal,
    ArchiveWindow,
    PreferencesModal,
    TranscriptWindow,
    OverlayCaption
  },
  setup() {
    const appStore = useAppStore()
    const transcriptionStore = useTranscriptionStore()
    
    // Check if this is transcript mode or archive mode
    const isTranscriptMode = ref(false)
    const isArchiveMode = ref(false)
    
    // UI state
    const showArchive = ref(false)
    const showPreferences = ref(false)
    const showOverlay = ref(false)
    const showTranscript = ref(false)
    const isDarkMode = ref(true)
    
    // Track external window states
    const transcriptWindowOpen = ref(false)
    const archiveWindowOpen = ref(false)
    
    let recordingStartTime = 0
    let timerInterval = null

    // Timer management
    const startTimer = () => {
      recordingStartTime = Date.now()
      timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000)
        // Update global state via IPC instead of directly modifying computed property
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
      // Reset elapsed time when stopping
      if (window.electronAPI) {
        window.electronAPI.updateAppState({ elapsedTime: 0 })
      }
    }

    // Backend message handler - now delegates to transcription store
    const handleBackendMessage = (event, message) => {
      // Handle recording state changes for timer
      if (message.type === 'recording_started') {
        startTimer()
      } else if (message.type === 'recording_stopped') {
        stopTimer()
      }
      
      // Delegate all transcription handling to the store
      transcriptionStore.handleBackendMessage(message)
    }

    // Watch for frontend recording state changes to control timer
    watch(
      () => transcriptionStore.isRecording,
      (newIsRecording, oldIsRecording) => {
        console.log(`🔍 Recording state changed: ${oldIsRecording} → ${newIsRecording} (window: ${isTranscriptMode.value ? 'transcript' : 'main'})`)
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
          // Window is open, close it
          window.electronAPI.closeTranscript()
          transcriptWindowOpen.value = false
        } else {
          // Window is closed, open it
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
          // Window is open, close it
          window.electronAPI.closeArchive()
          archiveWindowOpen.value = false
        } else {
          // Window is closed, open it
          window.electronAPI.showArchive()
          archiveWindowOpen.value = true
        }
      } else {
        showArchive.value = !showArchive.value
      }
    }

    const handleCopyTranscript = () => {
      // Copy current text to clipboard
      if (currentText.value) {
        navigator.clipboard.writeText(currentText.value).catch(error => {
          console.warn('Failed to copy to clipboard:', error)
        })
      }
    }

    const handleToggleOverlay = () => {
      showOverlay.value = !showOverlay.value
    }

    onMounted(async () => {
      // Check if this is transcript mode or archive mode
      const urlParams = new URLSearchParams(window.location.search)
      isTranscriptMode.value = urlParams.get('mode') === 'transcript'
      isArchiveMode.value = urlParams.get('mode') === 'archive'
      
      console.log('App mounted, transcript mode:', isTranscriptMode.value, 'archive mode:', isArchiveMode.value)
      
      // Check if we're running in Electron
      if (window.electronAPI) {
        try {
          // Setup event listeners
          window.electronAPI.onBackendMessage(handleBackendMessage)
          
          if (!isTranscriptMode.value && !isArchiveMode.value) {
            // Only setup these listeners in normal mode
            window.electronAPI.onShowPreferences(() => {
              showPreferences.value = true
            })
            window.electronAPI.onCopyTranscript(handleCopyTranscript)
            window.electronAPI.onToggleOverlay(handleToggleOverlay)
            
            // Listen for window state changes
            window.electronAPI.onTranscriptWindowClosed(() => {
              transcriptWindowOpen.value = false
              console.log('📋 Transcript window closed')
            })
            window.electronAPI.onArchiveWindowClosed(() => {
              archiveWindowOpen.value = false
              console.log('📚 Archive window closed')
            })
          }
          
          // If in transcript mode, query backend status to sync with any ongoing recording
          // DISABLED: Transcript windows should not query backend status as it can interfere with recording state
          // Only the main window should manage recording state
          if (false && isTranscriptMode.value) {
            console.log('📋 Transcript window initializing - querying backend status')
            await transcriptionStore.queryBackendStatus()
          }

          // Load theme preference - default to dark
          const theme = await window.electronAPI.getStoreValue('theme')
          isDarkMode.value = (theme === null || theme === undefined || theme !== 'light')
          
          // Apply dark mode class to document
          document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
          console.log('Theme loaded:', theme, 'Dark mode:', isDarkMode.value)
        } catch (error) {
          console.warn('Failed to initialize Electron APIs:', error)
        }
      } else {
        console.log('Running in browser mode - Electron APIs not available')
        // Set default theme for browser - force dark mode
        isDarkMode.value = true
        document.documentElement.classList.toggle('dark-mode', isDarkMode.value)
        console.log('Browser mode - Dark mode forced:', isDarkMode.value)
      }
    })

    onUnmounted(() => {
      // Clean up event listeners
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
      showOverlay,
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