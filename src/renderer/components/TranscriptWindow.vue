<template>
  <div
    class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4"
    @click="closeWindow"
  >
    <div
      class="w-full max-w-2xl h-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-black/8 dark:border-white/8 rounded-3xl shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 dark:shadow-black/50"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-2 border-b border-black/8 dark:border-white/8 bg-white/80 dark:bg-neutral-900/80"
        style="-webkit-app-region: drag"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-2 h-2 rounded-full transition-all duration-300"
            :class="
              isRecording
                ? 'bg-red-500 shadow-red-500/30 shadow-lg animate-pulse'
                : 'bg-gray-400 dark:bg-gray-500'
            "
          ></div>
          <span class="text-base font-semibold text-gray-900 dark:text-white">
            {{ isRecording ? 'Live Transcript' : 'Transcript' }}
          </span>
        </div>
        <div class="flex gap-2" style="-webkit-app-region: no-drag">
          <button
            class="w-8 h-8 rounded-full border-0 bg-transparent text-gray-600 dark:text-gray-400 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            @click="copyTranscript"
            :disabled="!currentText"
            title="Copy transcript (Ctrl+C)"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
              />
            </svg>
          </button>
          <button
            class="w-8 h-8 rounded-full border-0 bg-transparent text-gray-600 dark:text-gray-400 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-500/15 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400"
            @click="closeWindow"
            title="Close (Esc)"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="flex-1 flex flex-col overflow-hidden relative" style="-webkit-app-region: no-drag">
        <div
          v-if="!currentText && !isRecording"
          class="flex flex-col items-center justify-center h-full p-5 text-center"
        >
          <div class="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
              />
            </svg>
          </div>
          <p
            class="text-base font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Click record button to start transcription
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Speech will appear here in real-time
          </p>
        </div>

        <div
          v-else-if="!currentText && isRecording"
          class="flex flex-col items-center justify-center h-full p-10"
        >
          <div class="relative w-15 h-15 mb-5">
            <div
              class="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping"
            ></div>
            <div
              class="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping animation-delay-500"
            ></div>
            <div
              class="absolute top-1/2 left-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 animate-ping animation-delay-1000"
            ></div>
          </div>
          <p class="text-base text-gray-700 dark:text-gray-300">Listening...</p>
        </div>

        <div v-else class="flex-1 flex flex-col p-5 overflow-hidden">
          <div
            class="flex-1 text-base leading-relaxed text-gray-900 dark:text-white whitespace-pre-wrap break-words overflow-y-auto pr-2 relative"
            ref="transcriptText"
            style="-webkit-app-region: no-drag; user-select: text; -webkit-user-select: text;"
          >
            {{ currentText || 'Start speaking...'
            }}<span
              v-if="isRecording && currentText"
              class="inline-block w-0.5 h-5 bg-red-500 animate-pulse ml-0.5 align-bottom"
            ></span>
          </div>
          <div
            v-if="isRecording"
            class="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-red-500 dark:text-red-400 font-medium"
          >
            <div
              class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"
            ></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        v-if="currentText"
        class="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-neutral-900/95"
        style="-webkit-app-region: no-drag"
      >
        <div class="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{{ wordCount }} words</span>
          <span>{{ charCount }} characters</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTranscriptionStore } from '../stores/transcription'

export default {
  name: 'TranscriptWindow',
  emits: ['close'],
  setup(props, { emit }) {
    // Use global transcription store instead of props
    const transcriptionStore = useTranscriptionStore()
    const transcriptText = ref(null)
    const sessionStarted = ref(false)

    // Use computed properties from the store - prioritize sessionTranscript for full session context
    const currentText = computed(() => {
      // Show sessionTranscript if available (accumulated full session), fallback to displayText
      const sessionTranscript = transcriptionStore.sessionTranscript
      const displayText = transcriptionStore.displayText
      const result = sessionTranscript || displayText

      return result
    })
    const isRecording = computed(() => transcriptionStore.isRecording)
    const wordCount = computed(() => transcriptionStore.wordCount)
    const charCount = computed(() => transcriptionStore.charCount)

    const closeWindow = () => {
      // Check if we're in transcript mode (separate window)
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('mode') === 'transcript' && window.electronAPI) {
        window.electronAPI.closeTranscript()
      } else {
        emit('close')
      }
    }

    const copyTranscript = async () => {
      if (currentText.value) {
        try {
          await navigator.clipboard.writeText(currentText.value)
        } catch (error) {
          console.warn('Failed to copy transcript:', error)
        }
      }
    }

    // Handle recording state changes
    watch(
      () => transcriptionStore.isRecording,
      (newRecording, oldRecording) => {
        if (newRecording && !oldRecording) {
          sessionStarted.value = true
        } else if (!newRecording && oldRecording) {
          sessionStarted.value = false
        }
      }
    )

    // Auto-scroll when text updates
    watch(
      () => currentText.value,
      () => {
        nextTick(() => {
          if (transcriptText.value) {
            transcriptText.value.scrollTop = transcriptText.value.scrollHeight
          }
        })
      }
    )

    // Watch the computed currentText to see if it's updating
    watch(currentText, (newVal, oldVal) => {})

    // Handle keyboard shortcuts
    const handleKeydown = event => {
      if (event.key === 'Escape') {
        closeWindow()
      } else if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        copyTranscript()
      }
    }

    onMounted(async () => {
      document.addEventListener('keydown', handleKeydown)

      // Wait a moment for any final chunk processing to complete before querying status
      await new Promise(resolve => setTimeout(resolve, 300))

      // Query backend status for session data
      await transcriptionStore.queryBackendStatus()
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      // Store refs
      transcriptionStore,
      currentText,
      isRecording,
      wordCount,
      charCount,

      // Local refs
      transcriptText,

      // Actions
      closeWindow,
      copyTranscript,
    }
  },
}
</script>

<style scoped>
/* Custom scrollbar */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(209 213 219);
  border-radius: 0.25rem;
}

.dark-mode .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(75 85 99);
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(156 163 175);
}

.dark-mode .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(107 114 128);
}

/* Custom Tailwind utilities */
.w-15 {
  width: 3.75rem;
}
.h-15 {
  height: 3.75rem;
}
.w-4\.5 {
  width: 1.125rem;
}
.h-4\.5 {
  height: 1.125rem;
}

/* Animation delays */
.animation-delay-500 {
  animation-delay: 0.5s;
}
.animation-delay-1000 {
  animation-delay: 1s;
}
</style>
