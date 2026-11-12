import { useNavigate } from 'react-router-dom'
import { Screen, PrimaryButton } from '../components/ui'
import { markWelcomeSeen } from '../lib/onboarding'

const items = [
  {
    bg: '#FBE8EE',
    ink: '#E07A9B',
    icon: <path d="M12 7v5l3 2" />,
    circle: true,
    text: 'Lições curtas, de 2 a 4 minutos',
  },
  {
    bg: '#F6EBD3',
    ink: '#8A6A24',
    icon: <path d="M8 12.5l3 3 5-6" />,
    circle: true,
    text: 'Marque como concluída',
  },
  {
    bg: '#EDE1EA',
    ink: '#5B2A4E',
    icon: (
      <>
        <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z" />
        <path d="M4 21V5" />
      </>
    ),
    circle: false,
    text: 'Consulte quando quiser',
  },
]

export default function Welcome() {
  const navigate = useNavigate()

  const start = () => {
    markWelcomeSeen()
    navigate('/licao/1-1')
  }

  return (
    <Screen className="flex flex-col px-7 pt-20 pb-10">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-[22px]"
        style={{ background: 'rgba(201,161,91,.15)', color: '#E8C27E' }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
          <path d="M19 16v4M17 18h4" />
        </svg>
      </div>
      <div className="mt-7 font-display text-[40px] leading-[1.1] font-medium">Bem-vinda ao Manual da Lash Designer</div>
      <div className="mt-9 flex flex-col gap-3.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-3xl border border-white/10 bg-white/[0.07] p-4">
            <div
              className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-2xl"
              style={{ background: it.bg, color: it.ink }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                {it.circle && <circle cx="12" cy="12" r="9" />}
                {it.icon}
              </svg>
            </div>
            <div className="text-[17px] font-semibold">{it.text}</div>
          </div>
        ))}
      </div>
      <div className="min-h-8 flex-1" />
      <PrimaryButton onClick={start}>Começar pela lição 1</PrimaryButton>
    </Screen>
  )
}
