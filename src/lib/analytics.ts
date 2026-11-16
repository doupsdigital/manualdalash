// PostHog: navegação da página de vendas (/lp) e uso do app.
//
// - Só liga em produção (manualdalash.com.br) e com VITE_POSTHOG_KEY preenchida. No localhost, no
//   `npm run preview` e nos deploys de teste da Vercel nada é carregado e as funções não fazem nada.
// - Carrega depois que a página terminou de abrir (posthog-js num pacote separado), para não pesar
//   na primeira tela de quem chega do anúncio.
// - Os dados vão por /ingest (rewrite no vercel.json para o PostHog US), para bloqueador de anúncio
//   não cortar.
// - Sem o "Ok" do aviso de cookies, nada é guardado no aparelho (persistência em memória). Com o
//   "Ok", passa a guardar — e a mesma pessoa é reconhecida da /lp até o app.
// - Gravação de sessão só na /lp, com tudo o que é digitado escondido.
import type { PostHog } from 'posthog-js'
import { hasConsent } from './consent'

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const PROD_HOSTS = ['manualdalash.com.br', 'www.manualdalash.com.br']

export const analyticsEnabled =
  import.meta.env.PROD && !!KEY && typeof window !== 'undefined' && PROD_HOSTS.includes(window.location.hostname)

let ph: PostHog | null = null
let started = false
const queue: Array<(p: PostHog) => void> = []

function run(fn: (p: PostHog) => void) {
  if (!analyticsEnabled) return
  if (ph) fn(ph)
  else queue.push(fn)
}

export function initAnalytics({ recordSessions }: { recordSessions: boolean }) {
  if (!analyticsEnabled || started) return
  started = true

  const start = async () => {
    const { default: posthog } = await import('posthog-js')
    posthog.init(KEY!, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      person_profiles: 'identified_only',
      capture_pageview: 'history_change',
      capture_pageleave: true,
      persistence: hasConsent() ? 'localStorage+cookie' : 'memory',
      disable_session_recording: !recordSessions,
      session_recording: { maskAllInputs: true },
    })
    ph = posthog
    queue.splice(0).forEach((fn) => fn(posthog))
  }

  const later = () => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => void start(), { timeout: 2000 })
    else setTimeout(() => void start(), 1)
  }
  if (document.readyState === 'complete') later()
  else window.addEventListener('load', later, { once: true })
}

type Props = Record<string, string | number | boolean | null | undefined>

export function track(event: string, props?: Props) {
  run((p) => p.capture(event, props))
}

/** Para cliques que saem da página (checkout): manda na hora, por sendBeacon. */
export function trackBeforeLeave(event: string, props?: Props) {
  run((p) => p.capture(event, props, { send_instantly: true, transport: 'sendBeacon' }))
}

/** Liga a sessão à conta (id interno do Supabase, nunca o e-mail). */
export function identify(userId: string) {
  run((p) => {
    if (p.get_distinct_id() !== userId) p.identify(userId)
  })
}

/** Ao sair da conta: a próxima pessoa no aparelho começa anônima. */
export function resetIdentity() {
  run((p) => p.reset())
}

/** Depois do "Ok" do aviso de cookies: passa a guardar no aparelho. */
export function enableAnalyticsPersistence() {
  run((p) => p.set_config({ persistence: 'localStorage+cookie' }))
}
