const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Store operations
  getStoreValue: (key) => ipcRenderer.invoke('get-store-value', key),
  setStoreValue: (key, value) => ipcRenderer.invoke('set-store-value', key, value),
  
  // Backend communication
  sendToBackend: (message) => ipcRenderer.invoke('send-to-backend', message),
  onBackendMessage: (callback) => ipcRenderer.on('backend-message', callback),
  
  // Window operations
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  showTranscript: () => ipcRenderer.invoke('show-transcript'),
  closeTranscript: () => ipcRenderer.invoke('close-transcript'),
  showArchive: () => ipcRenderer.invoke('show-archive'),
  closeArchive: () => ipcRenderer.invoke('close-archive'),
  
  // Events from main process
  onShowPreferences: (callback) => ipcRenderer.on('show-preferences', callback),
  onCopyTranscript: (callback) => ipcRenderer.on('copy-transcript', callback),
  onToggleOverlay: (callback) => ipcRenderer.on('toggle-overlay', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})