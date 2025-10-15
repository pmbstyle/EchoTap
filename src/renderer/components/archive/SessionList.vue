<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Search bar -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search transcripts..."
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
      />
    </div>

    <!-- Session list -->
    <div class="flex-1 overflow-y-auto p-3">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-white/8 mb-2"
        @click="$emit('view-session', session)"
      >
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-white text-sm mb-1">
            {{ formatDate(session.created_at) }}
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-2">
            <span>{{ session.source }} • {{ formatDuration(session.duration) }} min</span>

          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 truncate">
            {{ session.preview || 'No transcript available' }}
          </div>
        </div>
        <div class="flex gap-1 ml-4">
          <button
            @click.stop="$emit('copy-session', session)"
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
            @click.stop="$emit('delete-session', session)"
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

      <!-- Empty state -->
      <div
        v-if="filteredSessions.length === 0"
        class="text-center py-10 px-5 text-gray-600 dark:text-gray-400"
      >
        <div class="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4 mx-auto">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
            />
          </svg>
        </div>
        <p class="text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
          No transcripts found
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ searchQuery ? 'Try a different search term' : 'Start recording to create your first transcript' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'SessionList',
  props: {
    sessions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['view-session', 'copy-session', 'delete-session'],
  setup(props) {
    const searchQuery = ref('')

    const filteredSessions = computed(() => {
      if (!searchQuery.value) return props.sessions

      const query = searchQuery.value.toLowerCase()
      return props.sessions.filter(
        session =>
          (session.preview || '').toLowerCase().includes(query) ||
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

    return {
      searchQuery,
      filteredSessions,
      formatDate,
      formatDuration
    }
  }
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
</style>