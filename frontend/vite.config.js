import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'diligent-friendship-production.up.railway.app',
      '.railway.app'
    ]
  }
})
