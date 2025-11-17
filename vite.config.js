import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/easy-guitar-tabs/'  // This adds the repo name as base path for GitHub Pages
})