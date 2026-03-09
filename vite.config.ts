import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: 'localhost',
    port: 5500,
    strictPort: false,
    open: true,
    force: true, // 强制预构建依赖
    hmr: true, // 启用热模块替换
  },
  optimizeDeps: {
    force: true, // 强制重新预构建依赖
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
    open: true,
  },
})
