import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/react-router-dom/')) {
            return 'react-vendor'
          }

          if (id.includes('/@firebase/firestore') || id.includes('/firebase/firestore/')) {
            return 'firebase-firestore'
          }

          if (id.includes('/@firebase/auth') || id.includes('/firebase/auth/')) {
            return 'firebase-auth'
          }

          if (id.includes('/@firebase/storage') || id.includes('/firebase/storage/')) {
            return 'firebase-storage'
          }

          if (id.includes('/@firebase/functions') || id.includes('/firebase/functions/')) {
            return 'firebase-functions'
          }

          if (
            id.includes('/@firebase/app') ||
            id.includes('/@firebase/component') ||
            id.includes('/@firebase/logger') ||
            id.includes('/firebase/app/')
          ) {
            return 'firebase-app'
          }

          if (id.includes('/firebase/') || id.includes('/@firebase/')) {
            return 'firebase'
          }

          if (id.includes('/i18next/') || id.includes('/react-i18next/')) {
            return 'i18n'
          }

          if (
            id.includes('/@reduxjs/') ||
            id.includes('/react-redux/') ||
            id.includes('/redux/') ||
            id.includes('/immer/')
          ) {
            return 'state'
          }

          if (id.includes('/lucide-react/') || id.includes('/@daypicker/')) {
            return 'ui-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
