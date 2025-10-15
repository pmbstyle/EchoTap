<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <TranscriptView
      :transcript-text="session?.fullText || session?.preview || ''"
      ref="transcriptView"
    >
      <template #actions>
        <slot name="transcript-actions"></slot>
      </template>
    </TranscriptView>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import TranscriptView from './TranscriptView.vue'

export default {
  name: 'SessionDetail',
  components: {
    TranscriptView
  },
  props: {
    session: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const transcriptView = ref(null)

    // Watch for session changes and scroll to top
    watch(() => props.session, () => {
      if (transcriptView.value?.scrollToTop) {
        transcriptView.value.scrollToTop()
      }
    })

    return {
      transcriptView
    }
  }
}
</script>
