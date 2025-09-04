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

  // Events from main process
  onShowPreferences: callback => ipcRenderer.on('show-preferences', callback),
  onCopyTranscript: callback => ipcRenderer.on('copy-transcript', callback),
  onToggleOverlay: callback => ipcRenderer.on('toggle-overlay', callback),

  // Remove listeners
  removeAllListeners: channel => ipcRenderer.removeAllListeners(channel),
})
