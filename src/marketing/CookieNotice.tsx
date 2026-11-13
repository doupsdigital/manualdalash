import { useEffect, useState } from 'react'
import { META_PIXEL_ID } from '../lib/config'

const KEY = 'manual-lash:cookie-notice:v1'

function readChoice(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function saveChoice() {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // localStorage indisponível (modo privado etc.): só não mostra de novo nesta visita.
  }
}

/**
 * Aviso discreto de cookies (Pixel da Meta), fixo embaixo, que não bloqueia a página.
 * Sem pixel configurado não há cookie de anúncio, então o aviso nem aparece.
 */
export function CookieNotice() {
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(!META_PIXEL_ID || readChoice())
  }, [])

  if (dismissed) return null

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 bg-ink px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] text-center text-[13px] text-white/90"
    >
      <span>Usamos cookies para medir nossos anúncios e melhorar a página.</span>
      <a href="/privacidade" className="font-semibold text-white underline underline-offset-2">
        Saiba mais
      </a>
      <button
        type="button"
        onClick={() => {
          saveChoice()
          setDismissed(true)
        }}
        className="press ml-1 h-9 cursor-pointer rounded-full bg-white px-5 font-semibold text-ink"
      >
        Ok
      </button>
    </div>
  )
}
