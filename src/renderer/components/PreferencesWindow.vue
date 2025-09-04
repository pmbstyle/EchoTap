<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="$emit('close')">
    <div class="w-[500px] max-h-[80vh] bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col overflow-hidden" @click.stop>
      <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
        <h2 class="m-0 text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
        <button class="w-7 h-7 border-0 bg-transparent rounded-md text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8" @click="$emit('close')">
          <svg class="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Audio Source</h3>
          <select v-model="preferences.audioSource" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400">
            <option value="system">System Audio</option>
            <option value="microphone">Microphone</option>
          </select>
          <p class="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400">Choose between system audio capture or microphone input</p>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Language</h3>
          <select v-model="preferences.language" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400">
            <option value="auto">Auto-detect</option>
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="it">Italian</option>
            <option value="pt">Portuguese</option>
            <option value="ru">Russian</option>
            <option value="ja">Japanese</option>
            <option value="ko">Korean</option>
            <option value="zh">Chinese</option>
          </select>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Model</h3>
          <select v-model="preferences.model" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400">
            <option value="tiny">Tiny (39 MB) - Fastest</option>
            <option value="base">Base (74 MB) - Balanced</option>
            <option value="small">Small (244 MB) - Better quality</option>
            <option value="medium">Medium (769 MB) - Best quality</option>
          </select>
          <p class="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400">Larger models provide better accuracy but use more resources</p>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Voice Activity Detection</h3>
          <div class="flex items-center gap-3">
            <label class="min-w-[80px] text-xs text-gray-900 dark:text-white">Sensitivity:</label>
            <input 
              v-model="preferences.vadSensitivity" 
              type="range" 
              min="0" 
              max="100" 
              class="flex-1 h-1 rounded-sm bg-gray-200 dark:bg-gray-600 outline-none appearance-none slider"
            >
            <span class="min-w-[40px] text-right text-xs text-gray-600 dark:text-gray-400">{{ preferences.vadSensitivity }}%</span>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Copy Behavior</h3>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="preferences.copyMode" value="current" class="m-0">
              <span class="text-sm text-gray-900 dark:text-white">Current line only</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="preferences.copyMode" value="recent" class="m-0">
              <span class="text-sm text-gray-900 dark:text-white">Last N minutes</span>
            </label>
          </div>
          <div v-if="preferences.copyMode === 'recent'" class="flex items-center gap-2 mt-2">
            <label class="text-xs text-gray-900 dark:text-white">Minutes:</label>
            <input 
              v-model.number="preferences.copyMinutes" 
              type="number" 
              min="1" 
              max="30" 
              class="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            >
          </div>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Appearance</h3>
          <select v-model="preferences.theme" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400">
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Overlay</h3>
          <div class="flex items-center gap-3">
            <label class="min-w-[80px] text-xs text-gray-900 dark:text-white">Font Size:</label>
            <input 
              v-model="preferences.overlayFontSize" 
              type="range" 
              min="12" 
              max="24" 
              class="flex-1 h-1 rounded-sm bg-gray-200 dark:bg-gray-600 outline-none appearance-none slider"
            >
            <span class="min-w-[40px] text-right text-xs text-gray-600 dark:text-gray-400">{{ preferences.overlayFontSize }}px</span>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Global Shortcuts</h3>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-gray-900 dark:text-white">Start/Stop Recording:</label>
            <input 
              v-model="preferences.shortcuts.startStop" 
              type="text" 
              class="w-30 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs text-center cursor-not-allowed"
              readonly
            >
          </div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-gray-900 dark:text-white">Copy Transcript:</label>
            <input 
              v-model="preferences.shortcuts.copy" 
              type="text" 
              class="w-30 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs text-center cursor-not-allowed"
              readonly
            >
          </div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs text-gray-900 dark:text-white">Toggle Overlay:</label>
            <input 
              v-model="preferences.shortcuts.toggleOverlay" 
              type="text" 
              class="w-30 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs text-center cursor-not-allowed"
              readonly
            >
          </div>
        </div>

        <div class="mb-6">
          <h3 class="m-0 mb-2 text-sm font-semibold text-gray-900 dark:text-white">Privacy</h3>
          <label class="flex items-center gap-2 mb-2 cursor-pointer">
            <input type="checkbox" v-model="preferences.checkForUpdates" class="m-0">
            <span class="text-sm text-gray-900 dark:text-white">Check for updates automatically</span>
          </label>
          <label class="flex items-center gap-2 mb-2 cursor-not-allowed">
            <input type="checkbox" v-model="preferences.telemetry" disabled class="m-0">
            <span class="text-sm text-gray-600 dark:text-gray-400">Send anonymous usage data (always disabled)</span>
          </label>
        </div>
      </div>

      <div class="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="resetToDefaults" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-600 dark:text-gray-400 text-xs cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8">Reset to Defaults</button>
        <div class="flex gap-2">
          <button @click="$emit('close')" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white text-xs cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8">Cancel</button>
          <button @click="savePreferences" class="px-4 py-2 border-0 rounded-md bg-blue-500 text-white text-xs cursor-pointer transition-all duration-200 hover:opacity-90">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'PreferencesWindow',
  emits: ['close'],
  setup(props, { emit }) {
    const preferences = ref({
      audioSource: 'system',
      language: 'auto',
      model: 'base',
      vadSensitivity: 50,
      copyMode: 'current',
      copyMinutes: 5,
      theme: 'system',
      overlayFontSize: 16,
      shortcuts: {
        startStop: 'Alt+Shift+S',
        copy: 'Alt+Shift+C',
        toggleOverlay: 'Alt+Shift+O'
      },
      checkForUpdates: false,
      telemetry: false
    })

    const loadPreferences = async () => {
      try {
        const saved = await window.electronAPI.getStoreValue('preferences')
        if (saved) {
          Object.assign(preferences.value, saved)
        }
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }

    const savePreferences = async () => {
      try {
        await window.electronAPI.setStoreValue('preferences', preferences.value)
        
        // Send preferences to backend
        await window.electronAPI.sendToBackend({
          type: 'update_preferences',
          preferences: preferences.value
        })
        
        emit('close')
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
    }

    const resetToDefaults = () => {
      preferences.value = {
        audioSource: 'system',
        language: 'auto',
        model: 'base',
        vadSensitivity: 50,
        copyMode: 'current',
        copyMinutes: 5,
        theme: 'system',
        overlayFontSize: 16,
        shortcuts: {
          startStop: 'Alt+Shift+S',
          copy: 'Alt+Shift+C',
          toggleOverlay: 'Alt+Shift+O'
        },
        checkForUpdates: false,
        telemetry: false
      }
    }

    onMounted(() => {
      loadPreferences()
    })

    return {
      preferences,
      savePreferences,
      resetToDefaults
    }
  }
}
</script>

<style scoped>
/* Custom Tailwind utilities */
.w-4\.5 {
  width: 1.125rem;
}
.h-4\.5 {
  height: 1.125rem;
}
.w-30 {
  width: 7.5rem;
}

/* Custom slider styles */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.dark-mode .slider::-webkit-slider-thumb {
  background: #60a5fa;
}
</style>