import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * `virtual:modulos-resumo`: título, nº de lições e minutos de cada módulo, calculados do
 * manual.json na hora do build. A /lp usa isso na lista de módulos sem baixar o conteúdo inteiro
 * do manual (que só o app carrega).
 */
function modulosResumo() {
  const ID = 'virtual:modulos-resumo'
  const file = fileURLToPath(new URL('./src/content/manual.json', import.meta.url))
  return {
    name: 'modulos-resumo',
    resolveId: (id: string) => (id === ID ? '\0' + ID : undefined),
    load(this: { addWatchFile: (f: string) => void }, id: string) {
      if (id !== '\0' + ID) return
      this.addWatchFile(file)
      const manual = JSON.parse(readFileSync(file, 'utf8')) as {
        modules: { id: number; title: string; lessons: { minutes?: number }[] }[]
      }
      const resumo = manual.modules.map((m) => ({
        id: m.id,
        title: m.title,
        lessons: m.lessons.length,
        minutes: m.lessons.reduce((total, l) => total + (l.minutes ?? 0), 0),
      }))
      return `export default ${JSON.stringify(resumo)}`
    },
  }
}

export default defineConfig({
  server: { port: 5200, strictPort: true, host: true },
  preview: { port: 4200, strictPort: true, host: true },
  plugins: [
    modulosResumo(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registro manual em src/AppRoot.tsx: a /lp (pacote leve) não registra o service worker.
      injectRegister: false,
      includeAssets: ['favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Manual da Lash Designer',
        short_name: 'Manual da Lash',
        description: 'A apostila da lash designer, sempre à mão no seu celular.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#4A2140',
        theme_color: '#4A2140',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // A versão nova assume na hora (com injectRegister: false o plugin deixava de incluir isso,
        // e a versão nova ficava "esperando" para sempre atrás da antiga).
        skipWaiting: true,
        clientsClaim: true,
        // /lp, /termos e /privacidade nunca são respondidas pelo app guardado em cache: sempre da rede.
        navigateFallbackDenylist: [/^\/(lp|termos|privacidade)\/?$/],
        // Ao assumir, recarrega as abas abertas nessas páginas (ver o arquivo).
        importScripts: ['/sw-marketing.js'],
        // O conteúdo (módulos/lições) já vai embutido no bundle, funciona offline sozinho.
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico}'],
        // As capas dos módulos não entram no precache (senão baixaria tudo de uma vez no
        // primeiro acesso) — ficam em cache conforme a usuária for abrindo cada módulo.
        globIgnores: ['**/modulos/**', '**/lp/**'],
        runtimeCaching: [
          {
            urlPattern: /\/modulos\/.*\.webp$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'capas-modulos',
              expiration: { maxEntries: 11, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
})
