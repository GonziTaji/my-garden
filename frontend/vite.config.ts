import { createLogger, defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { join, resolve } from 'node:path'
import { readdirSync } from 'node:fs'

const PAGE_FILE_NAME = "index.html"
const PAGES_DIR = process.env.APP_VITE_PAGES_DIR || "src/pages"

const logger = createLogger("info", { console, prefix: "[MY_GARDEN_BUILD]" })

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  build: {
    // manifest will include only files that imports a module or an asset.
    // i.e., an index.html file inside src/pages/ that is pure html will not be added 
    // to the manifest budnle. If this creates friction, make a script to create a pages
    // manifest and use make to build with postbuild scripts (simplest way imo)
    manifest: true,
    rolldownOptions: {
      input: getInputPages(),
    },
  }
})

function getInputPages() {
  // logger.info(`pages dir: ${PAGES_DIR}`)
  const inputPagesArr = getPagesFromDir(PAGES_DIR)

  const inputPages = Object.fromEntries(inputPagesArr)

  logger.info(`input pages: \n${JSON.stringify(inputPages, null, 2)}`)

  return inputPages
}

function getPagesFromDir(dirpath: string) {
  // logger.info("--------------")
  // logger.info("scanning " + dirpath)
  const pages: [string, string][] = []
  const pagesDir = resolve(import.meta.dirname, dirpath)

  const dirEntries = readdirSync(pagesDir, {
    withFileTypes: true,
    recursive: true,
  });

  for (const dirEntry of dirEntries) {
    // logger.info(`> got dir entry: ${dirEntry.name}`)

    if (dirEntry.isDirectory()) {
      // logger.info("is directory, skipping")
      continue
    }

    if (dirEntry.name !== PAGE_FILE_NAME) {
      // logger.info(`${dirEntry.name} is not a file page`)
      continue
    }

    let pageName: string = dirEntry.parentPath.replace(pagesDir, '')
    if (pageName.length > 0) {
      // logger.info("page is home")
      pageName = pageName.replace("/", "")
    }

    const pageFilePath = join(dirEntry.parentPath, PAGE_FILE_NAME)


    // logger.info("page name: " + pageName)
    // logger.info("page path: " + pageFilePath)

    pages.push([pageName, pageFilePath])
  }

  return pages
}
