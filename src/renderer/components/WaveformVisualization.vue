<template>
  <div
    class="w-full h-full flex items-center justify-center"
    ref="waveformContainer"
  >
    <canvas
      ref="canvas"
      :width="canvasWidth"
      :height="canvasHeight"
      class="block w-full h-full"
    ></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

export default {
  name: 'WaveformVisualization',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    isRecording: {
      type: Boolean,
      default: false,
    },
    maxBars: {
      type: Number,
      default: 30,
    },
    minHeight: {
      type: Number,
      default: 2,
    },
    maxHeight: {
      type: Number,
      default: 16,
    },
  },
  setup(props) {
    const waveformContainer = ref(null)
    const canvas = ref(null)
    const canvasWidth = ref(120)
    const canvasHeight = ref(20)

    let animationId = null
    let bars = []
    let targetBars = []
    let audioHistory = [] // Store recent audio data for shifting effect

    // Initialize with random static bars for idle state
    const initializeBars = () => {
      bars = Array(props.maxBars)
        .fill()
        .map(() => ({
          height: props.minHeight + Math.random() * 2,
          targetHeight: props.minHeight,
          velocity: 0,
        }))
      targetBars = [...bars]
      audioHistory = Array(props.maxBars).fill(0.05) // Initialize history
    }

    // Smooth animation between states
    const animateBars = () => {
      const ctx = canvas.value?.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

      // Get colors based on theme and recording state
      const isDark = document.documentElement.classList.contains('dark-mode')
      let barColor

      if (props.isRecording) {
        barColor = isDark ? '#FF453A' : '#FF3B30'
      } else {
        barColor = isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)'
      }

      const barWidth = 2
      const barSpacing = 1
      const totalBarWidth = barWidth + barSpacing
      const startX =
        (canvasWidth.value - (props.maxBars * totalBarWidth - barSpacing)) / 2

      // Update and draw bars
      bars.forEach((bar, index) => {
        // Much more responsive animation for real-time waveform
        const diff = bar.targetHeight - bar.height
        if (props.isRecording && props.data && props.data.length > 0) {
          // Real data - very responsive, minimal smoothing
          bar.velocity += diff * 0.35
          bar.velocity *= 0.65
          bar.height += bar.velocity
        } else {
          // Fallback animation - can be smoother
          bar.velocity += diff * 0.1
          bar.velocity *= 0.8
          bar.height += bar.velocity
        }

        // Ensure minimum height
        bar.height = Math.max(bar.height, props.minHeight)

        // Draw bar
        const x = startX + index * totalBarWidth
        const barHeight = Math.round(bar.height)
        const y = (canvasHeight.value - barHeight) / 2

        ctx.fillStyle = barColor
        ctx.fillRect(x, y, barWidth, barHeight)
      })

      animationId = requestAnimationFrame(animateBars)
    }

    // Update bars based on audio data or state
    const updateBars = () => {
      if (props.isRecording && props.data && props.data.length > 0) {
        // Get the latest audio data point (or average if multiple)
        const latestAmplitude =
          props.data.length > 0
            ? props.data.reduce((sum, val) => sum + val, 0) / props.data.length
            : 0.05

        // Shift history left and add new data on the right
        audioHistory.shift() // Remove leftmost (oldest)
        audioHistory.push(latestAmplitude) // Add rightmost (newest)

        // Create target heights from history (newest data appears on right)
        targetBars = audioHistory.map(amplitude => ({
          targetHeight:
            props.minHeight + amplitude * (props.maxHeight - props.minHeight),
        }))
      } else if (props.isRecording) {
        // Minimal animation while waiting for real data - don't compete with real data
        targetBars = Array(props.maxBars)
          .fill()
          .map((_, index) => {
            // Simple, predictable pattern that won't interfere
            const baseHeight = props.minHeight + 2
            const variation = Math.sin(Date.now() * 0.005 + index * 0.3) * 1
            return {
              targetHeight: baseHeight + Math.abs(variation),
            }
          })
      } else {
        // Idle state - subtle static bars and reset history
        audioHistory = Array(props.maxBars).fill(0.05)
        targetBars = Array(props.maxBars)
          .fill()
          .map(() => ({
            targetHeight: props.minHeight + Math.random() * 1.5,
          }))
      }

      // Update target heights
      bars.forEach((bar, index) => {
        if (targetBars[index]) {
          bar.targetHeight = targetBars[index].targetHeight
        }
      })
    }

    // Handle resize
    const handleResize = () => {
      nextTick(() => {
        if (waveformContainer.value) {
          const rect = waveformContainer.value.getBoundingClientRect()
          canvasWidth.value = rect.width
          canvasHeight.value = rect.height
        }
      })
    }

    // Watchers
    watch(() => props.data, updateBars, { deep: true })
    watch(() => props.isRecording, updateBars)

    onMounted(() => {
      initializeBars()
      handleResize()
      updateBars()
      animateBars()

      // Update bars periodically for smooth animation
      const interval = setInterval(updateBars, 100)

      // Resize observer
      const resizeObserver = new ResizeObserver(handleResize)
      if (waveformContainer.value) {
        resizeObserver.observe(waveformContainer.value)
      }

      onUnmounted(() => {
        clearInterval(interval)
        resizeObserver.disconnect()
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
      })
    })

    return {
      waveformContainer,
      canvas,
      canvasWidth,
      canvasHeight,
    }
  },
}
</script>
