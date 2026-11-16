import { useNavigate } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { CopyButton, MarkerText } from '../../components/CopyButton'
import { tabelaPrecosExtra } from '../../content/extras'

export default function PriceTable() {
  const navigate = useNavigate()

  return (
    <Screen className="px-5 pt-12 pb-[60px]">
      <BackButton onClick={() => navigate('/bonus')} label="Bônus" />
      <div className="mt-5 text-[26px] font-bold leading-[1.15] tracking-tight">{tabelaPrecosExtra.title}</div>
      <div className="mt-2 text-[15px] leading-[1.5] text-white/85">{tabelaPrecosExtra.intro}</div>

      <button
        onClick={() => navigate('/bonus/tabela-precos/montar')}
        className="press mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-rose text-[15.5px] font-semibold text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v14M5 10l7 7 7-7" />
          <path d="M5 21h14" />
        </svg>
        Montar e baixar minha tabela
      </button>

      <div className="mt-8 flex flex-col gap-5">
        {tabelaPrecosExtra.sections.map((section, i) => {
          const isReadyText = section.heading.startsWith('Texto pronto') && !!section.text
          return (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5">
              <div className="text-[18px] font-bold tracking-tight text-rose">{section.heading}</div>

              {section.text && (
                <MarkerText text={section.text} className="mt-2.5 text-[15px] leading-[1.6] text-white/85" />
              )}
              {isReadyText && <CopyButton text={section.text!} item={`tabela-precos:${section.heading}`} className="mt-3" />}

              {section.steps && (
                <div className="mt-2.5 flex flex-col gap-3">
                  {section.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full border text-[13px] font-bold text-rose"
                        style={{ background: 'rgba(224,122,155,.2)', borderColor: 'rgba(224,122,155,.3)' }}
                      >
                        {si + 1}
                      </div>
                      <div className="text-[15px] leading-[1.55] text-white/85">{step}</div>
                    </div>
                  ))}
                </div>
              )}

              {section.items && (
                <div className="mt-2.5 flex flex-col gap-2.5">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="flex items-start gap-3">
                      <div className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-white/45" />
                      <div className="text-[15px] leading-[1.55] text-white/85">{item}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Screen>
  )
}
