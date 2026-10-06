import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel serves dist/404.html, with a real 404 status, for paths that match no
// file or rewrite. Shipping the SPA shell there lets React render the 404 page.
function spaNotFoundPage(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-404-page',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), spaNotFoundPage()],
})
