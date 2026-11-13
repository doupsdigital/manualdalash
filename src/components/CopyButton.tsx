import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/clipboard'

export function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const t = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(t.current), [])

  const onCopy = async () => {
    await copyText(text)
    setCopied(true)
    window.clearTimeout(t.current)
    t.current = window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`press flex h-11 items-center justify-center rounded-full px-5 text-[14px] font-semibold ${
        copied ? 'bg-green text-white' : 'bg-white/10 text-white'
      } ${className}`}
    >
      {copied ? 'Copiado ✓' : 'Copiar'}
    </button>
  )
}

/** Mostra o texto com os marcadores [entre colchetes] destacados, para lembrar de trocar antes de enviar. */
export function MarkerText({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(/(\[[^\]\n]+\])/g)
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parts.map((p, i) =>
        /^\[[^\]\n]+\]$/.test(p) ? (
          <mark key={i} className="rounded-md bg-[#fff1b8] px-0.5 font-semibold text-[#7a5a00]">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </div>
  )
}
