<template>
  <div
    id="capsuleBar"
    class="w-full h-full flex items-center justify-center py-2 px-1 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-black/8 dark:border-white/8 rounded-full overflow-hidden shadow-sm transition-all duration-300"
    :style="{
      boxShadow: isDarkMode
        ? '0 0px 8px rgba(0,0,0,0.2), 0 2px 6px rgba(0,0,0,0.2)'
        : '0 0px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
    }"
  >
    <div class="flex items-center w-full h-full gap-3">
      <!-- Left Section: Timer and Waveform -->
      <div
        class="flex items-center gap-3 min-w-24 px-3 py-1.5 rounded-full transition-all duration-300"
        :class="
          isRecording
            ? 'bg-red-500/15 dark:bg-red-500/20'
            : 'bg-white/80 dark:bg-white/80'
        "
      >
        <div
          class="text-sm font-bold tracking-wide min-w-12 text-red-500 dark:text-red-400"
        >
          {{ formattedTime }}
        </div>
        <div class="flex-1 h-5">
          <WaveformVisualization
            :data="waveformData"
            :is-recording="isRecording"
            class="waveform"
          />
        </div>
      </div>

      <!-- Center Section: Main Action -->
      <div class="flex items-center gap-3 flex-1 justify-center">
        <button
          class="w-7 h-7 rounded-full border-0 flex items-center justify-center transition-all duration-200 shadow-sm"
          :class="[
            !isConnected
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : isRecording
                ? 'bg-red-500 text-white shadow-red-500/30 shadow-lg cursor-pointer hover:scale-110 active:scale-95'
                : 'bg-black/10 dark:bg-white/15 text-black/80 dark:text-white/90 hover:bg-black/15 dark:hover:bg-white/20 cursor-pointer hover:scale-110 active:scale-95',
          ]"
          @click="isConnected ? $emit('toggle-recording') : null"
          :disabled="!isConnected"
          :title="!isConnected ? 'Initializing...' : 'Toggle Recording (⌘R)'"
        >
          <!-- Loading spinner when not connected -->
          <svg
            v-if="!isConnected"
            class="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="2"
              opacity="0.3"
            />
            <path
              d="M12 2a10 10 0 0 1 10 10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <!-- Microphone icon when connected -->
          <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"
            />
          </svg>
        </button>
        <span
          class="text-sm font-medium whitespace-nowrap"
          :class="
            !isConnected
              ? 'text-gray-500 dark:text-gray-400'
              : 'text-black/80 dark:text-white/90'
          "
        >
          {{
            !isConnected
              ? 'Initializing...'
              : isRecording
                ? 'Listening…'
                : 'Start Recording'
          }}
        </span>
      </div>

      <!-- Right Section: Controls -->
      <div class="flex items-center gap-1">
        <button
          class="w-8 h-8 rounded-full border-0 flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
          :class="
            transcriptWindowOpen
              ? 'bg-blue-500/15 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
              : 'bg-transparent text-black/60 dark:text-white/70 hover:bg-black/8 dark:hover:bg-white/10 hover:text-black/80 dark:hover:text-white/90'
          "
          @click="$emit('show-transcript')"
          :title="
            transcriptWindowOpen
              ? 'Close Transcript (⌘T)'
              : 'Open Transcript (⌘T)'
          "
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        </button>
        <button
          class="w-8 h-8 rounded-full border-0 flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
          :class="
            archiveWindowOpen
              ? 'bg-green-500/15 dark:bg-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-transparent text-black/60 dark:text-white/70 hover:bg-black/8 dark:hover:bg-white/10 hover:text-black/80 dark:hover:text-white/90'
          "
          @click="$emit('show-archive')"
          :title="
            archiveWindowOpen ? 'Close Archive (⌘Y)' : 'Open Archive (⌘Y)'
          "
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"
            />
          </svg>
        </button>
        <button
          class="w-8 h-8 rounded-full border-0 bg-transparent text-black/60 dark:text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-black/8 dark:hover:bg-white/10 hover:text-black/80 dark:hover:text-white/90 active:scale-95"
          @click="$emit('show-settings')"
          title="Settings (⌘,)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.65 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"
            />
          </svg>
        </button>
        <button
          class="w-8 h-8 rounded-full border-0 bg-transparent text-black/60 dark:text-white/70 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-500/15 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400 active:scale-95"
          @click="$emit('close')"
          title="Close"
        >
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import WaveformVisualization from './WaveformVisualization.vue'

export default {
  name: 'CapsuleBar',
  components: {
    WaveformVisualization,
  },
  props: {
    isRecording: {
      type: Boolean,
      default: false,
    },
    elapsedTime: {
      type: Number,
      default: 0,
    },
    waveformData: {
      type: Array,
      default: () => [],
    },
    currentText: {
      type: String,
      default: '',
    },
    isDarkMode: {
      type: Boolean,
      default: false,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    transcriptWindowOpen: {
      type: Boolean,
      default: false,
    },
    archiveWindowOpen: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'toggle-recording',
    'show-transcript',
    'show-archive',
    'show-settings',
    'minimize',
    'close',
  ],
  setup(props) {
    const formattedTime = computed(() => {
      const minutes = Math.floor(props.elapsedTime / 60)
        .toString()
        .padStart(2, '0')
      const seconds = (props.elapsedTime % 60).toString().padStart(2, '0')
      return `${minutes}:${seconds}`
    })

    return {
      formattedTime,
      isDarkMode: props.isDarkMode,
    }
  },
}
</script>

<style scoped>
button {
  -webkit-app-region: no-drag;
}

/* Custom Tailwind utilities */
.w-8\.5 {
  width: 2.125rem;
}
.h-8\.5 {
  height: 2.125rem;
}
.w-4\.5 {
  width: 1.125rem;
}
.h-4\.5 {
  height: 1.125rem;
}
</style>
