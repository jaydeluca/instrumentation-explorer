import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/instrumentation-explorer/',
  plugins: [react()],
  server: {
    // The 'base' property is not valid here. It should be a top-level property.
  },
})
