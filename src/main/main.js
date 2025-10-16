import {
  app,
  BrowserWindow,
  ipcMain,
  globalShortcut,
  Menu,
  Tray,
  screen,
  shell,
} from 'electron'
import path from 'path'
import Store from 'electron-store'
import { spawn } from 'child_process'
import WebSocket from 'ws'
import fs from 'fs'
import os from 'os'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const store = new Store()

let mainWindow
let transcriptWindow
let archiveWindow
let settingsWindow
let tray
let backendProcess
let wsConnection
let globalAppState = {
  isRecording: false,
  isListening: false,
  currentSessionId: null,
  elapsedTime: 0,
  displayText: '',
  sessionTranscript: '',
  partialText: '',
  isFinal: false,
  isConnected: false,
  audioSource: 'microphone',
  waveformData: new Array(20).fill(0),
  currentSession: null,
  wordCount: 0,
  charCount: 0,
}

const isDev = !app.isPackaged
function getSettingsPath() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || os.homedir(), 'EchoTap', 'settings.json')
  } else if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'EchoTap', 'settings.json')
  } else {
    return path.join(os.homedir(), '.config', 'EchoTap', 'settings.json')
  }
}

function ensureSettingsDir() {
  const settingsPath = getSettingsPath()
  const settingsDir = path.dirname(settingsPath)
  if (!fs.existsSync(settingsDir)) {
    fs.mkdirSync(settingsDir, { recursive: true })
  }
  return settingsPath
}

function getDefaultSettings() {
  return {
    theme: 'system',
    transcriptionModel: 'base',
    language: 'auto',
  }
}

function loadSettings() {
  try {
    const settingsPath = ensureSettingsDir()
    if (fs.existsSync(settingsPath)) {
      const settingsData = fs.readFileSync(settingsPath, 'utf-8')
      const settings = JSON.parse(settingsData)
      // Merge with defaults to ensure all properties exist
      return { ...getDefaultSettings(), ...settings }
    } else {
      // First run - create settings file with defaults
      const defaultSettings = getDefaultSettings()
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2))
      return defaultSettings
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    return getDefaultSettings()
  }
}

function saveSettings(settings) {
  try {
    const settingsPath = ensureSettingsDir()
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Failed to save settings:', error)
    return false
  }
}

function isFirstRun() {
  const settingsPath = getSettingsPath()
  return !fs.existsSync(settingsPath)
}

let globalSettings = loadSettings()
function updateAppTheme(theme) {
  try {
    // Apply theme to all windows
    const windows = [mainWindow, transcriptWindow, archiveWindow].filter(w => w && !w.isDestroyed())
    windows.forEach(window => {
      if (window.webContents && !window.webContents.isDestroyed()) {
        window.webContents.send('theme-changed', theme)
      }
    })
  } catch (error) {
    console.error('Error updating app theme:', error)
  }
}

function updateAppState(updates) {
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      globalAppState[key] = updates[key]
    }
  })

  const text = globalAppState.sessionTranscript || globalAppState.displayText
  globalAppState.wordCount = text ? text.trim().split(/\s+/).length : 0
  globalAppState.charCount = text ? text.length : 0

  broadcastStateToAllWindows()
}

function broadcastStateToAllWindows() {
  const windows = [mainWindow, transcriptWindow, archiveWindow].filter(
    w => w && !w.isDestroyed()
  )
  windows.forEach(window => {
    try {
      // Check webContents validity just before sending
      if (window.webContents && !window.webContents.isDestroyed()) {
        // Only send state updates to windows that are ready to receive them
        // Skip broadcasting during window creation to prevent interference
        if (window.webContents.isLoading()) {
          // Skipping state broadcast to loading window
          return
        }
        window.webContents.send('app-state-changed', globalAppState)
      }
    } catch (error) {
      console.warn('Failed to send state to window:', error.message)
    }
  })
}

