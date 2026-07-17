import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/my-garden',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      '/my-garden/api': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/my-garden/, ''),
      },
      '/my-garden/uploads': {
        target: 'http://localhost:8080',
        rewrite: (path) => path.replace(/^\/my-garden/, ''),
      },
    },
  },
})
