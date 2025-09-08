<template>
  <div
    class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4"
    @click="closeWindow"
  >
    <div
      class="w-full max-w-lg h-full max-h-[90vh] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border border-black/8 dark:border-white/8 rounded-3xl shadow-sm flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300 dark:shadow-black/50"
      @click.stop
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-black/8 dark:border-white/8 bg-white/80 dark:bg-neutral-900/80"
        style="-webkit-app-region: drag"
      >
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-blue-500"></div>
          <span class="text-base font-semibold text-gray-900 dark:text-white">
            Settings
          </span>
        </div>
        <div class="flex gap-2" style="-webkit-app-region: no-drag">
          <button
            class="w-8 h-8 rounded-full border-0 bg-transparent text-gray-600 dark:text-gray-400 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-red-500/15 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400"
            @click="closeWindow"
            title="Close (Esc)"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto p-6" style="-webkit-app-region: no-drag; user-select: text">
        <!-- Theme Settings -->
        <div class="mb-6">
          <h3 class="m-0 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Appearance
          </h3>
          <select
            v-model="settings.theme"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <p class="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400">
            Choose your preferred theme or follow system settings
          </p>
        </div>

        <!-- Transcription Model Settings -->
        <div class="mb-6">
          <h3 class="m-0 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Transcription Model
          </h3>
          <select
            v-model="settings.transcriptionModel"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="tiny">Tiny (39 MB) - Fastest, basic quality</option>
            <option value="base">Base (74 MB) - Balanced speed and quality</option>
            <option value="small">Small (244 MB) - Better quality, slower</option>
            <option value="medium">Medium (769 MB) - Best quality, slowest</option>
          </select>
          <p class="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400">
            Larger models provide better accuracy but use more resources
          </p>
        </div>

        <!-- Summarization Model Settings -->
        <div class="mb-6">
          <h3 class="m-0 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Summarization Model
          </h3>
          <select
            v-model="settings.summarizationModel"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            :disabled="!summarizationModels.length"
          >
            <option v-if="!summarizationModels.length" value="">Loading models...</option>
            <option
              v-for="model in summarizationModels"
              :key="model.tier"
              :value="model.tier"
            >
              {{ model.name }} ({{ model.size_mb }}MB) - {{ model.description }}
            </option>
          </select>
          <p class="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400">
            Model used for generating summaries of your transcription sessions
          </p>
        </div>

        <!-- Translation Model Settings -->
        <div class="mb-6">
          <h3 class="m-0 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Translation Model
          </h3>
          <select
            v-model="settings.translationModel"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
            :disabled="!translationModels.length"
          >
            <option v-if="!translationModels.length" value="">Loading models...</option>
            <option
              v-for="model in translationModels"
              :key="model.tier"
              :value="model.tier"
            >
              {{ model.name }} ({{ model.size_mb }}MB) - {{ model.description }}
            </option>
          </select>
          <p class="mt-1 mb-0 text-xs text-gray-600 dark:text-gray-400">
            Model used for translating your transcripts to different languages
          </p>
        </div>

        <!-- Audio Source Settings -->
        <div class="mb-6">
          <h3 class="m-0 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Audio Source
          </h3>
          <select
            v-model="settings.audioSource"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="system">System Audio</option>
            <option value="microphone">Microphone</option>
          </select>
        </div>

        <!-- Language Settings -->
        <div class="mb-6">
          <h3 class="m-0 mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Language
          </h3>
          <select
            v-model="settings.language"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
          >
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
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-black/8 dark:border-white/8 bg-white/80 dark:bg-neutral-900/80" style="-webkit-app-region: no-drag">
        <button
          @click="resetToDefaults"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-600 dark:text-gray-400 text-sm cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8"
        >
          Reset to Defaults
        </button>
        <div class="flex gap-3">
          <button
            @click="closeWindow"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-transparent text-gray-900 dark:text-white text-sm cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/8"
          >
            Cancel
          </button>
          <button
            @click="saveSettings"
            :disabled="isSaving"
            class="px-4 py-2 border-0 rounded-md bg-blue-500 text-white text-sm cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSaving ? 'Saving...' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'SettingsWindow',
  setup() {
    const isSaving = ref(false)
    const summarizationModels = ref([])
    const translationModels = ref([])
    
    const settings = ref({
      theme: 'system',
      transcriptionModel: 'base',
      summarizationModel: 'balanced',
      translationModel: 'balanced',
      audioSource: 'system',
      language: 'auto',
    })

    const loadSettings = async () => {
      try {
        const saved = await window.electronAPI.getSettings()
        if (saved) {
          Object.assign(settings.value, saved)
        }
      } catch (error) {
        console.error('Failed to load settings:', error)
      }
    }

    const loadAvailableModels = async () => {
      try {
        const models = await window.electronAPI.getAvailableModels()
        summarizationModels.value = models.summarization || []
        translationModels.value = models.translation || []
      } catch (error) {
        console.error('Failed to load available models:', error)
        // Fallback to default models
        summarizationModels.value = [
          { tier: 'minimal', name: 'TinyLlama-1.1B-Chat', size_mb: 600, description: 'Lightweight model' },
          { tier: 'balanced', name: 'Phi-3.5-Mini-Instruct', size_mb: 2300, description: 'Balanced performance' },
          { tier: 'quality', name: 'Qwen2.5-3B-Instruct', size_mb: 1900, description: 'High quality model' }
        ]
        translationModels.value = summarizationModels.value
      }
    }

    const saveSettings = async () => {
      isSaving.value = true
      try {
        // Save settings to file (convert reactive object to plain object)
        // Map models for backend compatibility
        const getTranscriptionModelName = (tier) => {
          const mapping = {
            'tiny': 'tiny',
            'balanced': 'base',
            'quality': 'small',
            'premium': 'medium'
          }
          return mapping[tier] || tier
        }
        
        const plainSettings = {
          theme: settings.value.theme,
          transcriptionModel: getTranscriptionModelName(settings.value.transcriptionModel),
          summarizationModel: settings.value.summarizationModel,  // Keep tier name for LLM engine
          translationModel: settings.value.translationModel      // Keep tier name for LLM engine
        }
        await window.electronAPI.saveSettings(plainSettings)
        
        // Apply theme changes immediately
        await window.electronAPI.applyTheme(plainSettings.theme)
        
        // Download models if needed
        if (plainSettings.transcriptionModel) {
          await window.electronAPI.downloadTranscriptionModel(plainSettings.transcriptionModel)
        }
        if (plainSettings.summarizationModel) {
          await window.electronAPI.downloadSummarizationModel(plainSettings.summarizationModel)
        }
        if (plainSettings.translationModel) {
          await window.electronAPI.downloadTranslationModel(plainSettings.translationModel)
        }

        // Send settings to backend
        await window.electronAPI.sendToBackend({
          type: 'update_settings',
          settings: plainSettings,
        })

        closeWindow()
      } catch (error) {
        console.error('Failed to save settings:', error)
      } finally {
        isSaving.value = false
      }
    }

    const resetToDefaults = () => {
      settings.value = {
        theme: 'system',
        transcriptionModel: 'base',
        summarizationModel: 'balanced',
        translationModel: 'balanced',
        audioSource: 'system',
        language: 'auto',
      }
    }

    const closeWindow = () => {
      if (window.electronAPI) {
        window.electronAPI.closeSettings()
      }
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        closeWindow()
      }
    }

    onMounted(() => {
      loadSettings()
      loadAvailableModels()
      document.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })

    return {
      settings,
      summarizationModels,
      translationModels,
      isSaving,
      saveSettings,
      resetToDefaults,
      closeWindow,
    }
  },
}
</script>

<style scoped>
/* Custom animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-from-bottom-4 {
  from {
    transform: translateY(1rem);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-in {
  animation-fill-mode: both;
}

.fade-in {
  animation: fade-in 0.2s ease-out;
}

.slide-in-from-bottom-4 {
  animation: slide-in-from-bottom-4 0.3s ease-out;
}

.duration-200 {
  animation-duration: 0.2s;
}

.duration-300 {
  animation-duration: 0.3s;
}
</style>