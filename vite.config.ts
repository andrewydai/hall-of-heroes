import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    // Proxy /api calls to the Wrangler dev server so you can use `npm run dev`
    // on its own for UI work. For the full stack (with real D1), use
    // `npm run dev:api` in a second terminal and visit localhost:8788 instead.
    proxy: {
      '/api': 'http://localhost:8788',
    },
  },
})
