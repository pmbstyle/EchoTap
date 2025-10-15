const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations (for settings like theme, shortcuts, etc.)
  getStoreValue: key => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) =>
    ipcRenderer.invoke('set-store-value', key, value),

  // Global App State operations (for reactive app state)
  getAppState: () => ipcRenderer.invoke('get-app-state'),
  updateAppState: updates => ipcRenderer.invoke('update-app-state', updates),
  getStateProperty: property =>
    ipcRenderer.invoke('get-state-property', property),
  setStateProperty: (property, value) =>
    ipcRenderer.invoke('set-state-property', property, value),
  onAppStateChanged: callback => ipcRenderer.on('app-state-changed', callback),

  // Backend communication (for direct backend API calls)
  sendToBackend: message => ipcRenderer.invoke('send-to-backend', message),
  onBackendMessage: callback => ipcRenderer.on('backend-message', callback),

  // Window operations
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  showTranscript: () => ipcRenderer.invoke('show-transcript'),
  closeTranscript: () => ipcRenderer.invoke('close-transcript'),
  showArchive: () => ipcRenderer.invoke('show-archive'),
  closeArchive: () => ipcRenderer.invoke('close-archive'),
  showSettings: () => ipcRenderer.invoke('show-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),

  // Events from main process
  onShowPreferences: callback => ipcRenderer.on('show-preferences', callback),
  onShowPreferencesFirstRun: callback => ipcRenderer.on('show-preferences-first-run', callback),
  onCopyTranscript: callback => ipcRenderer.on('copy-transcript', callback),
  onToggleOverlay: callback => ipcRenderer.on('toggle-overlay', callback),
  onTranscriptWindowClosed: callback => ipcRenderer.on('transcript-window-closed', callback),
  onArchiveWindowClosed: callback => ipcRenderer.on('archive-window-closed', callback),
  onSettingsWindowClosed: callback => ipcRenderer.on('settings-window-closed', callback),

  // Settings operations
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  applyTheme: (theme) => ipcRenderer.invoke('apply-theme', theme),
onThemeChanged: (callback) => ipcRenderer.on('theme-changed', callback),

  // Remove listeners
  removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
})
