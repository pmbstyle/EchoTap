import { createApp } from 'vue'
import SettingsWindow from './components/SettingsWindow.vue'
import './assets/main.css'

// Create Vue app with SettingsWindow component
const app = createApp(SettingsWindow)

// Mount the app
app.mount('#app')

// Handle app-level errors
app.config.errorHandler = (err, instance, info) => {
  console.error('Settings window error:', err, info)
}

// Handle global theme
const applyTheme = (theme) => {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('dark-mode', isDark)
}

// Initialize theme
if (window.electronAPI) {
  window.electronAPI.getSettings().then((settings) => {
    if (settings?.theme) {
      applyTheme(settings.theme)
    }
  }).catch(() => {
    // Fallback to system theme
    applyTheme('system')
  })
}

// Listen for theme changes
if (window.electronAPI) {
  window.electronAPI.onThemeChanged((event, theme) => {
    applyTheme(theme)
  })
}