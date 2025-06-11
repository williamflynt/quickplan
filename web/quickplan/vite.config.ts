import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../internal/server/web',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        viewer: path.resolve(__dirname, 'reactflow_viewer.html'),
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [importMetaUrlPlugin],
    },
  },
  server: {
    cors: true,
    fs: {
      allow: [
        '../../submodules',
        'src',
        'node_modules/antd',
        'node_modules/@xyflow',
      ],
    },
  },
})
