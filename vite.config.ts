import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: { port: 5200, strictPort: true, host: true },
  preview: { port: 4200, strictPort: true, host: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
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
        // O conteúdo (módulos/lições) já vai embutido no bundle, funciona offline sozinho.
        globPatterns: ['**/*.{js,css,html,woff,woff2,png,svg,ico}'],
        // As capas dos módulos não entram no precache (senão baixaria tudo de uma vez no
        // primeiro acesso) — ficam em cache conforme a usuária for abrindo cada módulo.
        globIgnores: ['**/modulos/**'],
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
