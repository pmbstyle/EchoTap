import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'
import { spawn } from 'child_process'

let backendProcess: any = null

export default defineConfig({
  plugins: [
    vue(), 
    tailwindcss(),
      electron({
        main: {
          entry: 'src/main/main.js',
          onstart({ startup }) {
            console.log('[Vite] Starting Electron main process...')
            // Set the renderer URL for the main process
            process.env.ELECTRON_RENDERER_URL = 'http://localhost:5173'
            setTimeout(() => {
              startup()
            }, 100)
          },
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'ws', 'bufferutil'],
              output: {
                entryFileNames: 'index.js'
              }
            }
          }
        }
      },
      preload: {
        input: 'src/main/preload.js',
        vite: {
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: 'preload.js'
              }
            }
          }
        }
      },
      renderer: {}
    }),
    // Custom plugin to start backend
    {
      name: 'start-backend',
      configureServer(server) {
        // Start backend when Vite starts
        if (!backendProcess) {
          console.log('[Vite] Starting Python backend...')
          backendProcess = spawn('python', ['-m', 'uvicorn', 'main:app', '--reload', '--port', '8888'], {
            cwd: 'backend',
            stdio: 'pipe'
          })
          
          backendProcess?.stdout?.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`)
          })
          
          backendProcess?.stderr?.on('data', (data) => {
            console.log(`[Backend] ${data.toString().trim()}`)
          })
          
          backendProcess?.on('close', (code) => {
            console.log(`[Backend] Process exited with code ${code}`)
            backendProcess = null
          })
        }
      }
    }
  ],
  base: './',
  build: {
    outDir: 'dist/renderer'
  },
  server: {
    port: 5173
  }
})
