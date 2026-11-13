// Gera os ícones do PWA e os favicons a partir de scripts/icon-master.svg (+ a versão maskable).
// Rode com: npm run icons
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const master = path.join(here, 'icon-master.svg')
const maskable = path.join(here, 'icon-master-maskable.svg')
const publicDir = path.join(root, 'public')

async function make(src, size, out) {
  await sharp(src).resize(size, size).png().toFile(path.join(publicDir, out))
  console.log('✓', out)
}

await make(master, 192, 'pwa-192.png')
await make(master, 512, 'pwa-512.png')
await make(maskable, 512, 'pwa-maskable-512.png')
await make(master, 180, 'apple-touch-icon.png')
await make(master, 48, 'favicon-48.png')
await make(master, 32, 'favicon-32.png')

console.log('Pronto.')
