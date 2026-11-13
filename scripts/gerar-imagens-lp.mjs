// Gera as imagens da página de vendas (/lp) em public/lp/:
//  1. Converte a arte do livro (livro.png, livro-titulo.png) para .webp otimizado e gera as
//     miniaturas das capas dos módulos (public/lp/modulos/, 144×144).
//  2. Tira 6 prints do próprio app (390×844) com progresso de demonstração:
//     screen-inicio (escala 3, é o print do topo, mostrado maior), e em escala 2: screen-modulo
//     (módulo 6), screen-licao (lição 6-3), screen-guia (curvaturas), screen-checklist (alguns itens
//     marcados, rolado até a barra de progresso para os itens aparecerem no recorte) e screen-guia-combinacoes (combinações prontas, para a seção de bônus).
//
// Uso: npm run lp-imagens
// Sobe um servidor do Vite só para isso, em modo local (sem Supabase, sem login), na porta 5299.
// Precisa do Chromium do Playwright instalado (npx playwright-core install chromium).
import { createServer } from 'vite'
import { chromium } from 'playwright-core'
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public/lp')
const PORT = 5299

// ---------- 1. Arte do livro ----------
for (const [src, out, width] of [
  ['livro.png', 'livro.webp', 760],
  ['livro-titulo.png', 'livro-titulo.webp', 640],
]) {
  const info = await sharp(path.join(OUT, src)).resize({ width }).webp({ quality: 80, effort: 6 }).toFile(path.join(OUT, out))
  console.log(`${out}: ${Math.round(info.size / 1024)} KB`)
}

// Miniaturas das capas dos módulos para a lista da /lp (144×144 = 72px @2x). As capas originais
// (public/modulos, 1536×1024, ~110 KB cada) seriam pesadas demais para 11 miniaturas no 4G.
const THUMBS = path.join(OUT, 'modulos')
fs.mkdirSync(THUMBS, { recursive: true })
for (const file of fs.readdirSync(path.join(ROOT, 'public/modulos')).filter((f) => f.endsWith('.webp'))) {
  await sharp(path.join(ROOT, 'public/modulos', file))
    .resize({ width: 144, height: 144, fit: 'cover', position: 'attention' })
    .webp({ quality: 78, effort: 6 })
    .toFile(path.join(THUMBS, file))
}
console.log(`miniaturas dos módulos: ${fs.readdirSync(THUMBS).length}`)

// ---------- 2. Prints do app ----------
// Progresso de exemplo: módulos 1 a 3 completos, 3 lições do módulo 4, parou na 4-4.
const done = {}
const day = (n) => new Date(Date.UTC(2026, 9, n, 12)).toISOString()
const counts = { 1: 5, 2: 6, 3: 6, 4: 3 }
let d = 1
for (const [mod, n] of Object.entries(counts)) for (let i = 1; i <= n; i++) done[`${mod}-${i}`] = day(d++)
const PROGRESS = {
  lessons: done,
  // Alguns itens da primeira etapa marcados (aparecem no print do checklist).
  checklist: { '0-0': true, '0-1': true, '0-2': true, '0-4': true },
  lastLesson: '4-4',
  updatedAt: day(d),
  fontSize: 0,
}

const server = await createServer({
  root: ROOT,
  logLevel: 'error',
  server: { port: PORT, strictPort: true, host: '127.0.0.1' },
  // Força o modo local do app (ver src/lib/supabase.ts): sem login, progresso só no navegador.
  define: {
    'import.meta.env.VITE_SUPABASE_URL': '""',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
  },
})
await server.listen()
const BASE = `http://127.0.0.1:${PORT}`

const browser = await chromium.launch()

// Dia fixo (quinta, 15/10/2026, de manhã) para a saudação e a data saírem sempre iguais.
const fixDate = () => {
  const ts = new Date(2026, 9, 15, 9, 30).getTime()
  const Real = Date
  class FixedDate extends Real {
    constructor(...args) {
      if (args.length === 0) super(ts)
      else super(...args)
    }
    static now() {
      return ts
    }
  }
  // eslint-disable-next-line no-global-assign
  Date = FixedDate
}

async function newPage(scale) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale, locale: 'pt-BR' })
  const p = await context.newPage()
  await p.addInitScript(fixDate)
  await p.goto(BASE + '/inicio')
  await p.evaluate((data) => {
    localStorage.setItem('manual-lash:onboarded:v1', '1')
    localStorage.setItem('manual-lash:progress:v1', JSON.stringify(data))
  }, PROGRESS)
  return p
}

let page = await newPage(3)

async function shot(route, name, prepare) {
  await page.goto(BASE + route, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500) // fim da animação de entrada da tela
  if (prepare) await prepare()
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))))
  await page.waitForTimeout(200)
  const png = await page.screenshot()
  const info = await sharp(png).webp({ quality: 82, effort: 6 }).toFile(path.join(OUT, `${name}.webp`))
  console.log(`${name}.webp: ${Math.round(info.size / 1024)} KB`)
}

/** Rola a tela do app (o container com overflow) até o elemento com o texto dado ficar a `top` px do topo. */
const scrollTo = (text, top) => async () => {
  await page.evaluate(
    ({ text, top }) => {
      const scroller = [...document.querySelectorAll('div')].find((el) => getComputedStyle(el).overflowY === 'auto')
      const target = [...document.querySelectorAll('div, h2, span')].find((el) => el.textContent?.trim() === text)
      if (!scroller || !target) return
      scroller.scrollTop += target.getBoundingClientRect().top - top
    },
    { text, top },
  )
  await page.waitForTimeout(150)
}

await shot('/inicio', 'screen-inicio')
page = await newPage(2)
await shot('/modulo/6', 'screen-modulo')
await shot('/licao/6-3', 'screen-licao', scrollTo('Qual combina com cada olhar', 130))
await shot('/bonus/guia', 'screen-guia', scrollTo('Curvaturas', 28))
await shot('/bonus/checklist', 'screen-checklist', scrollTo('4 de 37', 18))
await shot('/bonus/guia', 'screen-guia-combinacoes', scrollTo('Combinações prontas', 28))

await browser.close()
await server.close()
console.log('pronto')
