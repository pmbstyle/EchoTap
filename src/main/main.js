import { app, BrowserWindow, ipcMain, globalShortcut, Menu, Tray, screen } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { spawn } from 'child_process'
import WebSocket from 'ws'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const store = new Store()

// Keep references to prevent garbage collection
let mainWindow
let transcriptWindow
let archiveWindow
let tray
let backendProcess
let wsConnection

const isDev = !app.isPackaged

// Backend process management
function startBackendProcess() {
  // Skip backend process in development - it's already running via npm script
  if (isDev) {
    console.log('Development mode: Backend process handled by npm script')
    return
  }
  
  const pythonPath = path.join(process.resourcesPath, 'backend', 'main.py')
  const args = []
  
  backendProcess = spawn(pythonPath, args, {
    cwd: isDev ? path.join(__dirname, '../../backend') : path.join(process.resourcesPath, 'backend'),
    detached: false
  })

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend stdout: ${data}`)
  })

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend stderr: ${data}`)
  })

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`)
  })
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  
  // Get saved position or default to center-top  
  const savedBounds = store.get('windowBounds', {
    x: Math.round((width - 420) / 2),
    y: 80,
    width: 420,
    height: 48
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
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  })

  async function loadRenderer() {
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      // Development: Load from Vite dev server with retry logic
      console.log('Attempting to load from Vite dev server:', process.env.ELECTRON_RENDERER_URL)
      
      let attempts = 0
      const maxAttempts = 10
      
      while (attempts < maxAttempts) {
        try {
          await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
          console.log('Successfully loaded from Vite dev server')
          mainWindow.webContents.openDevTools()
          return
        } catch (error) {
          attempts++
          console.log(`Attempt ${attempts}/${maxAttempts} failed, retrying in 1 second...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      console.log('Failed to load from Vite dev server, falling back to file')
      // Fallback to file loading
    }
    
    if (!app.isPackaged) {
      // Development fallback: Load local HTML file
      const htmlPath = path.resolve(__dirname, '../../index.html')
      console.log('Loading HTML file in dev mode:', htmlPath)
      console.log('Path exists:', fs.existsSync(htmlPath))
      mainWindow.loadFile(htmlPath)
      mainWindow.webContents.openDevTools()
    } else {
      // Production: Load from built renderer
      const htmlPath = path.join(__dirname, '../renderer/index.html')
      console.log('Loading HTML file in production:', htmlPath)
      mainWindow.loadFile(htmlPath)
    }
  }
  
  loadRenderer()

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    setupWebSocketConnection()
  })

  // Save window bounds on move/resize
  mainWindow.on('moved', saveWindowBounds)
  mainWindow.on('resized', saveWindowBounds)

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTranscriptWindow() {
  // Close archive window if open (mutual exclusion)
  if (archiveWindow) {
    archiveWindow.close()
    archiveWindow = null
  }

  if (transcriptWindow) {
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
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  })

  // Load dedicated transcript window content
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    // In development, use query param to show transcript mode
    const transcriptUrl = `${process.env.ELECTRON_RENDERER_URL}?mode=transcript`
    console.log('Loading transcript URL:', transcriptUrl)
    transcriptWindow.loadURL(transcriptUrl)
  } else {
    // In production, load the transcript.html file
    const transcriptPath = path.join(__dirname, '../transcript.html')
    console.log('Loading transcript from:', transcriptPath)
    transcriptWindow.loadFile(transcriptPath)
  }

  transcriptWindow.once('ready-to-show', () => {
    transcriptWindow.show()
  })

  transcriptWindow.on('closed', () => {
    transcriptWindow = null
  })
}

function createArchiveWindow() {
  // Close transcript window if open (mutual exclusion)
  if (transcriptWindow) {
    transcriptWindow.close()
    transcriptWindow = null
  }

  if (archiveWindow) {
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
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false
    }
  })

  // Load dedicated archive window content
  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    // In development, use query param to show archive mode
    const archiveUrl = `${process.env.ELECTRON_RENDERER_URL}?mode=archive`
    console.log('Loading archive URL:', archiveUrl)
    archiveWindow.loadURL(archiveUrl)
  } else {
    // In production, load the archive.html file
    const archivePath = path.join(__dirname, '../archive.html')
    console.log('Loading archive from:', archivePath)
    archiveWindow.loadFile(archivePath)
  }

  archiveWindow.once('ready-to-show', () => {
    archiveWindow.show()
  })

  archiveWindow.on('closed', () => {
    archiveWindow = null
  })
}