function handleBackendMessage(message) {
  switch (message.type) {
    case 'connection_status':
      updateAppState({ isConnected: message.connected })
      break

    case 'recording_started':
      updateAppState({
        isRecording: true,
        currentSessionId: message.session_id,
        elapsedTime: 0,
        displayText: '',
        sessionTranscript: '',
        partialText: '',
        isFinal: false,
      })
      break

    case 'recording_stopped':
      updateAppState({
        isRecording: false,
        currentSessionId: null,
      })
      // Forward recording_stopped to all windows for clipboard copy
      const allWindows = [mainWindow, transcriptWindow, archiveWindow].filter(
        w => w && !w.isDestroyed()
      )
      allWindows.forEach(window => {
        try {
          if (window.webContents && !window.webContents.isDestroyed()) {
            window.webContents.send('backend-message', message)
          }
        } catch (error) {
          console.warn('Failed to send recording_stopped to window:', error.message)
        }
      })
      break

    case 'partial_transcript':
      updateAppState({
        partialText: message.text,
        displayText: message.text,
        isFinal: false,
      })
      // Forward to all windows for real-time display
      ;[mainWindow, transcriptWindow, archiveWindow]
        .filter(w => w && !w.isDestroyed())
        .forEach(window => {
          try {
            if (window.webContents && !window.webContents.isDestroyed()) {
              window.webContents.send('backend-message', message)
            }
          } catch (error) {
            console.warn('Failed to send partial_transcript to window:', error.message)
          }
        })
      break

    case 'final_transcript':
      const currentTranscript = globalAppState.sessionTranscript
      const newTranscript = currentTranscript
        ? currentTranscript + ' ' + message.text
        : message.text

      updateAppState({
        sessionTranscript: newTranscript,
        displayText: newTranscript,
        partialText: message.text,
        isFinal: true,
      })
      // Forward to all windows for real-time display
      ;[mainWindow, transcriptWindow, archiveWindow]
        .filter(w => w && !w.isDestroyed())
        .forEach(window => {
          try {
            if (window.webContents && !window.webContents.isDestroyed()) {
              window.webContents.send('backend-message', message)
            }
          } catch (error) {
            console.warn('Failed to send final_transcript to window:', error.message)
          }
        })
      break

    case 'backend_status':
      updateAppState({
        isRecording: message.is_recording,
        currentSessionId: message.current_session_id,
        audioSource: message.audio_source,
        sessionTranscript: message.current_transcript || '',
        displayText: message.current_transcript || '',
      })
      break

    case 'waveform_data':
      updateAppState({
        waveformData: message.data || new Array(20).fill(0),
      })
      break

    default:
      // For other messages (like sessions_list, etc.), still forward to individual windows
      // This maintains compatibility for non-state messages
      const windows = [mainWindow, transcriptWindow, archiveWindow].filter(
        w => w && !w.isDestroyed()
      )
      windows.forEach(window => {
        try {
          if (window.webContents && !window.webContents.isDestroyed()) {
            window.webContents.send('backend-message', message)
          }
        } catch (error) {
          console.warn('Failed to send message to window:', error.message)
        }
      })
  }
}

