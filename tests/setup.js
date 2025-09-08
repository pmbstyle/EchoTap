/**
 * Test setup file for Vitest
 * Global test configuration and mocks
 */

// Mock Electron APIs for frontend tests
global.window = global.window || {}
global.window.electronAPI = {
  // Mock Electron preload API
  minimize: () => Promise.resolve(),
  close: () => Promise.resolve(),
  toggleAlwaysOnTop: () => Promise.resolve(),
  openArchive: () => Promise.resolve(),
  openPreferences: () => Promise.resolve(),
  openTranscriptWindow: () => Promise.resolve(),
  
  // Mock IPC communication
  invoke: (channel, ...args) => {
    console.log(`Mock IPC invoke: ${channel}`, args)
    return Promise.resolve({ success: true })
  },
  
  on: (channel, callback) => {
    console.log(`Mock IPC on: ${channel}`)
    // Return mock unsubscribe function
    return () => {}
  }
}

// Mock WebSocket for testing
global.WebSocket = class MockWebSocket {
  constructor(url) {
    this.url = url
    this.readyState = WebSocket.CONNECTING
    setTimeout(() => {
      this.readyState = WebSocket.OPEN
      if (this.onopen) this.onopen({})
    }, 0)
  }
  
  static get CONNECTING() { return 0 }
  static get OPEN() { return 1 }
  static get CLOSING() { return 2 }
  static get CLOSED() { return 3 }
  
  send(data) {
    console.log('Mock WebSocket send:', data)
  }
  
  close() {
    this.readyState = WebSocket.CLOSED
    if (this.onclose) this.onclose({})
  }
}

// Mock MediaDevices for audio testing
global.navigator = global.navigator || {}
global.navigator.mediaDevices = {
  getUserMedia: () => Promise.resolve({
    getTracks: () => [{ stop: () => {} }],
    getAudioTracks: () => [{ stop: () => {} }]
  }),
  
  enumerateDevices: () => Promise.resolve([
    { deviceId: 'default', kind: 'audioinput', label: 'Default Microphone' }
  ])
}

// Mock AudioContext for VAD testing
global.AudioContext = class MockAudioContext {
  constructor() {
    this.sampleRate = 16000
    this.state = 'running'
  }
  
  createAnalyser() {
    return {
      fftSize: 256,
      frequencyBinCount: 128,
      getFloatFrequencyData: () => {},
      connect: () => {},
      disconnect: () => {}
    }
  }
  
  createMediaStreamSource() {
    return {
      connect: () => {},
      disconnect: () => {}
    }
  }
  
  close() {
    this.state = 'closed'
    return Promise.resolve()
  }
}

// Mock requestAnimationFrame for animation testing
global.requestAnimationFrame = (callback) => {
  return setTimeout(callback, 16)
}

global.cancelAnimationFrame = (id) => {
  clearTimeout(id)
}

// Console suppression for cleaner test output
const originalConsole = { ...console }
global.console = {
  ...originalConsole,
  log: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.log,
  debug: process.env.NODE_ENV === 'test' ? () => {} : originalConsole.debug,
}