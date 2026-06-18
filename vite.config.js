import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 1. Import this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 2. Add this to plugins
  ],
  server: {
    proxy: {
      '/api/upload': {
        target: 'https://respira-care-dashboard.vercel.app',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'https://api.husnoorinfotech.in',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})