import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
          'ui-vendor': ['react-hot-toast', 'react-icons'],
          'axios-vendor': ['axios'],
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom',
      '@reduxjs/toolkit', 'react-redux',
      'axios', 'react-hot-toast',
    ]
  }
})
