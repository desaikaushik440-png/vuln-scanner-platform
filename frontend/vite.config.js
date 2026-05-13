import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['all'],
    host: true,
    port: 5173
  },
  preview: {
    allowedHosts: ['all'],
    host: true,
    port: 4173
  }
})
