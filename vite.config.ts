import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El catálogo es un JSON grande: como cadena + JSON.parse se carga bastante más rápido.
  json: { stringify: true },
})
