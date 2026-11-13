import { useEffect, type ReactNode } from 'react'
import { SUPPORT_EMAIL } from '../lib/config'
import { LashMark } from './LashMark'

export const LEGAL_OWNER = 'Manual da Lash Designer - Um produto Doup - Soluções Digitais'

/** Visual compartilhado de /termos e /privacidade: topo com a marca, texto corrido e rodapé. */
export function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Manual da Lash Designer`
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [title])

  return (
    <div className="min-h-dvh bg-night font-sans text-white">
      <header className="mx-auto flex max-w-[760px] items-center justify-between gap-3 px-5 py-4">
        <a href="/lp" className="flex items-center gap-2.5 text-white no-underline">
          <LashMark size={32} />
          <span className="text-[15px] font-bold">Manual da Lash Designer</span>
        </a>
        <a href="/lp" className="flex h-11 items-center text-[14px] font-semibold text-white/80 no-underline hover:text-white">
          Voltar
        </a>
      </header>
      <main className="mx-auto flex max-w-[760px] flex-col gap-4 px-5 pt-6 pb-16 text-[16px] leading-[1.65] text-white/80 [&_a]:font-semibold [&_a]:text-rose [&_a]:underline [&_a]:underline-offset-2 [&_b]:text-white [&_h2]:mt-5 [&_h2]:text-[20px] [&_h2]:leading-snug [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-1 [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-white [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-gold [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-white">{title}</h1>
        {children}
        <p className="mt-4">
          Dúvidas ou suporte? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </main>
      <footer className="border-t border-white/10 bg-[#3d1b35] py-8 text-center text-[13px] text-white/65">
        <p>
          <a href="/termos" className="font-semibold text-white no-underline hover:underline">
            Termos de Uso
          </a>{' '}
          ·{' '}
          <a href="/privacidade" className="font-semibold text-white no-underline hover:underline">
            Privacidade
          </a>
        </p>
        <p className="mt-1.5">{LEGAL_OWNER}</p>
      </footer>
    </div>
  )
}
