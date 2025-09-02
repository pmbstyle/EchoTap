<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="w-[600px] max-h-[500px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden" @click.stop>
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">Archive</h2>
        <button class="w-7 h-7 border-0 bg-transparent rounded-md text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8" @click="$emit('close')">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <input 
          v-model="searchQuery"
          type="text"
          placeholder="Search transcripts..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
        >
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          class="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-white/8"
          @click="viewSession(session)"
        >
          <div class="flex-1">
            <div class="font-medium text-gray-900 dark:text-white text-sm">
              {{ formatDate(session.created_at) }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400 my-1">
              {{ session.source }} • {{ formatDuration(session.duration) }} • {{ session.model }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis max-w-md">
              {{ session.preview }}
            </div>
          </div>
          <div class="flex gap-1">
            <button @click.stop="copySession(session)" class="w-7 h-7 border-0 bg-transparent rounded text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8" title="Copy">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
            </button>
            <button @click.stop="exportSession(session)" class="w-7 h-7 border-0 bg-transparent rounded text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8" title="Export">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="filteredSessions.length === 0" class="text-center py-10 px-5 text-gray-600 dark:text-gray-400">
          <p>No transcripts found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'ArchiveModal',
  emits: ['close'],
  setup() {
    const searchQuery = ref('')
    const sessions = ref([])

    const filteredSessions = computed(() => {
      if (!searchQuery.value) return sessions.value
      
      const query = searchQuery.value.toLowerCase()
      return sessions.value.filter(session => 
        session.preview.toLowerCase().includes(query) ||
        session.source.toLowerCase().includes(query)
      )
    })

    const loadSessions = async () => {
      try {
        // Load sessions from backend
        const response = await window.electronAPI.sendToBackend({
          type: 'get_sessions'
        })
        // This would be handled by the backend message listener
        // For now, we'll use mock data
        sessions.value = [
          {
            id: 1,
            created_at: new Date().toISOString(),
            source: 'System Audio',
            duration: 180,
            model: 'whisper-base',
            preview: 'Welcome to this video about machine learning...'
          }
        ]
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    }

    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const viewSession = (session) => {
      // Open detailed view (could be another modal or navigate)
      console.log('View session:', session)
    }

    const copySession = async (session) => {
      try {
        // Get full transcript from backend
        const response = await window.electronAPI.sendToBackend({
          type: 'get_session_transcript',
          session_id: session.id
        })
        // Copy to clipboard would be handled by backend response
      } catch (error) {
        console.error('Failed to copy session:', error)
      }
    }

    const exportSession = async (session) => {
      try {
        await window.electronAPI.sendToBackend({
          type: 'export_session',
          session_id: session.id
        })
      } catch (error) {
        console.error('Failed to export session:', error)
      }
    }

    onMounted(() => {
      loadSessions()
    })

    return {
      searchQuery,
      sessions,
      filteredSessions,
      formatDate,
      formatDuration,
      viewSession,
      copySession,
      exportSession
    }
  }
}
</script>

<style scoped>
/* Custom Tailwind utilities */
.w-4\.5 {
  width: 1.125rem;
}
.h-4\.5 {
  height: 1.125rem;
}
</style>