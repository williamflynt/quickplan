import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../../internal/server/web"
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        importMetaUrlPlugin
      ]
    }
  },
  server: {
    fs: { allow: ["../../submodules", "src", "node_modules/antd", "node_modules/@xyflow"] }
  },
})
