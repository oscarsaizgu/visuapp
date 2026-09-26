import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Versión distribuible (scripts/build-distribuible.mjs): usa el contenido generado en
// .distribuible/ (solo fotos con licencia verificada) y no copia public/img entero.
const distribuible = process.env.VISU_DISTRIBUIBLE === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El catálogo es un JSON grande: como cadena + JSON.parse se carga bastante más rápido.
  json: { stringify: true },
  ...(distribuible && {
    resolve: {
      alias: [{ find: /^.*\/generated\/([\w-]+\.json)$/, replacement: path.resolve(__dirname, '.distribuible/generated/$1') }],
    },
    publicDir: false,
    build: { outDir: 'dist-distribuible', emptyOutDir: true },
  }),
})
