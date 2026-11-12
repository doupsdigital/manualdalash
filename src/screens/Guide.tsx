import { useNavigate } from 'react-router-dom'
import { BackButton, Screen } from '../components/ui'
import { guideBonus } from '../content'

const CURVE_PATHS: Record<string, string> = {
  B: 'M6 36Q42 34 72 24',
  C: 'M6 36Q44 32 72 16',
  CC: 'M6 36Q42 30 70 10',
  D: 'M6 36Q36 32 62 6',
  L: 'M6 36L46 34Q66 31 72 10',
  M: 'M6 36Q40 36 56 24Q66 14 66 3',
}

const TICKS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => ({ n, x: ((n - 6) / 9) * 100 }))

const BANDS: { name: string; a: number; b: number; bg: string }[] = [
  { name: 'Natural', a: 8, b: 10, bg: 'rgba(224,122,155,.45)' },
  { name: 'Marcado', a: 10, b: 12, bg: 'rgba(224,122,155,.75)' },
  { name: 'Dramático', a: 13, b: 15, bg: '#E07A9B' },
]

function rowsFor(heading: string) {
  return guideBonus.sections.find((s) => s.heading === heading)?.rows ?? []
}

export default function Guide() {
  const navigate = useNavigate()

  const thickness = rowsFor('Espessuras')
  const curves = rowsFor('Curvaturas')
  const combos = rowsFor('Combinações prontas')
  const maxWidth = Math.max(...thickness.map((r) => parseFloat(r.label.replace(',', '.'))))

  return (
    <Screen className="px-5 pt-12 pb-[110px]">
      <BackButton onClick={() => navigate('/bonus')} label="Bônus" />
      <div className="mt-5 text-[30px] font-bold leading-[1.15] tracking-tight">{guideBonus.title}</div>
      <div className="mt-2.5 text-[16px] leading-[1.55] text-white/85">{guideBonus.intro}</div>

      <div className="mt-8 text-[22px] font-bold tracking-tight text-rose">Espessuras</div>
      <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.07] px-[18px]">
        {thickness.map((r, i) => (
          <div key={r.label} className={`py-3.5 ${i < thickness.length - 1 ? 'border-b border-white/10' : ''}`}>
            <div className="flex items-center gap-3.5">
              <div className="flex w-24 flex-none items-center">
                <div
                  className="w-full rounded-full bg-white"
                  style={{ height: Math.max(1.5, (parseFloat(r.label.replace(',', '.')) / maxWidth) * 8) }}
                />
              </div>
              <div className="text-[18px] font-bold">{r.label}</div>
            </div>
            <div className="mt-2 text-[15px] leading-snug text-white/85">{r.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-[22px] font-bold tracking-tight text-rose">Curvaturas</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {curves.map((c) => (
          <div key={c.label} className="rounded-3xl border border-white/10 bg-white/[0.07] p-4">
            <svg viewBox="0 0 80 44" width="100%" height="64" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 40H76" stroke="rgba(255,255,255,.2)" strokeWidth={1.5} />
              <path d={CURVE_PATHS[c.label]} />
            </svg>
            <div className="mt-1.5 text-[22px] font-bold" style={{ color: '#E8C27E' }}>
              {c.label}
            </div>
            <div className="mt-1 text-[13px] leading-snug text-white/85">{c.text}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-[22px] font-bold tracking-tight text-rose">Tamanhos</div>
      <div className="mt-3 rounded-3xl border border-white/10 bg-white/[0.07] p-[18px]">
        <div className="text-[15px] leading-snug text-white/85">
          <b className="text-white">6 a 15 mm.</b> Faixa usada no dia a dia. Os menores tamanhos ficam no canto interno.
        </div>
        <div className="relative mt-4 h-[22px]">
          {TICKS.map((t) => (
            <div
              key={t.n}
              className="absolute top-0 -translate-x-1/2 text-[11.5px] font-semibold text-white/60"
              style={{ left: `${t.x}%` }}
            >
              {t.n}
            </div>
          ))}
        </div>
        <div className="relative h-2 rounded-full bg-white/[0.14]">
          {TICKS.map((t) => (
            <div key={t.n} className="absolute top-[-3px] h-3.5 w-[1.5px] bg-white/25" style={{ left: `${t.x}%` }} />
          ))}
        </div>
        <div className="mt-3.5 flex flex-col gap-3.5">
          {BANDS.map((b) => (
            <div key={b.name}>
              <div className="flex justify-between text-[14px]">
                <span className="font-bold">{b.name}</span>
                <span className="text-white/85">
                  {b.a} a {b.b} mm
                </span>
              </div>
              <div className="relative mt-1.5 h-3 rounded-full bg-white/[0.08]">
                <div
                  className="absolute top-0 bottom-0 rounded-full"
                  style={{ left: `${((b.a - 6) / 9) * 100}%`, width: `${((b.b - b.a) / 9) * 100}%`, background: b.bg }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 text-[22px] font-bold tracking-tight text-rose">Combinações prontas</div>
      <div className="mt-3 flex flex-col gap-3">
        {combos.map((c) => (
          <div key={c.label} className="rounded-3xl border border-white/10 bg-white/[0.07] p-[18px]">
            <div className="text-[18px] font-bold">{c.label}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {c.text
                .replace(/\.$/, '')
                .split(' · ')
                .map((chip) => (
                  <span
                    key={chip}
                    className="rounded-[10px] border px-2.5 py-1.5 text-[13px] font-semibold text-white"
                    style={{ background: 'rgba(224,122,155,.2)', borderColor: 'rgba(224,122,155,.3)' }}
                  >
                    {chip}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border p-5 text-[16px] leading-[1.6] text-white/85" style={{ background: 'rgba(201,161,91,.15)', borderColor: 'rgba(201,161,91,.3)' }}>
        <div className="mb-2 text-[13px] font-semibold tracking-wide uppercase" style={{ color: '#E8C27E' }}>
          Lembre-se
        </div>
        {guideBonus.note}
      </div>
    </Screen>
  )
}