function startBackendProcess() {
  if (isDev) {
    console.log('Development mode: Backend process handled by npm script')
    return
  }

  const pythonDir = path.join(process.resourcesPath, 'python')
  const backendDir = path.join(pythonDir, 'backend')
  
  let pythonExecutable
  
  if (process.platform === 'win32') {
    pythonExecutable = path.join(pythonDir, 'venv', 'Scripts', 'python.exe')
  } else {
    pythonExecutable = path.join(pythonDir, 'venv', 'bin', 'python')
  }

  if (!fs.existsSync(pythonExecutable)) {
    console.error('❌ Bundled Python not found at:', pythonExecutable)
    console.error('Please run: npm run build:python')
    return
  }

  console.log('🐍 Starting bundled Python backend...')
  console.log('Python executable:', pythonExecutable)
  console.log('Backend directory:', backendDir)
  backendProcess = spawn(pythonExecutable, [path.join(backendDir, 'main.py')], {
    cwd: backendDir,
    detached: false,
    env: {
      ...process.env,
      PYTHONPATH: backendDir,
      PYTHONUNBUFFERED: '1'
    }
  })

  backendProcess.stdout.on('data', data => {
    console.log(`Backend stdout: ${data}`)
  })

  backendProcess.stderr.on('data', data => {
    console.error(`Backend stderr: ${data}`)
  })

  backendProcess.on('close', code => {
    console.log(`Backend process exited with code ${code}`)
  })

  backendProcess.on('error', error => {
    console.error('Failed to start backend process:', error)
  })
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  // Get saved position or default to center-top
  const savedBounds = store.get('windowBounds', {
    x: Math.round((width - 420) / 2),
    y: 80,
    width: 420,
    height: 48,
  })

  mainWindow = new BrowserWindow({
    ...savedBounds,
    minWidth: 320,
    maxWidth: 500,
    minHeight: 48,
    maxHeight: 48,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      backgroundThrottling: false,
    },
  })

  async function loadRenderer() {
    if (!app.isPackaged) {
      // Development mode: Load from Vite dev server
      const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
      console.log('Loading from Vite dev server:', devUrl)
      
      try {
        await mainWindow.loadURL(devUrl)
        console.log('✅ Loaded from Vite dev server')
        mainWindow.webContents.openDevTools()
      } catch (error) {
        console.error('Failed to load from Vite dev server:', error)
        // Fallback to local file in dev mode
        const htmlPath = path.resolve(__dirname, '../../index.html')
        console.log('Fallback: Loading HTML file in dev mode:', htmlPath)
        mainWindow.loadFile(htmlPath)
        mainWindow.webContents.openDevTools()
      }
    } else {
      // Production mode: Load from built renderer
      const htmlPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html')
      console.log('Loading HTML file in production:', htmlPath)
      mainWindow.loadFile(htmlPath)
    }
  }

  loadRenderer()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    setupWebSocketConnection()
    
    // Check for first run and open settings
    if (isFirstRun()) {
      console.log('First run detected, opening settings window')
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
          mainWindow.webContents.send('show-preferences-first-run')
        }
      }, 1000) // Delay to ensure main window is fully loaded
    }
  })

  // Save window bounds on move/resize
  mainWindow.on('moved', saveWindowBounds)
  mainWindow.on('resized', saveWindowBounds)

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function createTranscriptWindow() {
  // Close archive window if open (mutual exclusion)
  if (archiveWindow) {
    archiveWindow.close()
    archiveWindow = null
  }

  if (transcriptWindow && !transcriptWindow.isDestroyed()) {
    transcriptWindow.focus()
    return
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  transcriptWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: Math.round((width - 600) / 2),
    y: Math.round((height - 500) / 2),
    minWidth: 400,
    minHeight: 300,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      backgroundThrottling: false,
    },
  })

  // Load transcript window with hash routing
  const transcriptHash = 'transcript'
  try {
    if (!app.isPackaged) {
      // In development, load from Vite dev server with hash (with retry)
      const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
      const url = `${devUrl}#${transcriptHash}`
      console.log('Loading transcript from:', url)
      
      
      await transcriptWindow.loadURL(url)
    } else {
      // In production, load from built files with hash
      const indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html')
      console.log('Loading transcript from:', indexPath, 'with hash:', transcriptHash)
      await transcriptWindow.loadFile(indexPath, { hash: transcriptHash })
    }

    // Show window immediately after loading
    transcriptWindow.show()
  } catch (error) {
    console.error('Failed to load transcript window:', error)
    if (transcriptWindow) {
      transcriptWindow.close()
      transcriptWindow = null
    }
  }

  // Set up event handlers only if window was created successfully
  if (transcriptWindow) {
    // Send initial state to transcript window after a brief delay
    setTimeout(() => {
      try {
        if (transcriptWindow && !transcriptWindow.isDestroyed() && 
            transcriptWindow.webContents && !transcriptWindow.webContents.isDestroyed()) {
          transcriptWindow.webContents.send('app-state-changed', globalAppState)
        }
      } catch (error) {
        console.warn('Failed to send initial state to transcript window:', error.message)
      }
    }, 50) // Reduced delay for faster response

    transcriptWindow.on('closed', () => {
      // Notify main window that transcript window was closed
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        try {
          mainWindow.webContents.send('transcript-window-closed')
        } catch (error) {
          console.warn('Failed to send transcript-window-closed event:', error.message)
        }
      }
      transcriptWindow = null
    })

    transcriptWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  }
}

