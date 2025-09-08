<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Tab Navigation -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <div class="flex gap-1 bg-gray-100 dark:bg-gray-800">
          <button
            @click="activeTab = 'transcript'"
            :class="[
              'flex-1 py-2 px-3 text-sm font-medium transition-colors duration-200',
              activeTab === 'transcript'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            ]"
          >
            Transcript
          </button>
          <button
            @click="activeTab = 'summary'"
            :class="[
              'flex-1 py-2 px-3 text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2',
              activeTab === 'summary'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white',
            ]"
          >
            Summary
            <div
              v-if="session.has_summary"
              class="w-2 h-2 bg-blue-500 rounded-full"
              title="Summary available"
            ></div>
            <div
              v-else-if="summaryGenerating"
              class="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"
              title="Generating summary..."
            ></div>
          </button>
        </div>

        <!-- Translation Controls -->
        <div
          class="p-3 bg-gray-50 dark:bg-gray-800"
          v-if="currentTranslation"
        >
          <!-- Language Display/Toggle -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span>Showing:</span>
              <button
                @click="$emit('update:showOriginal', !showOriginal)"
                :class="[
                  'px-2 py-1 rounded text-xs font-medium transition-colors duration-200',
                  showOriginal
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600',
                ]"
              >
                {{ showOriginal ? 'Original' : getLanguageName(selectedLanguage) }}
              </button>
              <!-- Warning when summary translation is not available -->
              <div
                v-if="!showOriginal && activeTab === 'summary' && !currentTranslation?.translated_summary"
                class="flex items-center gap-1 text-amber-600 dark:text-amber-400"
              >
                <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
                <span class="text-xs">Summary translation unavailable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Transcript Tab -->
        <TranscriptView
          v-if="activeTab === 'transcript'"
          :transcript-text="getTranscriptText()"
          ref="transcriptView"
        >
          <template #actions>
            <slot name="transcript-actions"></slot>
          </template>
        </TranscriptView>

        <!-- Summary Tab -->
        <SummaryView
          v-if="activeTab === 'summary'"
          :summary-text="getSummaryText()"
          :compression-ratio="session.compression_ratio"
          :is-generating="summaryGenerating"
          ref="summaryView"
          @generate-summary="$emit('generate-summary')"
          @regenerate-summary="$emit('regenerate-summary')"
        >
          <template #actions>
            <slot name="summary-actions"></slot>
          </template>
        </SummaryView>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import TranscriptView from './TranscriptView.vue'
import SummaryView from './SummaryView.vue'

export default {
  name: 'SessionDetail',
  components: {
    TranscriptView,
    SummaryView
  },
  props: {
    session: {
      type: Object,
      required: true
    },
    summaryGenerating: {
      type: Boolean,
      default: false
    },
    currentTranslation: {
      type: Object,
      default: null
    },
    selectedLanguage: {
      type: String,
      default: ''
    },
    showOriginal: {
      type: Boolean,
      default: true
    },
    supportedLanguages: {
      type: Array,
      default: () => []
    }
  },
  emits: ['generate-summary', 'regenerate-summary', 'update:showOriginal', 'translate'],
  setup(props, { emit }) {
    const activeTab = ref('transcript')
    const transcriptView = ref(null)
    const summaryView = ref(null)

    const getTranscriptText = () => {
      if (!props.showOriginal && props.currentTranslation?.translated_transcript) {
        return props.currentTranslation.translated_transcript
      }
      return props.session?.fullText || props.session?.preview || ''
    }

    const getSummaryText = () => {
      if (!props.showOriginal && props.currentTranslation?.translated_summary) {
        return props.currentTranslation.translated_summary
      }
      return props.session?.summary || ''
    }

    const getLanguageName = languageCode => {
      const language = props.supportedLanguages.find(
        lang => lang.code === languageCode
      )
      return language ? language.name : languageCode
    }

    const getCurrentContent = () => {
      if (activeTab.value === 'summary') {
        return getSummaryText()
      } else {
        return getTranscriptText()
      }
    }

    const handleTranslate = () => {
      emit('translate', {
        activeTab: activeTab.value,
        content: getCurrentContent()
      })
    }

    // Watch for session changes and scroll to top
    watch(() => props.session, () => {
      if (transcriptView.value?.scrollToTop) {
        transcriptView.value.scrollToTop()
      }
      if (summaryView.value?.scrollToTop) {
        summaryView.value.scrollToTop()
      }
    })

    return {
      activeTab,
      transcriptView,
      summaryView,
      getTranscriptText,
      getSummaryText,
      getLanguageName,
      getCurrentContent,
      handleTranslate
    }
  }
}
</script>