import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves the site from /<repo>/, so the build sets VITE_BASE_PATH=/watchnext/.
  // Locally it stays at the root (http://localhost:5173/).
  base: process.env.VITE_BASE_PATH || '/',
})
