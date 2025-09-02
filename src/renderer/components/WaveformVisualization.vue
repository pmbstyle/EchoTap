<template>
  <div class="w-full h-full flex items-center justify-center" ref="waveformContainer">
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
      default: () => []
    },
    isRecording: {
      type: Boolean,
      default: false
    },
    maxBars: {
      type: Number,
      default: 20
    },
    minHeight: {
      type: Number,
      default: 2
    },
    maxHeight: {
      type: Number,
      default: 16
    }
  },
  setup(props) {
    const waveformContainer = ref(null)
    const canvas = ref(null)
    const canvasWidth = ref(120)
    const canvasHeight = ref(20)
    
    let animationId = null
    let bars = []
    let targetBars = []

    // Initialize with random static bars for idle state
    const initializeBars = () => {
      bars = Array(props.maxBars).fill().map(() => ({
        height: props.minHeight + Math.random() * 2,
        targetHeight: props.minHeight,
        velocity: 0
      }))
      targetBars = [...bars]
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
      const startX = (canvasWidth.value - (props.maxBars * totalBarWidth - barSpacing)) / 2

      // Update and draw bars
      bars.forEach((bar, index) => {
        // Smooth animation towards target
        const diff = bar.targetHeight - bar.height
        bar.velocity += diff * 0.1
        bar.velocity *= 0.8 // Damping
        bar.height += bar.velocity

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
      if (props.isRecording && props.data.length > 0) {
        // Use actual audio data
        const audioData = props.data.slice(-props.maxBars)
        targetBars = audioData.map(amplitude => ({
          targetHeight: props.minHeight + (amplitude * (props.maxHeight - props.minHeight))
        }))
      } else if (props.isRecording) {
        // Generate animated bars while recording (no audio data yet)
        targetBars = Array(props.maxBars).fill().map((_, index) => {
          const phase = Date.now() * 0.01 + index * 0.5
          const amplitude = (Math.sin(phase) + 1) / 2
          return {
            targetHeight: props.minHeight + amplitude * (props.maxHeight - props.minHeight) * 0.7
          }
        })
      } else {
        // Idle state - subtle static bars
        targetBars = Array(props.maxBars).fill().map(() => ({
          targetHeight: props.minHeight + Math.random() * 1.5
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
      canvasHeight
    }
  }
}
</script>

