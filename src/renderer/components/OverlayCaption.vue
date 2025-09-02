<template>
  <div 
    class="fixed bg-white/90 dark:bg-gray-800/90 border border-black/10 dark:border-white/10 rounded-lg backdrop-blur-xl shadow-lg dark:shadow-xl z-50 cursor-move select-none font-mono flex flex-col min-w-[200px] min-h-[40px]"
    :style="overlayStyle"
    ref="overlayElement"
  >
    <div class="flex-1 p-3 text-black/85 dark:text-white/90 leading-relaxed break-words">{{ text }}</div>
    <div 
      class="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-black/5 dark:bg-white/5 opacity-0 transition-opacity duration-200 hover:opacity-100 resize-handle"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  name: 'OverlayCaption',
  props: {
    text: {
      type: String,
      default: ''
    },
    fontSize: {
      type: Number,
      default: 16
    }
  },
  setup(props) {
    const overlayElement = ref(null)
    const position = ref({ x: 100, y: 100 })
    const size = ref({ width: 400, height: 80 })
    const isDragging = ref(false)
    const isResizing = ref(false)
    const dragStart = ref({ x: 0, y: 0 })
    const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

    const overlayStyle = computed(() => ({
      left: `${position.value.x}px`,
      top: `${position.value.y}px`,
      width: `${size.value.width}px`,
      height: `${size.value.height}px`,
      fontSize: `${props.fontSize}px`
    }))

    const startDrag = (event) => {
      isDragging.value = true
      dragStart.value = {
        x: event.clientX - position.value.x,
        y: event.clientY - position.value.y
      }
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', stopDrag)
      event.preventDefault()
    }

    const handleDrag = (event) => {
      if (!isDragging.value) return
      
      position.value = {
        x: event.clientX - dragStart.value.x,
        y: event.clientY - dragStart.value.y
      }
    }

    const stopDrag = () => {
      isDragging.value = false
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
    }

    const startResize = (event) => {
      isResizing.value = true
      resizeStart.value = {
        x: event.clientX,
        y: event.clientY,
        width: size.value.width,
        height: size.value.height
      }
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', stopResize)
      event.preventDefault()
      event.stopPropagation()
    }

    const handleResize = (event) => {
      if (!isResizing.value) return

      const deltaX = event.clientX - resizeStart.value.x
      const deltaY = event.clientY - resizeStart.value.y

      size.value = {
        width: Math.max(200, resizeStart.value.width + deltaX),
        height: Math.max(40, resizeStart.value.height + deltaY)
      }
    }

    const stopResize = () => {
      isResizing.value = false
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
    }

    onMounted(() => {
      // Make the overlay draggable
      if (overlayElement.value) {
        overlayElement.value.addEventListener('mousedown', startDrag)
      }
    })

    onUnmounted(() => {
      // Clean up event listeners
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', stopResize)
    })

    return {
      overlayElement,
      overlayStyle,
      startResize
    }
  }
}
</script>

<style scoped>
/* Hover state for resize handle */
.resize-handle:hover,
*:hover .resize-handle {
  opacity: 1 !important;
}

/* Resize handle triangle indicator */
.resize-handle::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-bottom: 6px solid rgba(0, 0, 0, 0.4);
}

.dark-mode .resize-handle::after {
  border-bottom-color: rgba(255, 255, 255, 0.4);
}
</style>