import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        popover: resolve(__dirname, 'popover.html'),
      },
    },
  },
})