async function createArchiveWindow() {
  // Close transcript window if open (mutual exclusion)
  if (transcriptWindow) {
    transcriptWindow.close()
    transcriptWindow = null
  }

  if (archiveWindow && !archiveWindow.isDestroyed()) {
    archiveWindow.focus()
    return
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  archiveWindow = new BrowserWindow({
    width: 700,
    height: 600,
    x: Math.round((width - 700) / 2),
    y: Math.round((height - 600) / 2),
    minWidth: 500,
    minHeight: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      backgroundThrottling: false,
    },
  })

  // Load archive window with hash routing
  const archiveHash = 'archive'
  try {
    if (!app.isPackaged) {
      // In development, load from Vite dev server with hash (with retry)
      const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
      const url = `${devUrl}#${archiveHash}`
      console.log('Loading archive from:', url)
      
      
      await archiveWindow.loadURL(url)
    } else {
      // In production, load from built files with hash
      const indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html')
      console.log('Loading archive from:', indexPath, 'with hash:', archiveHash)
      await archiveWindow.loadFile(indexPath, { hash: archiveHash })
    }

    // Show window immediately after loading
    archiveWindow.show()
  } catch (error) {
    console.error('Failed to load archive window:', error)
    if (archiveWindow) {
      archiveWindow.close()
      archiveWindow = null
    }
  }

  // Set up event handlers only if window was created successfully
  if (archiveWindow) {
    archiveWindow.on('closed', () => {
      // Notify main window that archive window was closed
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        try {
          mainWindow.webContents.send('archive-window-closed')
        } catch (error) {
          console.warn('Failed to send archive-window-closed event:', error.message)
        }
      }
      archiveWindow = null
    })

    archiveWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  }
}

async function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus()
    return
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    x: Math.round((width - 600) / 2),
    y: Math.round((height - 500) / 2),
    minWidth: 500,
    minHeight: 400,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js'),
      backgroundThrottling: false,
    },
  })

  // Load settings window with hash routing
  const settingsHash = 'settings'
  try {
    if (!app.isPackaged) {
      // In development, load from Vite dev server with hash (with retry)
      const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173'
      const url = `${devUrl}#${settingsHash}`
      console.log('Loading settings from:', url)
      
      
      await settingsWindow.loadURL(url)
    } else {
      // In production, load from built files with hash
      const indexPath = path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html')
      console.log('Loading settings from:', indexPath, 'with hash:', settingsHash)
      await settingsWindow.loadFile(indexPath, { hash: settingsHash })
    }

    // Show window immediately after loading
    settingsWindow.show()
  } catch (error) {
    console.error('Failed to load settings window:', error)
    if (settingsWindow) {
      settingsWindow.close()
      settingsWindow = null
    }
  }

  // Set up event handlers only if window was created successfully
  if (settingsWindow) {
    settingsWindow.on('closed', () => {
      // Notify main window that settings window was closed
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
        try {
          mainWindow.webContents.send('settings-window-closed')
        } catch (error) {
          console.warn('Failed to send settings-window-closed event:', error.message)
        }
      }
      settingsWindow = null
    })

    settingsWindow.webContents.setWindowOpenHandler(({ url }) => {
      if (url.startsWith('https:') || url.startsWith('http:')) {
        shell.openExternal(url)
      }
      return { action: 'deny' }
    })
  }
}


function saveWindowBounds() {
  if (mainWindow) {
    store.set('windowBounds', mainWindow.getBounds())
  }
}

