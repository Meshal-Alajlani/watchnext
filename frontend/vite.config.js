import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /watchnext/, so production builds use that path.
  // The dev server stays at the root (http://localhost:5173/). VITE_BASE_PATH can override it.
  base: process.env.VITE_BASE_PATH || (command === 'build' ? '/watchnext/' : '/'),
}))
