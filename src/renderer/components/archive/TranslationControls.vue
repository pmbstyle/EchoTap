<template>
  <div class="flex flex-col items-center justify-between">
    <div class="flex items-center gap-2">
      <select
        :value="selectedLanguage"
        @change="$emit('update:selected-language', $event.target.value)"
        :disabled="isTranslating"
        class="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50"
      >
        <option value="">Select language</option>
        <option
          v-for="lang in supportedLanguages"
          :key="lang.code"
          :value="lang.code"
        >
          {{ lang.name }}
        </option>
      </select>
      <button
        @click="$emit('translate')"
        :disabled="!selectedLanguage || isTranslating"
        class="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Translate content"
      >
        <svg
          v-if="!isTranslating"
          class="w-3 h-3"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
          />
        </svg>
        <div
          v-else
          class="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"
        ></div>
        <span>{{ isTranslating ? 'Translating...' : 'Translate' }}</span>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TranslationControls',
  props: {
    selectedLanguage: {
      type: String,
      default: ''
    },
    supportedLanguages: {
      type: Array,
      default: () => []
    },
    isTranslating: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:selected-language', 'translate']
}
</script>