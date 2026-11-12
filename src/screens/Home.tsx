import { useMemo, useState, type MouseEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Screen, ProgressBar } from '../components/ui'
import { modules, getLesson, allLessons, totalLessons, moduleCoverUrl } from '../content'
import { useProgress } from '../state/progress'
import { searchLessons } from '../lib/search'

function Avatar({ name, onClick }: { name: string | null; onClick: (e: MouseEvent) => void }) {
  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : null
  return (
    <button
      onClick={onClick}
      aria-label="Menu da conta"
      className="flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/30 text-[15px] font-bold text-white"
      style={{ background: 'linear-gradient(135deg,#8A3F6F,#5B2A4E)' }}
    >
      {initials ?? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      )}
    </button>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { isLessonDone, doneCount, lastLesson } = useProgress()
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')

  const buyerName: string | null = null // vem da Kiwify a partir da etapa 3 (login)

  const [searchParams, setSearchParams] = useSearchParams()
  const justFinished = searchParams.get('concluido') === '1'
  const dismissFinished = () => setSearchParams({}, { replace: true })

  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const dateStr = now
    .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(',', '')
    .toUpperCase()

  const current = useMemo(() => {
    const lesson = (lastLesson && getLesson(lastLesson)) || allLessons[0]
    const module = lesson.module
    const doneInModule = module.lessons.filter((l) => isLessonDone(l.id)).length
    return {
      lesson,
      module,
      pct: Math.round((doneInModule / module.lessons.length) * 100),
      progText: `${doneInModule} de ${module.lessons.length} lições do módulo`,
    }
  }, [lastLesson, isLessonDone])

  const fresh = doneCount === 0
  const heroLabel = fresh ? 'Comece por aqui' : 'Continuar de onde parou'
  const heroBtn = fresh ? 'Começar pela lição 1' : 'Continuar'
  const pctAll = totalLessons ? Math.round((doneCount / totalLessons) * 100) : 0

  const results = useMemo(() => searchLessons(q), [q])
  const searching = q.trim().length >= 2

  return (
    <Screen className="px-5 pt-14 pb-[110px]" onClick={() => menuOpen && setMenuOpen(false)}>
      {justFinished && (
        <button
          onClick={dismissFinished}
          className="animate-fade-up mb-5 block w-full rounded-3xl border p-4 text-left"
          style={{ background: 'rgba(201,161,91,.15)', borderColor: 'rgba(201,161,91,.3)' }}
        >
          <div className="text-[15px] font-semibold" style={{ color: '#E8C27E' }}>
            Parabéns, você concluiu o manual! 🎉
          </div>
          <div className="mt-1 text-[13px] text-white/70">Você pode consultar qualquer lição sempre que quiser.</div>
        </button>
      )}
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold tracking-wide text-white/60 uppercase">{dateStr}</div>
          <div className="mt-1.5 text-[30px] font-bold tracking-tight">
            {greeting}{buyerName ? `, ${buyerName}` : '!'}
          </div>
        </div>
        <Avatar
          name={buyerName}
          onClick={(e) => {
            e.stopPropagation()
            setMenuOpen((v) => !v)
          }}
        />
        {menuOpen && (
          <div
            className="animate-fade-up absolute top-14 right-0 z-10 w-[180px] rounded-[20px] border border-white/20 bg-plum p-1.5 shadow-xl"
          >
            <a href="mailto:suporte@manualdalash.com.br" className="block rounded-[14px] px-3.5 py-3.5 text-[15px] font-semibold text-white">
              Suporte
            </a>
          </div>
        )}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/20 bg-white/[0.16] p-[22px]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
          style={{ backgroundImage: `url(${moduleCoverUrl(current.module.id)})` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(91,42,78,.9), rgba(91,42,78,0))' }}
        />
        <div className="relative">
          <div className="text-[13px] font-semibold tracking-wide text-gold uppercase">{heroLabel}</div>
          <div className="mt-2.5 text-[13px] text-white/60">
            Módulo {String(current.module.id).padStart(2, '0')} · {current.module.title}
          </div>
          <div className="mt-1 text-[18px] font-bold leading-snug">{current.lesson.title}</div>
          <div className="mt-4">
            <ProgressBar pct={current.pct} />
          </div>
          <div className="mt-2 text-[13px] text-white/60">{current.progText}</div>
          <button
            onClick={() => navigate(`/licao/${current.lesson.id}`)}
            className="press mt-4 h-12 w-full rounded-full bg-rose text-[15.5px] font-semibold text-white"
          >
            {heroBtn}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-[13px] text-white/85">
          <span>
            <b className="text-white">{doneCount} de {totalLessons}</b> lições concluídas
          </span>
          <span className="text-white/60">{pctAll}%</span>
        </div>
        <div className="mt-2">
          <ProgressBar pct={pctAll} height={4} />
        </div>
      </div>

      <div className="relative mt-6">
        <svg className="absolute top-4 left-4 text-white/60" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar no manual (ex.: curvatura, manutenção, preço)"
          className="h-[54px] w-full rounded-2xl border border-white/[0.14] bg-white/[0.07] pl-12 pr-4 text-[14.5px] font-medium text-white outline-none"
        />
      </div>

      {searching ? (
        <>
          <div className="mt-6 text-[22px] font-bold tracking-tight">Resultados</div>
          {results.length === 0 && <div className="mt-3 text-[15px] text-white/60">Nada encontrado. Tente outra palavra.</div>}
          <div className="mt-3.5 flex flex-col gap-2.5">
            {results.map((r) => (
              <button
                key={r.lesson.id}
                onClick={() => navigate(`/licao/${r.lesson.id}`)}
                className="press rounded-3xl border border-white/10 bg-white/[0.07] p-4 text-left text-white"
              >
                <div className="text-[13px] text-white/60">
                  Lição {r.lesson.id} · {r.lesson.module.title}
                </div>
                <div className="mt-1 text-[16px] font-bold leading-snug">{r.lesson.title}</div>
                <div className="mt-1 text-[13px] text-white/60">{r.snippet}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mt-7 text-[22px] font-bold tracking-tight">Módulos</div>
          <div className="mt-3.5 flex flex-col gap-3">
            {modules.map((m) => {
              const done = m.lessons.filter((l) => isLessonDone(l.id)).length
              const total = m.lessons.length
              const minutes = m.lessons.reduce((a, l) => a + l.minutes, 0)
              const complete = done === total
              const pct = total ? (done / total) * 100.5 : 0
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/modulo/${m.id}`)}
                  className="press flex items-center gap-3.5 rounded-3xl border border-white/10 bg-white/[0.07] p-[18px] text-left text-white"
                >
                  <div className="w-12 flex-none font-display text-[34px] font-medium text-rose">
                    {String(m.id).padStart(2, '0')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[18px] font-bold leading-snug">{m.title}</div>
                    <div className="mt-1 text-[13px] leading-snug text-white/60">{m.subtitle}</div>
                    <div className="mt-2 text-[13px] font-semibold text-white/85">
                      {total} lições · {minutes} min
                    </div>
                  </div>
                  <div className="relative flex h-10 w-10 flex-none items-center justify-center">
                    {complete ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      </div>
                    ) : (
                      <>
                        <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
                          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth={3} />
                          <circle cx="20" cy="20" r="16" fill="none" stroke="#E07A9B" strokeWidth={3} strokeLinecap="round" strokeDasharray={`${pct.toFixed(1)} 100.5`} />
                        </svg>
                        <span className="text-[11.5px] font-bold">
                          {done}/{total}
                        </span>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </Screen>
  )
}