function setupWebSocketConnection() {
  // Connect to backend WebSocket
  wsConnection = new WebSocket('ws://127.0.0.1:8888/ws')

  wsConnection.on('open', () => {
    console.log('✅ Connected to backend WebSocket at ws://127.0.0.1:8888/ws')
    // Update global state instead of sending individual messages
    updateAppState({ isConnected: true })
    
    // Send current settings to backend on connection
    try {
      wsConnection.send(JSON.stringify({
        type: 'update_settings',
        settings: {
          transcriptionModel: globalSettings.transcriptionModel,
          language: globalSettings.language,
        }
      }))
      console.log(`📤 Sent settings to backend: model=${globalSettings.transcriptionModel}, language=${globalSettings.language}`)
    } catch (error) {
      console.error('Failed to send settings to backend:', error)
    }
  })

  wsConnection.on('message', data => {
    const message = JSON.parse(data.toString())

    // Update global state based on backend messages
    handleBackendMessage(message)
  })

  wsConnection.on('error', error => {
    console.error('❌ WebSocket error:', error)
    console.log('Is backend running? Run: cd backend && python main.py')
    updateAppState({ isConnected: false })
  })

  wsConnection.on('close', () => {
    console.log('WebSocket connection closed')
    updateAppState({ isConnected: false })
    // Attempt to reconnect after 3 seconds
    setTimeout(setupWebSocketConnection, 3000)
  })
}

function createTray() {
  try {
    // Try multiple possible paths for the tray icon
    const possiblePaths = [
      path.join(__dirname, '../renderer/assets/tray-icon.png'),
      path.join(__dirname, '../../src/assets/tray-icon.png'),
      path.join(__dirname, '../src/assets/tray-icon.png'),
      path.join(process.cwd(), 'src/assets/tray-icon.png'),
    ]

    let iconPath = null
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        iconPath = testPath
        console.log('✅ Found tray icon at:', iconPath)
        break
      }
    }

    if (!iconPath) {
      console.log('⚠️ Tray icon not found in any expected location')
      console.log('Searched paths:', possiblePaths)
      console.log('ℹ️ Skipping tray creation')
      return
    }

    tray = new Tray(iconPath)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show EchoTap',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
          }
        },
      },
      {
        label: 'Start Recording',
        click: () => {
          if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.send(JSON.stringify({ type: 'start_recording' }))
          }
        },
      },
      {
        label: 'Stop Recording',
        click: () => {
          if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
            wsConnection.send(JSON.stringify({ type: 'stop_recording' }))
          }
        },
      },
      { type: 'separator' },
      {
        label: 'Preferences',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents && !mainWindow.webContents.isDestroyed()) {
            try {
              mainWindow.webContents.send('show-preferences')
            } catch (error) {
              console.warn('Failed to send preferences message:', error.message)
            }
          }
        },
      },
      {
        label: 'Quit EchoTap',
        click: () => {
          app.quit()
        },
      },
    ])

    tray.setContextMenu(contextMenu)
    tray.setToolTip('EchoTap - Local Transcription')

    console.log('✅ System tray created successfully')
  } catch (error) {
    console.error('❌ Failed to create system tray:', error.message)
    console.log('ℹ️ App will continue without system tray')
  }
}

function registerGlobalShortcuts() {
  // Default shortcuts
  const shortcuts = store.get('shortcuts', {
    toggleRecording: 'CommandOrControl+Shift+R',  // More intuitive shortcut for toggle recording
  })

  try {
    // Register toggle recording shortcut
    if (shortcuts.toggleRecording) {
      const registered = globalShortcut.register(shortcuts.toggleRecording, () => {
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          // Send to backend
          wsConnection.send(JSON.stringify({ type: 'toggle_recording' }))
          
          // Immediately update main window status for better UX
          if (mainWindow && !mainWindow.isDestroyed()) {
            const currentState = globalAppState
            const newRecordingState = !currentState.isRecording
            
            updateAppState({
              isRecording: newRecordingState,
              elapsedTime: newRecordingState ? 0 : currentState.elapsedTime
            })
            
            // Send immediate update to main window
            try {
              mainWindow.webContents.send('app-state-changed', globalAppState)
            } catch (error) {
              console.warn('Failed to send immediate state update to main window:', error.message)
            }
          }
        }
      })
      
      if (registered) {
        console.log(`✅ Global shortcut registered: ${shortcuts.toggleRecording} for toggle recording`)
      } else {
        console.warn(`⚠️ Failed to register shortcut ${shortcuts.toggleRecording} (may be in use by another app)`)
      }
    }
  } catch (error) {
    console.error('Failed to register global shortcuts:', error)
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow()
  createTray()
  registerGlobalShortcuts()
  startBackendProcess()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await cleanupBackend()
    app.quit()
  }
})

