import { useNavigate } from 'react-router-dom'
import { Screen } from '../components/ui'
import { checklistBonus, guideBonus, checklistTotal } from '../content'
import { useProgress } from '../state/progress'
import { useAuth } from '../state/auth'
import { usePurchases, type ExtraKey } from '../state/purchases'
import { EXTRAS_CHECKOUT_URLS, EXTRAS_PRICE_LABELS } from '../lib/config'

const EXTRAS: { key: ExtraKey; title: string; desc: string; route: string }[] = [
  {
    key: 'mensagens',
    title: 'Mensagens que Fecham Horário',
    desc: 'Textos prontos para confirmar, remarcar e fechar o agendamento.',
    route: '/bonus/mensagens',
  },
  {
    key: 'tabela-precos',
    title: 'Tabela de Preços da Lash',
    desc: 'Um modelo pronto para montar e apresentar os seus valores.',
    route: '/bonus/tabela-precos',
  },
]

function checkoutUrlFor(key: ExtraKey, email: string | undefined) {
  const base = EXTRAS_CHECKOUT_URLS[key]
  if (!base) return null
  if (!email) return base
  try {
    const url = new URL(base)
    url.searchParams.set('email', email)
    return url.toString()
  } catch {
    return base
  }
}

export default function Bonus() {
  const navigate = useNavigate()
  const { checkedCount } = useProgress()
  const { user } = useAuth()
  const { isUnlocked, refresh, loading } = usePurchases()

  return (
    <Screen className="px-5 pt-16 pb-[110px]">
      <div className="text-[30px] font-bold tracking-tight">Bônus</div>
      <div className="mt-1.5 text-[16px] text-white/85">Para ter à mão no atendimento.</div>

      <div className="mt-6 flex flex-col gap-3.5">
        <button
          onClick={() => navigate('/bonus/checklist')}
          className="press rounded-[28px] border border-white/20 bg-white/[0.16] p-[22px] text-left text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl" style={{ background: '#FBE8EE', color: '#E07A9B' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="18" rx="3" />
                <path d="M8.5 9.5l1.5 1.5 3-3M8.5 16h7" />
              </svg>
            </div>
            <span className="rounded-[10px] px-2.5 py-1 text-[13px] font-semibold" style={{ background: 'rgba(201,161,91,.15)', color: '#E8C27E' }}>
              Bônus 1
            </span>
          </div>
          <div className="mt-4 text-[18px] font-bold">{checklistBonus.title}</div>
          <div className="mt-1.5 text-[13px] leading-snug text-white/60">{checklistBonus.subtitle}</div>
          <div className="mt-3 text-[13px] font-semibold text-rose">
            {checkedCount} de {checklistTotal} marcados →
          </div>
        </button>

        <button
          onClick={() => navigate('/bonus/guia')}
          className="press rounded-[28px] border border-white/20 bg-white/[0.16] p-[22px] text-left text-white"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-2xl" style={{ background: '#F6EBD3', color: '#8A6A24' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 15c3.5-5 14.5-5 18 0" />
                <path d="M5 12.5 3.5 9.5M9 11 8 7.5M12 10.5v-4M15 11l1-3.5M19 12.5l1.5-3" />
              </svg>
            </div>
            <span className="rounded-[10px] px-2.5 py-1 text-[13px] font-semibold" style={{ background: 'rgba(201,161,91,.15)', color: '#E8C27E' }}>
              Bônus 2
            </span>
          </div>
          <div className="mt-4 text-[18px] font-bold">{guideBonus.title}</div>
          <div className="mt-1.5 text-[13px] leading-snug text-white/60">{guideBonus.subtitle}</div>
          <div className="mt-3 text-[13px] font-semibold text-rose">Abrir guia →</div>
        </button>
      </div>

      <div className="mt-8 text-[22px] font-bold tracking-tight">Extras</div>
      <div className="mt-3.5 flex flex-col gap-3">
        {EXTRAS.map((x) => {
          const unlocked = isUnlocked(x.key)
          const checkoutUrl = checkoutUrlFor(x.key, user?.email)
          const content = (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex-1 text-[18px] font-bold">{x.title}</div>
                {!unlocked && (
                  <span className="flex text-white/60">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="5" y="11" width="14" height="10" rx="3" />
                      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[13px] leading-snug text-white/60">{x.desc}</div>
              {unlocked ? (
                <div className="mt-3.5 text-[13px] font-semibold text-rose">Abrir →</div>
              ) : (
                <>
                  <a
                    href={checkoutUrl ?? undefined}
                    target="_blank"
                    rel="noopener"
                    aria-disabled={!checkoutUrl}
                    onClick={(e) => e.stopPropagation()}
                    className="press mt-3.5 flex h-12 items-center justify-center rounded-full bg-white/10 text-[15.5px] font-semibold text-white"
                  >
                    Desbloquear · {EXTRAS_PRICE_LABELS[x.key]}
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      refresh()
                    }}
                    disabled={loading}
                    className="mt-2 h-9 w-full text-[13px] font-semibold text-white/60"
                  >
                    {loading ? 'Verificando…' : 'Já comprei, atualizar'}
                  </button>
                </>
              )}
            </>
          )
          return unlocked ? (
            <button
              key={x.key}
              onClick={() => navigate(x.route)}
              className="press rounded-3xl border border-white/10 bg-white/[0.07] p-5 text-left"
            >
              {content}
            </button>
          ) : (
            <div key={x.key} className="rounded-3xl border border-white/10 bg-white/[0.07] p-5">
              {content}
            </div>
          )
        })}
      </div>
    </Screen>
  )
}
