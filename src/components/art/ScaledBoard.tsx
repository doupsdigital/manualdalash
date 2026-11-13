import type { ReactNode } from 'react'

/** Envolve a arte (1080 de largura) numa prévia em escala, para caber na tela do celular. */
export function ScaledBoard({ width, height, scale, children }: { width: number; height: number; scale: number; children: ReactNode }) {
  return (
    <div style={{ width: Math.round(width * scale), height: Math.round(height * scale), overflow: 'hidden', flex: 'none' }}>
      <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0', position: 'relative' }}>{children}</div>
    </div>
  )
}
