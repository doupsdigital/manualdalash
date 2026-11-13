// Arte da Tabela de Valores (Story 1080×1920 ou Post 1080×1350), estilo "menu" do motor de
// artes do LashBox (../lashbox/src/components/art/StoryBoard.tsx), simplificado para um único
// tipo de arte e sem o sistema de "Meu Estúdio".
import { fit2, PALETTES, CQW, type PaletteId } from '../../lib/artPalettes'

export interface PriceBoardProps {
  palette: PaletteId
  post: boolean
  title: string
  rows: [string, string][]
  note: string
  foot1: string
  foot2: string
}

export function PriceBoard({ palette, post, title, rows, note, foot1, foot2 }: PriceBoardProps) {
  const c = PALETTES[palette]
  const k = post ? 0.82 : 1
  const H = post ? 1350 : 1920

  const titleTable: [number, number][] = [[18, 9], [28, 7.6], [44, 6.4], [999, 5.4]]
  const tSize = fit2(title.length, titleTable, k)

  const names = rows.map((r) => r[0])
  const n = names.length || 1
  const longest = Math.max(0, ...names.map((s) => s.length))
  const rowMin = post ? 36 : 40
  const rSize = Math.max(rowMin, fit2(longest + (n > 5 ? 12 : 0), [[16, 5.2], [26, 4.6], [999, 4]], k))
  const noteSize = note ? Math.max(36, fit2(note.length, [[28, 4.8], [60, 4.2], [999, 3.6]], k)) : 0

  const top = Math.round((post ? 8 : 14) * CQW)
  const bot = Math.round((post ? 22 : 32) * CQW)
  const fBot = Math.round((post ? 6 : 9) * CQW)
  const gap = Math.round((post ? 2.6 : 4) * CQW)
  const rowGap = Math.round((post ? 3 : 4.6) * CQW)

  return (
    <div
      style={{
        width: 1080,
        height: H,
        position: 'relative',
        overflow: 'hidden',
        background: c.bg,
        color: c.fg,
        fontFamily: "'Playfair Display', serif",
      }}
    >
      <div style={{ position: 'absolute', right: Math.round(-22 * CQW), top: Math.round(-14 * CQW), width: Math.round(62 * CQW), height: Math.round(62 * CQW), borderRadius: '50%', background: c.acc, opacity: 0.16 }} />
      <div style={{ position: 'absolute', left: Math.round(-18 * CQW), bottom: Math.round(-18 * CQW), width: Math.round(50 * CQW), height: Math.round(50 * CQW), borderRadius: '50%', background: c.acc, opacity: 0.12 }} />
      <div style={{ position: 'absolute', inset: Math.round(4 * CQW), border: `1px solid ${c.acc}`, opacity: 0.5 }} />

      <div
        style={{
          position: 'absolute',
          left: Math.round(10 * CQW),
          right: Math.round(10 * CQW),
          top,
          bottom: bot,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap,
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: Math.round(2 * CQW), color: c.acc, flex: 'none' }}>
          <div style={{ width: Math.round(9 * CQW), height: 1, background: 'currentColor' }} />
          <div style={{ fontSize: Math.round(3.4 * CQW), lineHeight: 1 }}>✦</div>
          <div style={{ width: Math.round(9 * CQW), height: 1, background: 'currentColor' }} />
        </div>

        <div style={{ fontSize: tSize, lineHeight: 1.12, fontWeight: 500, textWrap: 'balance', overflowWrap: 'anywhere', maxWidth: '100%' }}>
          {title}
        </div>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: rowGap }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: Math.round(1.6 * CQW), fontSize: rSize }}>
              <span style={{ textAlign: 'left', overflowWrap: 'anywhere', maxWidth: '60%' }}>{r[0]}</span>
              <span style={{ flex: 1, minWidth: Math.round(4 * CQW), borderBottom: `1.5px dotted ${c.acc}`, transform: 'translateY(-.5ch)' }} />
              <span style={{ color: c.acc, fontWeight: 500, whiteSpace: 'nowrap', filter: `brightness(${c.pb})` }}>{r[1]}</span>
            </div>
          ))}
          {note && <div style={{ marginTop: Math.round(2 * CQW), fontStyle: 'italic', fontSize: noteSize, opacity: 0.8 }}>{note}</div>}
        </div>
      </div>

      <div style={{ position: 'absolute', left: Math.round(8 * CQW), right: Math.round(8 * CQW), bottom: fBot, textAlign: 'center', fontFamily: "'Jost', sans-serif" }}>
        <div style={{ width: Math.round(12 * CQW), height: 1, background: c.acc, margin: `0 auto ${Math.round(2.4 * CQW)}px` }} />
        {foot1 && (
          <div style={{ fontSize: Math.round(2.7 * CQW), fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', overflowWrap: 'anywhere' }}>
            {foot1}
          </div>
        )}
        {foot2 && (
          <div style={{ fontSize: Math.round(2.7 * CQW), color: c.acc, marginTop: Math.round(1 * CQW), fontWeight: 500, overflowWrap: 'anywhere' }}>
            {foot2}
          </div>
        )}
      </div>
    </div>
  )
}
