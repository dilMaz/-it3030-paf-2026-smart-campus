import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { exec } from 'node:child_process'
import process from 'node:process'

function openGoogleChrome() {
  let opened = false

  return {
    name: 'open-google-chrome',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        if (opened) return
        opened = true

        const address = server.httpServer?.address()
        const port = typeof address === 'object' && address ? address.port : 5173
        const url = `http://localhost:${port}`

        if (process.platform === 'win32') {
          exec(`start "" "${url}"`)
          return
        }

        if (process.platform === 'darwin') {
          exec(`open -a "Google Chrome" "${url}"`)
          return
        }

        exec(`google-chrome "${url}" || chromium "${url}"`)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    strictPort: false,
  },
  plugins: [react(), openGoogleChrome()],
})
