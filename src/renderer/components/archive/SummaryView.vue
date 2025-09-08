<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Summary content -->
    <div
      v-if="summaryText"
      class="flex-1 flex flex-col p-5 overflow-hidden"
    >
      <div
        class="flex-1 text-base leading-relaxed text-gray-900 dark:text-white overflow-y-auto pr-2 summary-content"
        ref="summaryContainer"
        style="user-select: text; -webkit-user-select: text;"
        v-html="formatSummaryAsHTML(summaryText)"
      ></div>

      <!-- Summary footer with stats -->
      <div class="py-3 px-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-neutral-900/95 -mx-5 -mb-5">
        <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <div class="flex gap-4">
            <span>{{ wordCount }} words</span>
            <span v-if="compressionRatio">{{ Math.round(compressionRatio) }}x compression</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              @click="$emit('regenerate-summary')"
              :disabled="isGenerating"
              class="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Regenerate summary"
            >
              <svg
                v-if="!isGenerating"
                class="w-3 h-3"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"
                />
              </svg>
              <div
                v-else
                class="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"
              ></div>
              <span>{{ isGenerating ? 'Generating...' : 'Regenerate' }}</span>
            </button>
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate summary state -->
    <div
      v-else-if="!isGenerating"
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center max-w-md">
        <div class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5H9z" />
          </svg>
        </div>
        <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Summary Yet
        </h4>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Generate an AI summary of this transcript to see key points and highlights.
        </p>
        <button
          @click="$emit('generate-summary')"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors duration-200"
        >
          Generate Summary
        </button>
      </div>
    </div>

    <!-- Generating state -->
    <div
      v-else
      class="flex-1 flex items-center justify-center"
    >
      <div class="text-center">
        <div class="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Generating summary...
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, ref } from 'vue'

export default {
  name: 'SummaryView',
  props: {
    summaryText: {
      type: String,
      default: ''
    },
    compressionRatio: {
      type: Number,
      default: null
    },
    isGenerating: {
      type: Boolean,
      default: false
    }
  },
  emits: ['generate-summary', 'regenerate-summary'],
  setup(props) {
    const summaryContainer = ref(null)

    const wordCount = computed(() => {
      if (!props.summaryText) return 0
      return props.summaryText.trim().split(/\s+/).length
    })

    const formatSummaryAsHTML = summaryText => {
      if (!summaryText) return ''

      // Escape HTML entities for security
      const escapeHTML = text =>
        text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')

      let html = escapeHTML(summaryText)

      // Convert **Section Headers** to proper headings
      html = html.replace(
        /\*\*(.*?)\*\*:/g,
        '<h3 class="section-header">$1</h3>'
      )

      // Convert remaining **bold** text
      html = html.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-semibold">$1</strong>'
      )

      // Convert bullet points to list items
      html = html.replace(/^\* (.+)$/gm, '<li>$1</li>')

      // Split into sections and wrap appropriately
      const sections = html.split(/(?=<h3)/g).filter(section => section.trim())

      const formattedSections = sections.map(section => {
        // Wrap consecutive <li> elements in <ul> tags
        section = section.replace(/(<li>.*<\/li>[\s\n]*)+/gs, match => {
          const cleanedMatch = match.replace(/\n/g, '').trim()
          return `<ul class="section-list">${cleanedMatch}</ul>`
        })

        // Convert line breaks to proper spacing
        section = section.replace(/\n/g, '<br>')

        return `<div class="section">${section}</div>`
      })

      return formattedSections.join('')
    }

    // Scroll to top when summary changes
    const scrollToTop = () => {
      nextTick(() => {
        if (summaryContainer.value) {
          summaryContainer.value.scrollTop = 0
        }
      })
    }

    return {
      summaryContainer,
      wordCount,
      formatSummaryAsHTML,
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

/* Summary content styling */
.summary-content {
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.6;
}

.summary-content .section {
  margin-bottom: 1.5rem;
}

.summary-content .section:last-child {
  margin-bottom: 0;
}

.summary-content .section-header {
  display: block;
  margin: 1.5rem 0 0.75rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: rgb(55 65 81);
  border-bottom: 2px solid rgb(229 231 235);
  padding-bottom: 0.5rem;
}

.summary-content .section:first-child .section-header {
  margin-top: 0;
}

.dark .summary-content .section-header {
  color: rgb(243 244 246);
  border-bottom-color: rgb(75 85 99);
}

.summary-content .section-list {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
  list-style: none;
}

.summary-content .section-list li {
  position: relative;
  margin-bottom: 0.5rem;
  padding-left: 0.75rem;
}

.summary-content .section-list li::before {
  content: '•';
  color: rgb(59 130 246);
  font-weight: bold;
  position: absolute;
  left: -0.5rem;
  top: 0;
}

.summary-content .font-semibold {
  font-weight: 600;
}
</style>