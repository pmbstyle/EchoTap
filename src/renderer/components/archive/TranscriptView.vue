<template>
  <div class="flex-1 flex flex-col p-5 overflow-hidden">
    <!-- Content -->
    <div
      class="flex-1 text-base leading-relaxed text-gray-900 dark:text-white overflow-y-auto pr-2"
      ref="transcriptContainer"
      style="user-select: text; -webkit-user-select: text;"
    >
      {{ transcriptText }}
    </div>

    <!-- Footer with stats -->
    <div class="py-3 px-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-neutral-900/95 -mx-5 -mb-5">
      <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div class="flex gap-4">
          <span>{{ wordCount }} words</span>
          <span>{{ charCount }} characters</span>
        </div>
        <div class="flex items-center gap-2">
          <slot name="actions"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, ref } from 'vue'

export default {
  name: 'TranscriptView',
  props: {
    transcriptText: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const transcriptContainer = ref(null)

    const wordCount = computed(() => {
      if (!props.transcriptText) return 0
      return props.transcriptText.trim().split(/\s+/).length
    })

    const charCount = computed(() => {
      return props.transcriptText.length
    })

    // Scroll to top when transcript changes
    const scrollToTop = () => {
      nextTick(() => {
        if (transcriptContainer.value) {
          transcriptContainer.value.scrollTop = 0
        }
      })
    }

    return {
      transcriptContainer,
      wordCount,
      charCount,
      scrollToTop
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