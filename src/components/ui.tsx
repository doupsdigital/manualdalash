import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function PrimaryButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`press h-[52px] rounded-full bg-rose text-[15.5px] font-semibold text-white disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`press flex h-11 items-center justify-center rounded-full bg-white/10 text-[15px] font-semibold text-white ${className}`}
    >
      {children}
    </button>
  )
}

export function BackButton({
  onClick,
  label,
  className = '',
}: {
  onClick: () => void
  label?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Voltar"
      className={`press flex h-11 items-center justify-center gap-1.5 rounded-full bg-white/10 text-[15px] font-semibold text-white ${label ? 'px-3.5' : 'w-11'} ${className}`}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
      {label}
    </button>
  )
}

export function ProgressBar({ pct, color = 'var(--color-rose)', trackClassName = 'bg-white/[0.14]', height = 6 }: { pct: number; color?: string; trackClassName?: string; height?: number }) {
  return (
    <div className={`overflow-hidden rounded-full ${trackClassName}`} style={{ height }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  )
}

export function Screen({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div className={`animate-fade-up absolute inset-0 overflow-auto ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
