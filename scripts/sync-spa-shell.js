import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const rootDir = join(scriptDir, '..')
const source = join(rootDir, 'dist', 'index.html')
const destination = join(rootDir, 'functions', 'rendering', 'spa-shell.html')

copyFileSync(source, destination)
console.log(`Synced ${source} -> ${destination}`)
