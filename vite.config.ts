import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',  // 使用相对路径，兼容 GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
