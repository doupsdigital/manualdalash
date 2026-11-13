// Pixel da Meta — só é importado pelas páginas de marketing (/lp, /termos, /privacidade), nunca
// pelo app. Com META_PIXEL_ID vazio, nada é carregado e os eventos não fazem nada.
// Eventos: PageView (ao carregar), ViewContent (1x, quando a oferta aparece na tela) e AddToCart
// (ao clicar em comprar). InitiateCheckout e Purchase ficam com a Kiwify, no checkout.
import { META_PIXEL_ID, PRODUCT_PRICE } from '../lib/config'

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; callMethod?: unknown }
    _fbq?: unknown
  }
}

const CONTENT = { content_name: 'Manual da Lash Designer', content_type: 'product', currency: 'BRL' }
let initialized = false

export function initPixel() {
  if (initialized || !META_PIXEL_ID || typeof window === 'undefined') return
  initialized = true

  /* eslint-disable */
  ;(function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
    if (f.fbq) return
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
    }
    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    t = b.createElement(e)
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0]
    s.parentNode.insertBefore(t, s)
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
  /* eslint-enable */

  window.fbq?.('init', META_PIXEL_ID)
  window.fbq?.('track', 'PageView')
}

/** Dispara ViewContent uma única vez, na primeira vez que o elemento aparece na tela. */
export function trackViewContentOnceVisible(el: Element | null) {
  if (!el || typeof IntersectionObserver === 'undefined') return () => {}
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        window.fbq?.('track', 'ViewContent', { ...CONTENT, value: PRODUCT_PRICE })
        observer.disconnect()
      }
    },
    { threshold: 0.3 },
  )
  observer.observe(el)
  return () => observer.disconnect()
}

/** AddToCart ao clicar em comprar — espera no máximo 250ms antes de ir para o checkout. */
export function trackAddToCart(redirect: () => void) {
  if (!window.fbq) {
    redirect()
    return
  }
  window.fbq('track', 'AddToCart', { ...CONTENT, value: PRODUCT_PRICE })
  setTimeout(redirect, 250)
}
