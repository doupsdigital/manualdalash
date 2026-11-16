import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getLesson, getModule } from '../content'
import { useProgress, FONT_SIZES_PX } from '../state/progress'
import { track } from '../lib/analytics'

export default function Lesson() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isLessonDone, markLessonDone, setLastLesson, fontSize, cycleFontSize } = useProgress()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollPct, setScrollPct] = useState(0)

  const lesson = id ? getLesson(id) : undefined

  useEffect(() => {
    if (lesson) {
      setLastLesson(lesson.id)
      track('lesson_opened', { lesson_id: lesson.id, title: lesson.title })
    }
    scrollRef.current?.scrollTo({ top: 0 })
    setScrollPct(0)
  }, [lesson, setLastLesson])

  if (!lesson) return null

  const module = lesson.module
  const idxInModule = module.lessons.findIndex((l) => l.id === lesson.id)
  const nextInModule = module.lessons[idxInModule + 1]
  const nextModule = getModule(module.id + 1)
  const isLast = module.id === 11 && lesson.id === '11-6'
  const done = isLessonDone(lesson.id)
  const fsPx = FONT_SIZES_PX[fontSize]

  const finish = useMemo(() => {
    if (!done) return { label: 'Concluir lição ✓', bg: 'bg-rose', action: () => {
          markLessonDone(lesson.id)
          track('lesson_completed', { lesson_id: lesson.id, module_id: module.id })
        },
      }
    if (nextInModule) return { label: 'Próxima lição →', bg: 'bg-green', action: () => navigate(`/licao/${nextInModule.id}`) }
    if (isLast) return { label: 'Voltar ao Início 🎉', bg: 'bg-green', action: () => navigate('/inicio?concluido=1') }
    if (nextModule) return { label: 'Próximo módulo →', bg: 'bg-green', action: () => navigate(`/modulo/${nextModule.id}`) }
    return { label: 'Voltar ao módulo', bg: 'bg-green', action: () => navigate(`/modulo/${module.id}`) }
  }, [done, nextInModule, isLast, nextModule, module.id, lesson.id, markLessonDone, navigate])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    setScrollPct(max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0)
  }

  return (
    <div className="animate-fade-up absolute inset-0 flex flex-col">
      <div className="flex-none border-b border-white/10 bg-night/95 backdrop-blur-xl">
        <div className="flex items-center gap-2 px-3 pt-10 pb-2">
          <button
            onClick={() => navigate(`/modulo/${module.id}`)}
            aria-label="Voltar"
            className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex-1 text-center text-[13px] font-semibold text-white/85">
            Lição {lesson.id} · {lesson.minutes} min
          </div>
          <button
            onClick={cycleFontSize}
            aria-label="Tamanho do texto"
            className="press flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-[15px] font-semibold text-white"
          >
            A<span className="text-[11px]">a</span>
          </button>
        </div>
        <div className="h-[3px] bg-white/10">
          <div className="h-full bg-rose" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-auto px-6 pt-8 pb-14">
        <div className="text-[13px] font-semibold tracking-wide text-white/60 uppercase">
          Módulo {String(module.id).padStart(2, '0')} · {module.title}
        </div>
        <h1 className="mt-2.5 text-[30px] font-bold leading-tight tracking-tight">{lesson.title}</h1>
        <p className="mt-5 font-semibold text-white" style={{ fontSize: fsPx, lineHeight: 1.65 }}>
          {lesson.intro}
        </p>

        {lesson.blocks.map((block, i) => (
          <div key={i} className="mt-[34px]">
            <h2 className="text-[22px] font-bold leading-snug tracking-tight text-rose">{block.heading}</h2>
            {block.text && (
              <p className="mt-3 text-white/85" style={{ fontSize: fsPx, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                {block.text}
              </p>
            )}
            {block.steps && (
              <div className="mt-3.5 flex flex-col gap-4">
                {block.steps.map((step, si) => (
                  <div key={si} className="flex items-start gap-3.5">
                    <div
                      className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full border text-[14px] font-bold text-rose"
                      style={{ background: 'rgba(224,122,155,.2)', borderColor: 'rgba(224,122,155,.3)' }}
                    >
                      {si + 1}
                    </div>
                    <div className="text-white/85" style={{ fontSize: fsPx, lineHeight: 1.65 }}>
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {block.items && (
              <div className="mt-3.5 flex flex-col gap-3.5">
                {block.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-3.5">
                    <div className="mt-2.5 h-1.5 w-1.5 flex-none rounded-full bg-white/45" />
                    <div className="text-white/85" style={{ fontSize: fsPx, lineHeight: 1.65 }}>
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {lesson.tip && (
          <div className="mt-[34px] rounded-3xl border p-5" style={{ background: 'rgba(201,161,91,.15)', borderColor: 'rgba(201,161,91,.3)' }}>
            <div className="flex items-center gap-2.5 text-[13px] font-semibold tracking-wide uppercase" style={{ color: '#E8C27E' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
              </svg>
              Dica
            </div>
            <p className="mt-2.5 text-white/85" style={{ fontSize: fsPx, lineHeight: 1.65 }}>
              {lesson.tip}
            </p>
          </div>
        )}

        {lesson.mistake && (
          <div className="mt-4 rounded-3xl border p-5" style={{ background: 'rgba(224,122,155,.2)', borderColor: 'rgba(224,122,155,.3)' }}>
            <div className="flex items-center gap-2.5 text-[13px] font-semibold tracking-wide uppercase" style={{ color: '#F4A9BF' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4l9 16H3z" />
                <path d="M12 10v4M12 17.2v.1" />
              </svg>
              Erro comum
            </div>
            <p className="mt-2.5 text-white/85" style={{ fontSize: fsPx, lineHeight: 1.65 }}>
              {lesson.mistake}
            </p>
          </div>
        )}

        {lesson.summary && (
          <div className="mt-[34px]">
            <div className="text-[13px] font-semibold tracking-wide text-white/60 uppercase">Resumo</div>
            <div
              className="mt-2.5 border-l-[3px] border-rose pl-4 text-white/85 italic"
              style={{ fontSize: fsPx, lineHeight: 1.65 }}
            >
              {lesson.summary}
            </div>
          </div>
        )}

        <button onClick={finish.action} className={`press mt-10 h-14 w-full rounded-full text-[17px] font-semibold text-white ${finish.bg}`}>
          {finish.label}
        </button>
        <button
          onClick={() => navigate(`/modulo/${module.id}`)}
          className="mx-auto mt-3 block h-11 px-4 text-[14px] text-white/60 underline"
        >
          Voltar ao módulo
        </button>
      </div>
    </div>
  )
}
