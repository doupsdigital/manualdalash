import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, ProgressBar, Screen } from '../components/ui'
import { checklistBonus, checklistTotal, checklistKey } from '../content'
import { useProgress } from '../state/progress'

export default function Checklist() {
  const navigate = useNavigate()
  const { isChecked, toggleCheck, checkedCount, clearChecklist } = useProgress()
  const [confirmClear, setConfirmClear] = useState(false)

  const pct = checklistTotal ? (checkedCount / checklistTotal) * 100 : 0

  return (
    <Screen className="px-5 pt-12 pb-[110px]">
      <BackButton onClick={() => navigate('/bonus')} label="Bônus" />
      <div className="mt-5 text-[30px] font-bold leading-[1.15] tracking-tight">{checklistBonus.title}</div>
      <div className="mt-2.5 text-[16px] leading-[1.55] text-white/85">{checklistBonus.intro}</div>

      <div className="mt-5 flex items-center gap-3.5">
        <div className="whitespace-nowrap text-[15px] font-bold">
          {checkedCount} de {checklistTotal}
        </div>
        <div className="flex-1">
          <ProgressBar pct={pct} color="var(--color-green)" />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3.5">
        {checklistBonus.sections.map((section, si) => (
          <div key={si} className="rounded-3xl border border-white/10 bg-white/[0.07] px-[18px] py-5">
            <div className="flex items-baseline justify-between">
              <div className="text-[18px] font-bold text-rose">{section.heading}</div>
              <div className="text-[13px] text-white/60">
                {section.items.filter((_, ii) => isChecked(checklistKey(si, ii))).length}/{section.items.length}
              </div>
            </div>
            <div className="mt-1.5 flex flex-col">
              {section.items.map((item, ii) => {
                const key = checklistKey(si, ii)
                const on = isChecked(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleCheck(key)}
                    className="flex w-full items-start gap-3.5 py-3 text-left"
                  >
                    <div
                      className="mt-px flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border-[1.7px]"
                      style={{ borderColor: on ? '#34C759' : 'rgba(255,255,255,.45)', background: on ? '#34C759' : 'transparent' }}
                    >
                      {on && (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12.5l4.5 4.5L19 7.5" />
                        </svg>
                      )}
                    </div>
                    <div className="text-[16px] leading-[1.5]" style={{ color: on ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.85)' }}>
                      {item}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {confirmClear ? (
        <div className="mx-auto mt-[18px] flex max-w-[280px] flex-col items-center gap-2.5 rounded-3xl border border-white/15 bg-white/[0.08] p-4 text-center">
          <div className="text-[14px] text-white/85">Limpar todas as marcações deste checklist?</div>
          <div className="flex gap-2.5">
            <button
              onClick={() => setConfirmClear(false)}
              className="press h-10 rounded-full border border-white/15 px-4 text-[13px] font-semibold text-white/70"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                clearChecklist()
                setConfirmClear(false)
              }}
              className="press h-10 rounded-full bg-rose px-4 text-[13px] font-semibold text-white"
            >
              Limpar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmClear(true)}
          className="press mx-auto mt-[18px] block h-11 rounded-full border border-white/15 px-[18px] text-[14px] font-semibold text-white/60"
        >
          Limpar marcações
        </button>
      )}
    </Screen>
  )
}