// Forward messages to archive window
function forwardMessageToArchive(message) {
  if (archiveWindow) {
    archiveWindow.webContents.send('backend-message', message)
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
    // Send initial status message to both windows
    if (mainWindow) {
      mainWindow.webContents.send('backend-message', { 
        type: 'connection_status', 
        connected: true 
      })
    }
    if (transcriptWindow) {
      transcriptWindow.webContents.send('backend-message', { 
        type: 'connection_status', 
        connected: true 
      })
    }
  })

  wsConnection.on('message', (data) => {
    const message = JSON.parse(data.toString())
    // Forward messages to main window
    if (mainWindow) {
      mainWindow.webContents.send('backend-message', message)
    }
    // Also forward to transcript window if open
    if (transcriptWindow) {
      transcriptWindow.webContents.send('backend-message', message)
    }
    // Also forward to archive window if open
    if (archiveWindow) {
      forwardMessageToArchive(message)
    }
  })

  wsConnection.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
    console.log('Is backend running? Run: cd backend && python main.py')
  })

  wsConnection.on('close', () => {
    console.log('WebSocket connection closed')
    // Attempt to reconnect after 3 seconds
    setTimeout(setupWebSocketConnection, 3000)
  })
}

function createTray() {
  try {
    // Try multiple possible paths for the tray icon
    const possiblePaths = [
      path.join(__dirname, '../assets/tray-icon.png'),
      path.join(__dirname, '../../assets/tray-icon.png'), 
      path.join(__dirname, '../src/assets/tray-icon.png'),
      path.join(process.cwd(), 'src/assets/tray-icon.png')
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
      }
    },
    {
      label: 'Start Recording',
      click: () => {
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(JSON.stringify({ type: 'start_recording' }))
        }
      }
    },
    {
      label: 'Stop Recording', 
      click: () => {
        if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
          wsConnection.send(JSON.stringify({ type: 'stop_recording' }))
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Preferences',
      click: () => {
        if (mainWindow) {
          mainWindow.webContents.send('show-preferences')
        }
      }
    },
    {
      label: 'Quit EchoTap',
      click: () => {
        app.quit()
      }
    }
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
    startStop: 'Alt+Shift+S',
    copy: 'Alt+Shift+C',
    toggleOverlay: 'Alt+Shift+O'
  })

  try {
    globalShortcut.register(shortcuts.startStop, () => {
      if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
        wsConnection.send(JSON.stringify({ type: 'toggle_recording' }))
      }
    })

    globalShortcut.register(shortcuts.copy, () => {
      if (mainWindow) {
        mainWindow.webContents.send('copy-transcript')
      }
    })

    globalShortcut.register(shortcuts.toggleOverlay, () => {
      if (mainWindow) {
        mainWindow.webContents.send('toggle-overlay')
      }
    })
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
          new Promise((resolve) => {
            const proc = spawn('taskkill', ['/f', '/im', 'python.exe'], { 
              stdio: 'ignore',
              timeout: 5000
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )
        
        // Also try to kill specific main.py processes
        cleanupPromises.push(
          new Promise((resolve) => {
            const proc = spawn('wmic', [
              'process', 'where', 
              'CommandLine like "%main.py%"', 
              'delete'
            ], { 
              stdio: 'ignore',
              timeout: 5000
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )
      } else {
        // WSL/Linux - kill python processes by name and command line
        cleanupPromises.push(
          new Promise((resolve) => {
            const proc = spawn('pkill', ['-f', 'main.py'], { 
              stdio: 'ignore',
              timeout: 5000
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )
        
        cleanupPromises.push(
          new Promise((resolve) => {
            const proc = spawn('pkill', ['-f', 'python.*main'], { 
              stdio: 'ignore',
              timeout: 5000
            })
            proc.on('close', resolve)
            proc.on('error', resolve)
          })
        )
      }
      
      // Wait for all cleanup processes to complete (with timeout)
      await Promise.race([
        Promise.all(cleanupPromises),
        new Promise(resolve => setTimeout(resolve, 8000)) // 8 second max timeout
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
          timeout: 3000
        })
        let output = ''
        proc.stdout.on('data', (data) => output += data.toString())
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

app.on('before-quit', async (event) => {
  if (isQuitting) return
  
  // Prevent immediate quit to allow cleanup
  event.preventDefault()
  isQuitting = true
  
  console.log('🔄 App shutting down, starting cleanup...')
  
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
process.on('uncaughtException', async (error) => {
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
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify(message))
  }
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

ipcMain.handle('show-transcript', () => {
  createTranscriptWindow()
})

ipcMain.handle('show-archive', () => {
  createArchiveWindow()
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

