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
        viewer: path.resolve(__dirname, 'index-reactflow.html'),
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
        // Allow access to the entire workspace.
        path.resolve(__dirname, '../..'),
        // Explicitly allow node_modules at root.
        path.resolve(__dirname, '../../node_modules'),
        // Allow local node_modules.
        path.resolve(__dirname, './node_modules'),
      ],
    },
  },
  resolve: {
    alias: {
      '@quickplan/web': path.resolve(__dirname, './src'),
      '@quickplan': path.resolve(__dirname, '../'),
    },
  },
})
