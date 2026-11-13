import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { CopyButton, MarkerText } from '../../components/CopyButton'
import { mensagensExtra, mensagensCategorias } from '../../content/extras'

export default function Messages() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<string | null>(null)
  const [showHowTo, setShowHowTo] = useState(false)

  const messages = useMemo(
    () => (category ? mensagensExtra.messages.filter((m) => m.category === category) : mensagensExtra.messages),
    [category],
  )

  return (
    <Screen className="px-5 pt-12 pb-[60px]">
      <BackButton onClick={() => navigate('/bonus')} label="Bônus" />
      <div className="mt-5 text-[26px] font-bold leading-[1.15] tracking-tight">{mensagensExtra.title}</div>
      <div className="mt-2 text-[15px] leading-[1.5] text-white/85">{mensagensExtra.intro}</div>

      <button
        onClick={() => setShowHowTo((v) => !v)}
        className="press mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-left"
      >
        <span className="text-[14px] font-semibold text-rose">Como usar</span>
        <span className="text-white/60">{showHowTo ? '−' : '+'}</span>
      </button>
      {showHowTo && (
        <ol className="mt-2 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          {mensagensExtra.howTo.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-white/85">
              <span className="font-bold text-rose">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      )}

      <div className="-mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`press flex-none rounded-full px-4 py-2 text-[13px] font-semibold ${
            category === null ? 'bg-rose text-white' : 'bg-white/10 text-white/70'
          }`}
        >
          Todas
        </button>
        {mensagensCategorias.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`press flex-none rounded-full px-4 py-2 text-[13px] font-semibold whitespace-nowrap ${
              category === c ? 'bg-rose text-white' : 'bg-white/10 text-white/70'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {messages.map((m) => (
          <div key={m.id} className="rounded-3xl border border-white/10 bg-white/[0.07] p-4">
            <div className="text-[13px] font-semibold text-white/60">{m.category}</div>
            <div className="mt-1 text-[16px] font-bold leading-snug">{m.title}</div>
            <MarkerText text={m.text} className="mt-2.5 text-[14.5px] leading-[1.55] text-white/85" />
            <CopyButton text={m.text} className="mt-3 w-full" />
          </div>
        ))}
      </div>
    </Screen>
  )
}
