import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: { port: 5200, strictPort: true, host: true },
  preview: { port: 4200, strictPort: true, host: true },
  plugins: [react(), tailwindcss()],
})
