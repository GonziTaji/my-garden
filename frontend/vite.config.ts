import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { join, resolve } from 'node:path'
import { readdirSync } from 'node:fs'


const PAGE_FILE_NAME = "index.html"
const PAGES_DIR = "src/pages"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    manifest: true,
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, "src/pages/index.html"),
        ...getPagesFromDir()
      },
    },
  }
})

function getPagesFromDir() {
  const pages: [string, string][] = []
  const pagesDir = resolve(import.meta.dirname, PAGES_DIR)

  const files = readdirSync(pagesDir, {
    withFileTypes: true,
    recursive: true,
  });

  for (const file of files) {
    if (file.isDirectory()) continue
    if (file.name !== PAGE_FILE_NAME) continue

    let pageName: string = file.parentPath.replace(pagesDir, '')
    if (pageName.length > 0) {
      pageName = pageName.replace("/", "")
    }

    console.log("PARENT PATH:", file.parentPath)
    console.log("PAGE NAME:", pageName)

    const pageFilePath = join(file.parentPath, PAGE_FILE_NAME)

    pages.push([pageName, pageFilePath])
  }

  console.log(pages)

  return Object.fromEntries(pages)
}
