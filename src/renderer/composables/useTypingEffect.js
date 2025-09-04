import { ref } from 'vue'

export function useTypingEffect() {
  const displayedText = ref('')
  const isTyping = ref(false)
  const typingSpeed = ref(25) // milliseconds per character

  let currentTargetText = ''
  let typingTimer = null
  let currentPosition = 0

  const startTyping = (targetText, speed = 25) => {
    // If the new text starts with the current displayed text, just append
    if (targetText.startsWith(displayedText.value)) {
      const newText = targetText.slice(displayedText.value.length)
      appendText(newText, speed)
      return
    }

    // Otherwise, clear and type the new text
    stopTyping()
    currentTargetText = targetText
    currentPosition = 0
    typingSpeed.value = speed
    isTyping.value = true
    displayedText.value = ''

    typeNextCharacter()
  }

  const appendText = (newText, speed = 25) => {
    if (!newText) return

    stopTyping()
    currentTargetText = displayedText.value + newText
    currentPosition = displayedText.value.length
    typingSpeed.value = speed
    isTyping.value = true

    typeNextCharacter()
  }

  const typeNextCharacter = () => {
    if (currentPosition >= currentTargetText.length) {
      isTyping.value = false
      return
    }

    displayedText.value = currentTargetText.slice(0, currentPosition + 1)
    currentPosition++

    // Vary typing speed slightly for more natural feel
    const variation = Math.random() * 10 - 5 // ±5ms variation
    const nextSpeed = Math.max(5, typingSpeed.value + variation)

    typingTimer = setTimeout(typeNextCharacter, nextSpeed)
  }

  const stopTyping = () => {
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
    isTyping.value = false
  }

  const instantText = text => {
    stopTyping()
    displayedText.value = text
    currentTargetText = text
    currentPosition = text.length
  }

  const clearText = () => {
    stopTyping()
    displayedText.value = ''
    currentTargetText = ''
    currentPosition = 0
  }

  return {
    displayedText,
    isTyping,
    startTyping,
    appendText,
    stopTyping,
    instantText,
    clearText,
  }
}
