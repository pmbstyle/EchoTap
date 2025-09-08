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
          <span
            class="text-xs"
            v-if="selectedSession && selectedSession.created_at"
          >
            {{ formatDate(selectedSession.created_at) }} •
            {{ selectedSession.source }} •
            {{ formatDuration(selectedSession.duration) }} min
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
            @click="copyCurrentContent"
            title="Copy content (Ctrl+C)"
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

      <!-- Main Content -->
      <div class="flex-1 flex flex-col overflow-hidden" style="-webkit-app-region: no-drag">
        <!-- List View -->
        <SessionList
          v-if="currentView === 'list'"
          :sessions="sessions"
          @view-session="viewSession"
          @copy-session="copySession"
          @delete-session="deleteSession"
        />

        <!-- Detail View -->
        <div v-if="currentView === 'detail' && selectedSession" class="flex-1 flex flex-col overflow-hidden">
          <SessionDetail
            ref="sessionDetail"
            :session="selectedSession"
            :summary-generating="summaryGenerating"
            :current-translation="currentTranslation"
            :selected-language="selectedLanguage"
            :show-original="showOriginal"
            :supported-languages="supportedLanguages"
            @generate-summary="generateSummary"
            @regenerate-summary="regenerateSummary"
            @update:show-original="showOriginal = $event"
            @translate="handleTranslationFromTab"
          >
            <template #transcript-actions>
              <!-- Translation controls for transcript tab -->
              <TranslationControls
                :selected-language="selectedLanguage"
                :supported-languages="supportedLanguages"
                :is-translating="translationGenerating"
                @update:selected-language="onLanguageChange"
                @translate="handleTranslate"
              />
            </template>
            <template #summary-actions>
              <!-- Translation controls for summary tab -->
              <TranslationControls
                :selected-language="selectedLanguage"
                :supported-languages="supportedLanguages"
                :is-translating="translationGenerating"
                @update:selected-language="onLanguageChange"
                @translate="handleTranslate"
              />
            </template>
          </SessionDetail>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useTranscriptionStore } from '../stores/transcription'
import SessionList from './archive/SessionList.vue'
import SessionDetail from './archive/SessionDetail.vue'
import TranslationControls from './archive/TranslationControls.vue'

