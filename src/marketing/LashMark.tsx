/** O cílio dourado sobre ameixa — mesmo desenho do ícone do app e da tela de login. */
export function LashMark({ size = 36 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex flex-none items-center justify-center border border-white/20"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: 'linear-gradient(135deg,#5B2A4E,#7A3A66)',
        color: '#E8C27E',
      }}
    >
      <svg aria-hidden="true" width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15c3.5-5 14.5-5 18 0" />
        <path d="M5 12.5 3.5 9.5M9 11 8 7.5M12 10.5v-4M15 11l1-3.5M19 12.5l1.5-3" />
      </svg>
    </span>
  )
}
