// Importado pelo service worker do app (vite.config.ts → workbox.importScripts).
//
// Quem abriu o app antes da /lp existir tinha um service worker antigo, que respondia a /lp com o
// app antigo guardado em cache (tela só com o fundo ameixa). Quando esta versão nova assume, ela
// recarrega as abas abertas nas páginas de marketing, que agora vêm sempre da rede.
var MARKETING_PATHS = ['/lp', '/termos', '/privacidade']

self.addEventListener('activate', function (event) {
  event.waitUntil(
    self.clients
      .claim()
      .then(function () {
        return self.clients.matchAll({ type: 'window' })
      })
      .then(function (windows) {
        windows.forEach(function (client) {
          var path = new URL(client.url).pathname.replace(/\/+$/, '')
          if (MARKETING_PATHS.indexOf(path) !== -1 && client.navigate) {
            client.navigate(client.url).catch(function () {})
          }
        })
      }),
  )
})
