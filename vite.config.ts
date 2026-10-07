import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { PAGE_META } from './src/pageMeta.ts'
import { withPageMeta } from './src/headMeta.ts'

// Bakes each route's title, description and canonical URL into real HTML, so
// crawlers and link previews see them without running JavaScript:
//   dist/index.html         home
//   dist/resume.html        /resume (vercel.json rewrites /resume to it)
//   dist/skills.html        /skills (likewise)
function pageMetaHtml(): Plugin {
  let outDir = 'dist'
  let isBuild = false
  return {
    name: 'page-meta-html',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
      isBuild = config.command === 'build'
    },
    transformIndexHtml(html) {
      return withPageMeta(html, PAGE_META.home)
    },
    closeBundle() {
      if (!isBuild) return
      const home = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      writeFileSync(resolve(outDir, 'resume.html'), withPageMeta(home, PAGE_META.resume))
      writeFileSync(resolve(outDir, 'skills.html'), withPageMeta(home, PAGE_META.skills))
    },
  }
}

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
      // Same shell, but it must not claim the home page as its canonical URL
      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      const notFound = html.replace(/<link rel="canonical" href="[^"]*" \/>/, '<meta name="robots" content="noindex" />')
      if (notFound === html) throw new Error('spa-404-page: canonical tag not found in index.html')
      writeFileSync(resolve(outDir, '404.html'), notFound)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pageMetaHtml(), spaNotFoundPage()],
})
