import { useNavigate, useParams } from 'react-router-dom'
import { ProgressBar, BackButton } from '../components/ui'
import { getModule, moduleCoverUrl } from '../content'
import { useProgress } from '../state/progress'

export default function Module() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLessonDone } = useProgress()
  const module = getModule(Number(id))

  if (!module) return null

  const done = module.lessons.filter((l) => isLessonDone(l.id)).length
  const total = module.lessons.length
  const minutes = module.lessons.reduce((a, l) => a + l.minutes, 0)
  const pct = total ? (done / total) * 100 : 0
  const next = module.lessons.find((l) => !isLessonDone(l.id)) ?? module.lessons[0]

  return (
    <div className="animate-fade-up absolute inset-0 flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="relative h-[340px] overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-45"
            style={{ backgroundImage: `url(${moduleCoverUrl(module.id)})` }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(74,33,64,.35), #4A2140)' }}
          />
          <div className="relative flex h-full flex-col items-start justify-between px-5 pt-12 pb-6">
            <BackButton onClick={() => navigate('/inicio')} label="Voltar" className="backdrop-blur-md" />
            <div style={{ textShadow: '0 1px 12px rgba(0,0,0,.35)' }}>
              <div className="font-display text-[56px] leading-none font-medium text-rose">
                {String(module.id).padStart(2, '0')}
              </div>
              <div className="mt-2 text-[30px] font-bold leading-[1.15] tracking-tight">{module.title}</div>
              <div className="mt-2 text-[16px] leading-snug text-white/85">{module.subtitle}</div>
            </div>
          </div>
        </div>
        <div className="px-5 pt-5 pb-8">
          <div className="flex justify-between text-[13px] text-white/85">
            <span>
              <b className="text-white">{done} de {total}</b> lições concluídas
            </span>
            <span className="text-white/60">{minutes} min</span>
          </div>
          <div className="mt-2">
            <ProgressBar pct={pct} />
          </div>
          <div className="mt-6 flex flex-col gap-2.5">
            {module.lessons.map((l) => {
              const d = isLessonDone(l.id)
              return (
                <button
                  key={l.id}
                  onClick={() => navigate(`/licao/${l.id}`)}
                  className="press flex items-center gap-3.5 rounded-3xl border border-white/10 bg-white/[0.07] p-4 text-left text-white"
                >
                  <div className="w-[30px] flex-none text-[13px] font-bold text-white/60">{l.id}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold leading-snug">{l.title}</div>
                    <div className="mt-0.5 text-[13px] text-white/60">{l.minutes} min</div>
                  </div>
                  {d ? (
                    <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-green">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="h-7 w-7 flex-none rounded-full border-[1.7px] border-white/45" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div
        className="flex-none px-5 pt-4 pb-[calc(20px+env(safe-area-inset-bottom))]"
        style={{ background: 'linear-gradient(to top, #4A2140 70%, rgba(74,33,64,0))' }}
      >
        <button
          onClick={() => navigate(`/licao/${next.id}`)}
          className="press min-h-[52px] w-full rounded-full bg-rose px-5 py-2 text-[15.5px] leading-snug font-semibold text-white"
        >
          Continuar: {next.title}
        </button>
      </div>
    </div>
  )
}