// Robust cleanup function
async function cleanupBackend() {
  console.log('🧹 Starting cleanup process...')

  try {
    // Close WebSocket connection first with timeout
    if (wsConnection) {
      console.log('📡 Closing WebSocket connection...')
      try {
        wsConnection.close()
        // Wait briefly for connection to close properly
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.log('⚠️ WebSocket close error:', error.message)
      }
      wsConnection = null
    }

    // Kill backend process if we spawned it
    if (backendProcess && !isDev) {
      console.log('🛑 Terminating backend process...')

      try {
        // Try graceful shutdown first
        if (!backendProcess.killed) {
          backendProcess.kill('SIGTERM')
          console.log('📡 Sent SIGTERM, waiting for graceful shutdown...')
        }

        // Wait for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Force kill if still running
        if (!backendProcess.killed) {
          console.log('💥 Force killing backend process...')
          backendProcess.kill('SIGKILL')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.log('⚠️ Error killing backend process:', error.message)
      }

      backendProcess = null
    }

    // Kill any remaining Python processes (Windows/WSL compatible)
    console.log('🔍 Cleaning up any remaining Python processes...')
    const { spawn } = await import('child_process')

    const cleanupPromises = []

    try {
      if (process.platform === 'win32') {
        // Windows - kill all python.exe processes
        cleanupPromises.push(
          new Promise(resolve => {
            const proc = spawn('taskkill', ['/f', '/im', 'python.exe'], {
              stdio: 'ignore',
              timeout: 5000,
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )

        // Also try to kill specific main.py processes
        cleanupPromises.push(
          new Promise(resolve => {
            const proc = spawn(
              'wmic',
              ['process', 'where', 'CommandLine like "%main.py%"', 'delete'],
              {
                stdio: 'ignore',
                timeout: 5000,
              }
            )
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )
      } else {
        // WSL/Linux - kill python processes by name and command line
        cleanupPromises.push(
          new Promise(resolve => {
            const proc = spawn('pkill', ['-f', 'main.py'], {
              stdio: 'ignore',
              timeout: 5000,
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )

        cleanupPromises.push(
          new Promise(resolve => {
            const proc = spawn('pkill', ['-f', 'python.*main'], {
              stdio: 'ignore',
              timeout: 5000,
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )
      }

      // Wait for all cleanup processes to complete (with timeout)
      await Promise.race([
        Promise.all(cleanupPromises),
        new Promise(resolve => setTimeout(resolve, 8000)), // 8 second max timeout
      ])
    } catch (error) {
      console.log('⚠️ Could not cleanup background processes:', error.message)
    }

    // Final verification - check if any processes are still running
    try {
      console.log('🔍 Final verification of process cleanup...')
      if (process.platform === 'win32') {
        const proc = spawn('tasklist', ['/fi', 'ImageName eq python.exe'], {
          stdio: 'pipe',
          timeout: 3000,
        })
        let output = ''
        proc.stdout.on('data', data => (output += data.toString()))
        await new Promise(resolve => proc.on('close', resolve))

        if (output.includes('python.exe')) {
          console.log('⚠️ Some python processes may still be running')
        } else {
          console.log('✅ No python.exe processes detected')
        }
      }
    } catch (error) {
      console.log('⚠️ Could not verify process cleanup:', error.message)
    }

    console.log('✅ Comprehensive cleanup completed')
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    // Even if cleanup fails, we should continue with app termination
  }
}


// Enhanced cleanup with multiple exit handlers
let isQuitting = false

app.on('before-quit', async event => {
  if (isQuitting) return

  // Prevent immediate quit to allow cleanup
  event.preventDefault()
  isQuitting = true

  console.log('🔄 App shutting down, starting cleanup...')

  // Update main window status to "Closing..."
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      updateAppState({ status: 'Closing...' })
      mainWindow.webContents.send('app-state-changed', globalAppState)
    } catch (error) {
      console.warn('Failed to update closing status:', error.message)
    }
  }

  // Clean up
  globalShortcut.unregisterAll()

  // Run comprehensive cleanup
  await cleanupBackend()

  console.log('✅ Cleanup completed, exiting app')

  // Now actually quit
  app.exit(0)
})

// Handle window close events
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin' && !isQuitting) {
    isQuitting = true
    await cleanupBackend()
    app.quit()
  }
})

// Handle process signals for robust cleanup
process.on('SIGINT', async () => {
  console.log('📡 Received SIGINT, cleaning up...')
  if (!isQuitting) {
    isQuitting = true
    await cleanupBackend()
    process.exit(0)
  }
})

process.on('SIGTERM', async () => {
  console.log('📡 Received SIGTERM, cleaning up...')
  if (!isQuitting) {
    isQuitting = true
    await cleanupBackend()
    process.exit(0)
  }
})

// Handle unexpected exits
process.on('uncaughtException', async error => {
  console.error('💥 Uncaught exception:', error)
  if (!isQuitting) {
    isQuitting = true
    await cleanupBackend()
    process.exit(1)
  }
})

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled rejection at:', promise, 'reason:', reason)
  if (!isQuitting) {
    isQuitting = true
    await cleanupBackend()
    process.exit(1)
  }
})

// IPC handlers
ipcMain.handle('get-store-value', (event, key) => {
  return store.get(key)
})

ipcMain.handle('set-store-value', (event, key, value) => {
  store.set(key, value)
})

ipcMain.handle('send-to-backend', (event, message) => {
  try {
    if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
      wsConnection.send(JSON.stringify(message))
      return { success: true }
    } else {
      console.warn('WebSocket not connected, message not sent:', message.type)
      return { success: false, error: 'WebSocket not connected' }
    }
  } catch (error) {
    console.error('Error sending message to backend:', error)
    return { success: false, error: error.message }
  }
})

// Global App State IPC Handlers
ipcMain.handle('get-app-state', () => {
  return globalAppState
})

ipcMain.handle('update-app-state', (event, updates) => {
  updateAppState(updates)
  return globalAppState
})

ipcMain.handle('get-state-property', (event, property) => {
  return globalAppState[property]
})

ipcMain.handle('set-state-property', (event, property, value) => {
  updateAppState({ [property]: value })
  return globalAppState[property]
})

ipcMain.handle('minimize-window', () => {
  if (mainWindow) {
    mainWindow.hide()
  }
})

ipcMain.handle('close-window', async () => {
  if (!isQuitting) {
    isQuitting = true
    await cleanupBackend()
    app.quit()
  }
})

ipcMain.handle('show-transcript', async () => {
  await createTranscriptWindow()
})

ipcMain.handle('show-archive', async () => {
  await createArchiveWindow()
})

ipcMain.handle('show-settings', async () => {
  await createSettingsWindow()
})

ipcMain.handle('close-transcript', () => {
  if (transcriptWindow) {
    transcriptWindow.close()
  }
})

ipcMain.handle('close-archive', () => {
  if (archiveWindow) {
    archiveWindow.close()
  }
})

ipcMain.handle('close-settings', () => {
  if (settingsWindow) {
    settingsWindow.close()
  }
})

// Settings IPC handlers
ipcMain.handle('get-settings', () => {
  return globalSettings
})

ipcMain.handle('save-settings', (event, settings) => {
  try {
    globalSettings = { ...globalSettings, ...settings }
    const success = saveSettings(globalSettings)
    if (success) {
      // Apply theme changes immediately
      updateAppTheme(settings.theme)
      
      // Re-register global shortcuts if shortcuts were changed
      const shortcuts = store.get('shortcuts')
      if (shortcuts) {
        globalShortcut.unregisterAll()
        registerGlobalShortcuts()
        console.log('🔄 Global shortcuts re-registered')
      }
      
      return { success: true }
    } else {
      return { success: false, error: 'Failed to save settings to file' }
    }
  } catch (error) {
    console.error('Error saving settings:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('apply-theme', (event, theme) => {
  try {
    updateAppTheme(theme)
    return { success: true }
  } catch (error) {
    console.error('Error applying theme:', error)
    return { success: false, error: error.message }
  }
})
