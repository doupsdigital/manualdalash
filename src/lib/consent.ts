// Escolha do aviso de cookies ("Ok"), guardada no aparelho. Usada pelo aviso da /lp e pelo PostHog
// (lib/analytics.ts): sem o "Ok", o PostHog registra a visita, mas não guarda cookie nem nada no aparelho.
const KEY = 'manual-lash:cookie-notice:v1'

export function hasConsent(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function saveConsent() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // localStorage indisponível (modo privado etc.): só não mostra de novo nesta visita.
  }
}
