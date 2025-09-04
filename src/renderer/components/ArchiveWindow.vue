<template>
  <div
    class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4"
  >
    <div
      class="w-full max-w-4xl h-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-black/8 dark:border-white/8 rounded-3xl shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 dark:shadow-black/50"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-2 border-b border-black/8 dark:border-white/8 bg-white/80 dark:bg-neutral-900/80"
        style="-webkit-app-region: drag"
      >
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-blue-500"></div>
          <span class="text-base font-semibold text-gray-900 dark:text-white">
            {{ currentView === 'list' ? 'Archive' : 'Transcript Details' }}
          </span>
        </div>
        <div class="flex gap-2" style="-webkit-app-region: no-drag">
          <button
            v-if="currentView === 'detail'"
            class="w-8 h-8 rounded-full border-0 bg-transparent text-gray-600 dark:text-gray-400 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
            @click="goBack"
            title="Back to list"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
              />
            </svg>
          </button>
          <button
            v-if="currentView === 'detail' && selectedSession"
            class="w-8 h-8 rounded-full border-0 bg-transparent text-gray-600 dark:text-gray-400 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white"
            @click="copyTranscript"
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
      <template v-if="currentView === 'list'">
        <!-- Search bar (only shown in list view) -->
        <div
          class="p-4 border-b border-gray-200 dark:border-gray-700"
          style="-webkit-app-region: no-drag"
        >
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search transcripts..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>

        <!-- Content -->
        <div
          class="flex-1 flex flex-col overflow-hidden relative"
          style="-webkit-app-region: no-drag"
        >
          <!-- List View -->
          <div class="flex-1 overflow-y-auto p-3">
            <div
              v-for="session in filteredSessions"
              :key="session.id"
              class="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-white/8 mb-2"
              @click="viewSession(session)"
            >
              <div class="flex-1 min-w-0">
                <div
                  class="font-medium text-gray-900 dark:text-white text-sm mb-1"
                >
                  {{ formatDate(session.created_at) }}
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {{ session.source }} •
                  {{ formatDuration(session.duration) }} min
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {{ getPreviewText(session) }}
                </div>
              </div>
              <div class="flex gap-1 ml-4">
                <button
                  @click.stop="copySession(session)"
                  class="w-8 h-8 border-0 bg-transparent rounded text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center"
                  title="Copy"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
                    />
                  </svg>
                </button>
                <button
                  @click.stop="deleteSession(session)"
                  class="w-8 h-8 border-0 bg-transparent rounded text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-red-500/15 dark:hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center"
                  title="Delete"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div
              v-if="filteredSessions.length === 0"
              class="text-center py-10 px-5 text-gray-600 dark:text-gray-400"
            >
              <div
                class="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4 mx-auto"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path
                    d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                  />
                </svg>
              </div>
              <p
                class="text-base font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                No transcripts found
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Start recording to create your first transcript
              </p>
            </div>
          </div>
        </div>
      </template>
      <template v-if="currentView === 'detail' && selectedSession">
        <div class="flex-1 flex flex-col overflow-hidden relative">
          <div class="flex-1 flex flex-col p-5 overflow-hidden">
            <div
              class="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700"
            >
              <h3 class="font-medium text-gray-900 dark:text-white mb-2">
                {{ formatDate(selectedSession.created_at) }}
              </h3>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                {{ selectedSession.source }} •
                {{ formatDuration(selectedSession.duration) }}
              </div>
            </div>

            <div
              class="flex-1 text-base leading-relaxed text-gray-900 dark:text-white whitespace-pre-wrap break-words overflow-y-auto pr-2"
              ref="transcriptText"
            >
              {{ selectedSession.fullText || getPreviewText(selectedSession) }}
            </div>

            <!-- Footer with stats -->
            <div
              class="px-0 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-neutral-900/95 -mx-5 -mb-5 px-5"
            >
              <div class="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{{ getWordCount(selectedSession) }} words</span>
                <span>{{ getCharCount(selectedSession) }} characters</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useTranscriptionStore } from '../stores/transcription'

