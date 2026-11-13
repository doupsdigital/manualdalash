import { useEffect, type ReactNode } from 'react'
import { initPixel } from './pixel'
import { CookieNotice } from './CookieNotice'

/** Envolve /lp, /termos e /privacidade: liga o Pixel da Meta (se tiver ID) e mostra o aviso de cookies. */
export function MarketingLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    initPixel()
  }, [])

  return (
    <>
      {children}
      <CookieNotice />
    </>
  )
}