export default {
  name: 'ArchiveWindow',
  components: {
    SessionList,
    SessionDetail,
    TranslationControls
  },
  setup() {
    const transcriptionStore = useTranscriptionStore()
    
    // Main state
    const sessions = ref([])
    const currentView = ref('list')
    const selectedSession = ref(null)
    const sessionDetail = ref(null)
    
    // Summary state
    const summaryGenerating = ref(false)
    
    // Translation state
    const supportedLanguages = ref([])
    const selectedLanguage = ref('')
    const currentTranslation = ref(null)
    const translationGenerating = ref(false)
    const showOriginal = ref(true)

    // WebSocket message handler
    const handleBackendMessage = message => {
      switch (message.type) {
        case 'sessions_list':
          sessions.value = message.sessions || []
          break
        case 'session_transcript':
          if (selectedSession.value && selectedSession.value.id === message.session_id) {
            selectedSession.value.fullText = message.transcript?.full_text || ''
          }
          break
        case 'session_summary':
          if (selectedSession.value && selectedSession.value.id === message.session_id) {
            if (message.summary) {
              selectedSession.value.summary = message.summary.summary
              selectedSession.value.summary_words = message.summary.summary_words
              selectedSession.value.compression_ratio = message.summary.compression_ratio
              selectedSession.value.summary_model = message.summary.model
              selectedSession.value.has_summary = true
            }
          }
          break
        case 'summary_generated':
          updateSessionSummary(message)
          break
        case 'summary_generation_result':
          if (selectedSession.value && selectedSession.value.id === message.session_id) {
            summaryGenerating.value = false
            if (!message.success) {
              console.error('Failed to generate summary')
            }
          }
          break
        case 'session_deleted':
          handleSessionDeleted(message)
          break
        case 'supported_languages':
          supportedLanguages.value = message.languages || []
          break
        case 'translation_result':
          handleTranslationResult(message)
          break
        case 'session_translation':
          if (selectedSession.value && selectedSession.value.id === message.session_id) {
            currentTranslation.value = message.translation
            if (message.translation) {
              showOriginal.value = false // Show translation by default when loaded
            }
          }
          break
        case 'translation_generated':
          handleTranslationGenerated(message)
          break
      }
    }

    // Helper functions for message handling
    const updateSessionSummary = (message) => {
      // Update session in list
      const sessionIndex = sessions.value.findIndex(s => s.id === message.session_id)
      if (sessionIndex !== -1) {
        sessions.value[sessionIndex].has_summary = true
        sessions.value[sessionIndex].compression_ratio = message.compression_ratio
      }

      // Update selected session
      if (selectedSession.value && selectedSession.value.id === message.session_id) {
        selectedSession.value.summary = message.summary
        selectedSession.value.compression_ratio = message.compression_ratio
        selectedSession.value.has_summary = true
        summaryGenerating.value = false
      }
    }

    const handleSessionDeleted = (message) => {
      if (message.success) {
        sessions.value = sessions.value.filter(s => s.id !== message.session_id)
        if (selectedSession.value && selectedSession.value.id === message.session_id) {
          goBack()
        }
      }
    }

    const handleTranslationResult = (message) => {
      if (selectedSession.value && selectedSession.value.id === message.session_id) {
        translationGenerating.value = false
        if (message.success) {
          loadSessionTranslation(message.session_id, message.target_language)
        }
      }
    }

    const handleTranslationGenerated = (message) => {
      if (selectedSession.value && selectedSession.value.id === message.session_id) {
        translationGenerating.value = false
        if (selectedLanguage.value === message.target_language || !selectedLanguage.value) {
          selectedLanguage.value = message.target_language
          loadSessionTranslation(message.session_id, message.target_language)
        }
      }
    }

    // API functions
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

    const loadSupportedLanguages = async () => {
      try {
        await window.electronAPI.sendToBackend({
          type: 'get_supported_languages',
        })
      } catch (error) {
        console.error('Failed to load supported languages:', error)
      }
    }

    const loadSessionTranslation = async (sessionId, targetLanguage) => {
      try {
        await window.electronAPI.sendToBackend({
          type: 'get_session_translation',
          session_id: sessionId,
          target_language: targetLanguage,
        })
      } catch (error) {
        console.error('Failed to load session translation:', error)
      }
    }

    // Navigation functions
    const viewSession = async (session) => {
      selectedSession.value = session
      currentView.value = 'detail'
      
      // Reset translation state
      selectedLanguage.value = ''
      currentTranslation.value = null
      showOriginal.value = true

      // Load transcript if not already loaded
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

      // Load summary if available
      if (session.has_summary) {
        try {
          await window.electronAPI.sendToBackend({
            type: 'get_session_summary',
            session_id: session.id,
          })
        } catch (error) {
          console.error('Failed to load session summary:', error)
        }
      }
    }

    const goBack = () => {
      currentView.value = 'list'
      selectedSession.value = null
      // Reset translation state
      selectedLanguage.value = ''
      currentTranslation.value = null
      showOriginal.value = true
    }

    // Action functions
    const copySession = async (session) => {
      const textToCopy = session.fullText || session.preview || ''
      try {
        await navigator.clipboard.writeText(textToCopy)
      } catch (error) {
        console.error('Failed to copy session:', error)
      }
    }

    const copyCurrentContent = async () => {
      if (!selectedSession.value || !sessionDetail.value) return

      // Get current content from SessionDetail component
      let textToCopy = ''
      try {
        textToCopy = sessionDetail.value.getCurrentContent()
      } catch (error) {
        console.warn('Could not get current content from SessionDetail, falling back to transcript')
        textToCopy = selectedSession.value.fullText || selectedSession.value.preview || ''
      }

      try {
        await navigator.clipboard.writeText(textToCopy)
      } catch (error) {
        console.error('Failed to copy content:', error)
      }
    }

    const deleteSession = async (session) => {
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

    // Summary functions
    const generateSummary = async () => {
      if (!selectedSession.value) return

      summaryGenerating.value = true
      try {
        await window.electronAPI.sendToBackend({
          type: 'generate_summary',
          session_id: selectedSession.value.id,
        })
      } catch (error) {
        console.error('Failed to generate summary:', error)
        summaryGenerating.value = false
      }
    }

    const regenerateSummary = async () => {
      if (!selectedSession.value) return

      summaryGenerating.value = true
      try {
        await window.electronAPI.sendToBackend({
          type: 'generate_summary',
          session_id: selectedSession.value.id,
        })
      } catch (error) {
        console.error('Failed to regenerate summary:', error)
        summaryGenerating.value = false
      }
    }

    // Translation functions
    const translateSession = async () => {
      if (!selectedSession.value || !selectedLanguage.value) return

      translationGenerating.value = true
      try {
        await window.electronAPI.sendToBackend({
          type: 'translate_session',
          session_id: selectedSession.value.id,
          target_language: selectedLanguage.value,
        })
      } catch (error) {
        console.error('Failed to translate session:', error)
        translationGenerating.value = false
      }
    }

    const handleTranslationFromTab = async (tabInfo) => {
      if (!selectedSession.value || !selectedLanguage.value) return

      console.log(`Translating content from ${tabInfo.activeTab} tab`)
      
      translationGenerating.value = true
      try {
        await window.electronAPI.sendToBackend({
          type: 'translate_session',
          session_id: selectedSession.value.id,
          target_language: selectedLanguage.value,
          active_tab: tabInfo.activeTab,
          content: tabInfo.content
        })
      } catch (error) {
        console.error('Failed to translate session:', error)
        translationGenerating.value = false
      }
    }

    const onLanguageChange = async (newLanguage) => {
      selectedLanguage.value = newLanguage
      if (selectedSession.value && newLanguage) {
        // Check if translation already exists
        await loadSessionTranslation(selectedSession.value.id, newLanguage)
      }
    }
    
    const handleTranslate = async () => {
      await translateSession()
    }

    // Utility functions
    const formatDate = dateString => {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    const formatDuration = seconds => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const closeWindow = () => {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('mode') === 'archive' && window.electronAPI) {
        window.electronAPI.closeArchive()
      }
    }

    // Keyboard handling
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
          copyCurrentContent()
        }
      }
    }

    // Lifecycle
    onMounted(async () => {
      document.addEventListener('keydown', handleKeydown)

      if (window.electronAPI) {
        window.electronAPI.onBackendMessage((event, message) => {
          handleBackendMessage(message)
        })
      }

      await loadSessions()
      await loadSupportedLanguages()
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
      // State
      sessions,
      currentView,
      selectedSession,
      sessionDetail,
      summaryGenerating,
      supportedLanguages,
      selectedLanguage,
      currentTranslation,
      translationGenerating,
      showOriginal,
      
      // Navigation
      viewSession,
      goBack,
      
      // Actions
      copySession,
      copyCurrentContent,
      deleteSession,
      generateSummary,
      regenerateSummary,
      translateSession,
      handleTranslationFromTab,
      handleTranslate,
      onLanguageChange,
      
      // Utilities
      formatDate,
      formatDuration,
      closeWindow,
    }
  },
}
</script>

<style scoped>
/* Keep existing scrollbar styles */
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