export default {
  name: 'ArchiveWindow',
  setup() {
    const transcriptionStore = useTranscriptionStore()
    const searchQuery = ref('')
    const sessions = ref([])
    const currentView = ref('list')
    const selectedSession = ref(null)
    const transcriptText = ref(null)

    const handleBackendMessage = message => {
      switch (message.type) {
        case 'sessions_list':
          sessions.value = message.sessions || []
          break
        case 'session_transcript':
          if (
            selectedSession.value &&
            selectedSession.value.id === message.session_id
          ) {
            selectedSession.value.fullText = message.transcript?.full_text || ''
          }
          break
        case 'session_deleted':
          if (message.success) {
            sessions.value = sessions.value.filter(
              s => s.id !== message.session_id
            )
            if (
              selectedSession.value &&
              selectedSession.value.id === message.session_id
            ) {
              goBack()
            }
          }
          break
      }
    }

    const loadSessions = async () => {
      try {
        await window.electronAPI.sendToBackend({
          type: 'get_sessions',
        })
      } catch (error) {
        console.error('Failed to load sessions:', error)
        sessions.value = []
      }
    }

    const filteredSessions = computed(() => {
      if (!searchQuery.value) return sessions.value

      const query = searchQuery.value.toLowerCase()
      return sessions.value.filter(
        session =>
          getPreviewText(session).toLowerCase().includes(query) ||
          session.source.toLowerCase().includes(query)
      )
    })

    const formatDate = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    const formatDuration = seconds => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getPreviewText = session => {
      return session.preview || session.fullText || 'No transcript available'
    }

    const getWordCount = session => {
      const text = session.fullText || session.preview || ''
      if (!text) return 0
      return text.trim().split(/\s+/).length
    }

    const getCharCount = session => {
      const text = session.fullText || session.preview || ''
      return text.length
    }

    const viewSession = async session => {
      selectedSession.value = session
      currentView.value = 'detail'

      if (!session.fullText) {
        try {
          await window.electronAPI.sendToBackend({
            type: 'get_session_transcript',
            session_id: session.id,
          })
        } catch (error) {
          console.error('Failed to load session transcript:', error)
        }
      }

      nextTick(() => {
        if (transcriptText.value) {
          transcriptText.value.scrollTop = 0
        }
      })
    }

    const goBack = () => {
      currentView.value = 'list'
      selectedSession.value = null
    }

    const copySession = async session => {
      const textToCopy = session.fullText || session.preview || ''
      try {
        await navigator.clipboard.writeText(textToCopy)
      } catch (error) {
        console.error('Failed to copy session:', error)
      }
    }

    const copyTranscript = async () => {
      if (selectedSession.value) {
        await copySession(selectedSession.value)
      }
    }

    const deleteSession = async session => {
      if (confirm('Are you sure you want to delete this transcript?')) {
        try {
          await window.electronAPI.sendToBackend({
            type: 'delete_session',
            session_id: session.id,
          })
        } catch (error) {
          console.error('Failed to delete session:', error)
        }
      }
    }

    const closeWindow = () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('mode') === 'archive' && window.electronAPI) {
        window.electronAPI.closeArchive()
      }
    }

    const handleKeydown = event => {
      if (event.key === 'Escape') {
        if (currentView.value === 'detail') {
          goBack()
        } else {
          closeWindow()
        }
      } else if (event.key === 'c' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        if (currentView.value === 'detail') {
          copyTranscript()
        }
      }
    }

    onMounted(async () => {
      document.addEventListener('keydown', handleKeydown)

      if (window.electronAPI) {
        window.electronAPI.onBackendMessage((event, message) => {
          handleBackendMessage(message)
        })
      }

      await loadSessions()
      console.log('📋 ArchiveWindow mounted')
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)

      if (window.electronAPI) {
        try {
          window.electronAPI.removeAllListeners('backend-message')
        } catch (error) {
          console.warn('Error cleaning up backend message listener:', error)
        }
      }

      console.log('📋 ArchiveWindow unmounted')
    })

    return {
      searchQuery,
      sessions,
      filteredSessions,
      currentView,
      selectedSession,
      transcriptText,
      formatDate,
      formatDuration,
      getPreviewText,
      getWordCount,
      getCharCount,
      viewSession,
      goBack,
      copySession,
      copyTranscript,
      deleteSession,
      closeWindow,
    }
  },
}
</script>

<style scoped>
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

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgb(75 85 99);
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(156 163 175);
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgb(107 114 128);
}
</style>
