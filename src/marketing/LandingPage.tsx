import { useEffect, useRef, useState, type ReactNode } from 'react'
import { KIWIFY_CHECKOUT_URL, SUPPORT_EMAIL } from '../lib/config'
import { withForwardedParams } from '../lib/checkoutUrl'
import { trackAddToCart, trackViewContentOnceVisible } from './pixel'
import { track, trackBeforeLeave } from '../lib/analytics'
import { LashMark } from './LashMark'
// Título, nº de lições e minutos de cada módulo, calculados do manual.json no build (vite.config.ts).
import MODULES from 'virtual:modulos-resumo'

// ---------------------------------------------------------------------------------------------
// Conteúdo (textos exatamente como no briefing — não reescrever)
// ---------------------------------------------------------------------------------------------

const FEATURES = [
  {
    title: 'Lições curtas',
    text: '2 a 4 minutos cada.',
  },
  {
    title: 'Direto ao ponto',
    text: 'passo a passo, dicas e erros comuns.',
  },
  {
    title: 'No seu celular',
    text: 'com busca, para consultar na hora.',
  },
]

const TOPICS = ['Técnicas', 'Mapping', 'Manutenção', 'Preço', 'Clientes']

/**
 * Balões da seção de identificação, como uma conversa: à esquerda, mensagem recebida (blush, canto
 * de baixo à esquerda quase reto); à direita, mensagem enviada (rosa, canto de baixo à direita).
 */
const QUESTIONS = [
  { text: 'Qual curvatura usar?', side: 'left', className: 'self-start -rotate-1' },
  { text: 'Quanto cobrar?', side: 'right', className: 'self-end mr-2 rotate-1' },
  { text: 'Como conseguir clientes?', side: 'left', className: 'self-start ml-4 -rotate-[0.5deg]' },
] as const

// Ritmo da conversa: "digitando" por 400ms, o balão entra; o próximo balão vem 600ms depois.
const TYPING_MS = 400
const BUBBLE_GAP_MS = 600
const BUBBLE_ANIM_MS = 450

const BONUSES = [
  {
    tag: 'Bônus 1',
    title: 'Checklist do Atendimento Perfeito',
    text: '37 itens para marcar, da véspera ao pós-atendimento. Nunca mais esqueça nada.',
    src: '/lp/screen-checklist.webp',
    alt: 'Tela do Checklist do Atendimento Perfeito, com 4 de 37 itens marcados na etapa Na véspera',
  },
  {
    tag: 'Bônus 2',
    title: 'Guia Visual de Fios e Curvaturas',
    text: 'Espessuras, curvaturas, tamanhos e combinações prontas para consultar na hora.',
    src: '/lp/screen-guia-combinacoes.webp',
    alt: 'Tela do Guia Visual com as combinações prontas: natural do dia a dia, marcado e versátil, olho encapuzado',
  },
]

const SCREENS = [
  { src: '/lp/screen-modulo.webp', caption: 'Cada módulo com sua capa', alt: 'Tela do módulo 6, Mapping básico, com a capa do módulo e a lista de lições' },
  { src: '/lp/screen-licao.webp', caption: 'Lições claras, com dicas e erros comuns', alt: 'Tela da lição 6-3, com a lista de estilos por formato de olho e o card de Dica' },
  { src: '/lp/screen-guia.webp', caption: 'Guia visual para consultar na hora', alt: 'Tela do Guia Visual com as curvaturas B, C, CC, D, L e M desenhadas' },
]


const INCLUDED = [
  '11 módulos e 60 lições curtas',
  'Bônus: Checklist do Atendimento Perfeito',
  'Bônus: Guia Visual de Fios e Curvaturas',
  'Acesso imediato no celular, com busca e progresso salvo',
]

const FAQ: [string, string][] = [
  [
    'Como recebo o acesso?',
    'Assim que o pagamento é aprovado, você recebe um e-mail com o link do app. Para entrar, é só usar o e-mail da compra e o código que chega na hora.',
  ],
  [
    'Preciso baixar algum aplicativo?',
    'Não. O manual abre no navegador do celular, e você pode adicionar à tela inicial para usar como um app.',
  ],
  [
    'Serve para quem ainda não começou?',
    'Sim. O manual vai do primeiro fio à agenda cheia: começa pelo básico da profissão e chega em preço, clientes e manutenção. Quem já atende também aproveita para revisar e preencher lacunas.',
  ],
  ['O pagamento é mensal?', 'Não. É um pagamento único de R$ 27, sem mensalidade.'],
]

// ---------------------------------------------------------------------------------------------
// Peças
// ---------------------------------------------------------------------------------------------

function Icon({ d, size = 24, className = '', strokeWidth = 1.7 }: { d: string; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={d} />
    </svg>
  )
}

const CHECK = 'M5 12.5l4.5 4.5L19 7.5'

/**
 * Botão de compra: AddToCart no Pixel (no máx. 250ms) e vai para o checkout com UTMs/fbclid.
 * Com `pulse`, pulsa de leve (escala + anel rosa, ver .lp-pulse no CSS) só enquanto está na tela.
 */
function BuyButton({
  children,
  className = '',
  btnRef,
  pulse = false,
  position,
}: {
  children: ReactNode
  className?: string
  btnRef?: React.RefObject<HTMLAnchorElement | null>
  pulse?: boolean
  /** Qual botão foi clicado, no PostHog: topo, oferta, final ou barra. */
  position: 'topo' | 'oferta' | 'final' | 'barra'
}) {
  const url = withForwardedParams(KIWIFY_CHECKOUT_URL)
  const ownRef = useRef<HTMLAnchorElement>(null)
  const ref = btnRef ?? ownRef
  const [onScreen, setOnScreen] = useState(false)
  const go = () => {
    window.location.href = url
  }

  useEffect(() => {
    const el = ref.current
    if (!pulse || !el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting))
    obs.observe(el)
    return () => obs.disconnect()
  }, [pulse, ref])

  return (
    <a
      ref={ref}
      href={url}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        trackBeforeLeave('lp_buy_clicked', { position })
        trackAddToCart(go)
      }}
      className={`press inline-flex h-14 cursor-pointer items-center justify-center rounded-full bg-rose px-9 text-[17px] font-bold text-white no-underline [text-shadow:0_1px_0_rgba(91,42,78,.35)] shadow-[0_12px_30px_rgba(224,122,155,.38)] hover:bg-[#e68aa8] md:h-16 md:px-11 md:text-[19px] ${
        pulse ? `lp-pulse ${onScreen ? 'is-pulsing' : ''}` : ''
      } ${className}`}
    >
      {children}
    </a>
  )
}

/** Celular com um print do app dentro. */
function Phone({ src, alt, eager = false, className = '', style }: { src: string; alt: string; eager?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`overflow-hidden rounded-[30px] border-[6px] border-[#1d1519] bg-night shadow-[0_24px_50px_rgba(20,6,16,.5)] ${className}`}
      style={{ aspectRatio: '390 / 844', ...style }}
    >
      <img
        src={src}
        alt={alt}
        width={390}
        height={844}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding={eager ? 'sync' : 'async'}
        className="block h-full w-full object-cover object-top"
      />
    </div>
  )
}

/** Três pontinhos "digitando", em branco 50%. */
function TypingDots({ visible, className = '' }: { visible: boolean; className?: string }) {
  return (
    <span aria-hidden="true" className={`lp-typing flex items-center gap-1 ${visible ? 'is-on' : ''} ${className}`}>
      <span />
      <span />
      <span />
    </span>
  )
}

/**
 * Os 3 balões "Já travou em alguma dessas?". Quando a lista entra na tela (uma vez), os balões chegam
 * um de cada vez, cada um precedido pelos pontinhos "digitando" do lado em que vai entrar; depois
 * a linha de resposta aparece. Com movimento reduzido (ou sem IntersectionObserver), tudo já aparece
 * pronto. Só transform e opacity animam; o espaço de cada balão já está reservado desde o início.
 */
function ChatQuestions() {
  const listRef = useRef<HTMLUListElement>(null)
  // Decide já no primeiro render (sem piscar): anima só sem movimento reduzido e com IntersectionObserver.
  const [animate] = useState(
    () => typeof IntersectionObserver !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [shown, setShown] = useState(animate ? 0 : QUESTIONS.length) // quantos balões já chegaram
  const [typing, setTyping] = useState(-1)
  const [answer, setAnswer] = useState(!animate)

  useEffect(() => {
    const el = listRef.current
    if (!el || !animate) return
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        obs.disconnect()
        QUESTIONS.forEach((_, i) => {
          const bubbleAt = TYPING_MS + i * BUBBLE_GAP_MS
          at(bubbleAt - TYPING_MS, () => setTyping(i))
          at(bubbleAt, () => {
            setTyping(-1)
            setShown(i + 1)
          })
        })
        at(TYPING_MS + (QUESTIONS.length - 1) * BUBBLE_GAP_MS + BUBBLE_ANIM_MS, () => setAnswer(true))
      },
      { threshold: 0.6 },
    )
    obs.observe(el)
    return () => {
      obs.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [animate])

  const animating = shown < QUESTIONS.length

  return (
    <>
      <ul ref={listRef} className="relative mt-10 flex w-full max-w-[340px] flex-col gap-3 md:mt-12 md:max-w-[380px]">
        {QUESTIONS.map((q, i) => {
          const left = q.side === 'left'
          const visible = i < shown
          return (
            <li key={q.text} className={`relative ${q.className}`}>
              {/* Pontinhos: o do 1º balão fica logo acima dele; os outros, no lugar do balão que vai chegar. */}
              {animating && (
                <TypingDots
                  visible={typing === i}
                  className={
                    i === 0
                      ? 'absolute bottom-full left-2 mb-2'
                      : `absolute inset-y-0 ${left ? 'left-3' : 'right-3'}`
                  }
                />
              )}
              <span
                className={`lp-bubble block px-[18px] py-3 text-[16px] leading-snug font-semibold shadow-[0_8px_24px_rgba(0,0,0,.25)] ${
                  left
                    ? 'origin-bottom-left rounded-[20px] rounded-bl-[6px] bg-blush text-plum'
                    : 'origin-bottom-right rounded-[20px] rounded-br-[6px] bg-rose text-white'
                } ${visible ? '' : 'is-waiting'}`}
              >
                {q.text}
              </span>
            </li>
          )
        })}
      </ul>
      <p
        className={`lp-answer mt-7 text-center text-[17px] leading-[1.5] text-balance text-white/80 md:text-[18px] ${
          answer ? '' : 'is-waiting'
        }`}
      >
        O manual responde, em lições de 2 a 4 minutos.
      </p>
    </>
  )
}

function SectionTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`mx-auto max-w-[760px] text-center text-[clamp(27px,5.6vw,42px)] leading-[1.15] font-extrabold tracking-[-.025em] text-balance text-white ${className}`}>
      {children}
    </h2>
  )
}

// ---------------------------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------------------------

export function LandingPage() {
  const heroBtnRef = useRef<HTMLAnchorElement>(null)
  const offerRef = useRef<HTMLElement>(null)
  const offerBtnRef = useRef<HTMLAnchorElement>(null)
  const finalBtnRef = useRef<HTMLAnchorElement>(null)
  const [heroGone, setHeroGone] = useState(false)
  const [offerVisible, setOfferVisible] = useState(false)
  const [finalVisible, setFinalVisible] = useState(false)
  const [open, setOpen] = useState(-1)

  useEffect(() => {
    document.title = 'Manual da Lash Designer · Do primeiro fio à agenda cheia'
  }, [])

  // Barra fixa: aparece quando o botão do topo não está na tela (por cima ou por baixo) e some enquanto o botão da
  // oferta (ou o da chamada final) está na tela — assim nunca há dois botões iguais juntos, e
  // também não fica um trecho da oferta sem nenhum botão à vista.
  useEffect(() => {
    const hero = heroBtnRef.current
    const offerBtn = offerBtnRef.current
    const finalBtn = finalBtnRef.current
    if (!hero || !offerBtn || !finalBtn || typeof IntersectionObserver === 'undefined') return
    const heroObs = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting))
    const offerObs = new IntersectionObserver(([e]) => setOfferVisible(e.isIntersecting))
    const finalObs = new IntersectionObserver(([e]) => setFinalVisible(e.isIntersecting))
    heroObs.observe(hero)
    offerObs.observe(offerBtn)
    finalObs.observe(finalBtn)
    return () => {
      heroObs.disconnect()
      offerObs.disconnect()
      finalObs.disconnect()
    }
  }, [])

  // Pixel: ViewContent uma vez, quando a oferta aparece.
  useEffect(() => trackViewContentOnceVisible(offerRef.current), [])

  // PostHog: cada seção com data-track conta uma vez como vista quando o topo dela passa do meio
  // da tela — mostra até onde as pessoas rolam antes de desistir.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const seen = new Set<string>()
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const name = (e.target as HTMLElement).dataset.track
          if (!e.isIntersecting || !name || seen.has(name)) continue
          seen.add(name)
          track('lp_section_viewed', { section: name })
          obs.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -50% 0px' },
    )
    document.querySelectorAll('[data-track]').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Seções sobem 24px com fade ao entrar na tela, uma vez (sem isso com movimento reduzido).
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof IntersectionObserver === 'undefined') return
    const root = document.documentElement
    root.classList.add('lp-motion')
    const els = document.querySelectorAll<HTMLElement>('[data-reveal], [data-stagger]')
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            obs.unobserve(e.target)
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    )
    els.forEach((el) => obs.observe(el))
    return () => {
      obs.disconnect()
      root.classList.remove('lp-motion')
    }
  }, [])

  const showBar = heroGone && !offerVisible && !finalVisible

  return (
    <div className="relative overflow-x-clip bg-night font-sans text-white">
      {/* 1. TOPO ------------------------------------------------------------------------------ */}
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(170deg,#5B2A4E 0%,#6a3159 45%,#7A3A66 100%)' }}>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[48%] left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full opacity-70 md:top-[-10%] md:left-[70%]"
          style={{ background: 'radial-gradient(closest-side, rgba(224,122,155,.28), rgba(224,122,155,0))' }}
        />
        <div className="relative mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-5 py-4">
          <a href="/lp" className="flex min-h-11 items-center gap-2.5 text-white no-underline">
            <LashMark size={34} />
            <span className="text-[15px] leading-tight font-bold">Manual da Lash Designer</span>
          </a>
          <a href="/entrar" className="flex h-11 items-center px-1 text-[14px] font-semibold text-white/75 no-underline hover:text-white">
            Já comprei
          </a>
        </div>

        {/* Celular: texto → imagem → botão (o botão logo abaixo da imagem, perto da primeira tela).
            Desktop: texto e botão na coluna da esquerda, imagem ocupando a direita. */}
        <div className="relative mx-auto grid max-w-[1120px] gap-x-12 px-5 pt-3 pb-12 md:grid-cols-[1.05fr_.95fr] md:grid-rows-[auto_auto] md:pt-10 md:pb-24">
          <div className="flex min-w-0 flex-col items-center text-center md:col-start-1 md:row-start-1 md:items-start md:self-end md:text-left">
            <h1 className="text-[clamp(34px,9.3vw,63px)] leading-[1.06] font-extrabold tracking-[-.03em] text-balance">
              Tudo o que uma Lash Designer precisa saber, <span className="text-rose">do Primeiro fio à Agenda cheia.</span>
            </h1>
            <p className="mt-3.5 text-[17px] leading-snug font-semibold text-balance text-gold-light md:mt-5 md:text-[20px]">
              O manual que toda Lash Designer queria ter recebido.
            </p>
            <ul aria-label="Assuntos do manual" className="mt-4 flex max-w-[340px] flex-wrap justify-center gap-2 md:mt-5 md:max-w-none md:justify-start">
              {TOPICS.map((t) => (
                <li key={t} className="rounded-full border border-white/[0.14] bg-white/[0.08] px-3 py-1 text-[13px] font-medium text-white/85">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto mt-5 aspect-[1/1.02] w-[min(76vw,300px)] md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0 md:w-full md:max-w-[460px] md:self-center">
            <div
              aria-hidden="true"
              className="absolute inset-[4%] rounded-full"
              style={{ background: 'radial-gradient(closest-side, rgba(232,194,126,.5), rgba(201,161,91,.18) 55%, rgba(201,161,91,0))' }}
            />
            <Phone
              src="/lp/screen-inicio.webp"
              alt="Tela inicial do app, com o card Continuar de onde parou e o progresso das lições"
              eager
              className="absolute top-[1%] left-[9%] w-[47%] md:top-0"
              style={{ transform: 'rotate(-5deg)' }}
            />
            <img
              src="/lp/livro.webp"
              alt="Livro do Manual da Lash Designer"
              width={760}
              height={760}
              loading="eager"
              fetchPriority="high"
              className="lp-book-mask absolute right-[-6%] bottom-[-8%] w-[72%]"
            />
          </div>

          <div className="relative flex flex-col items-center md:col-start-1 md:row-start-2 md:items-start md:self-start">
            <BuyButton pulse position="topo" btnRef={heroBtnRef} className="mt-6 w-full max-w-[340px] md:mt-8 md:w-auto">
              Quero o meu manual
            </BuyButton>
            <p className="mt-3 text-center text-[13px] text-white/75 md:text-left md:text-[14px]">
              <span className="whitespace-nowrap">R$ 27 · pagamento único</span> ·{' '}
              <span className="whitespace-nowrap">acesso imediato</span> ·{' '}
              <span className="whitespace-nowrap">garantia de 7 dias</span>
            </p>
          </div>
        </div>
      </header>

      <main>
        {/* 2. IDENTIFICAÇÃO + NÃO É PDF ------------------------------------------------------ */}
        <section data-track="identificacao" className="bg-night">
          <div data-reveal className="mx-auto flex max-w-[1040px] flex-col items-center px-5 py-20 md:py-28">
            <SectionTitle>Já travou em alguma dessas?</SectionTitle>
            <ChatQuestions />
            <p className="mt-12 text-center text-[clamp(22px,4.6vw,30px)] leading-tight font-bold tracking-[-.02em] text-gold-light md:mt-16">
              Não é um PDF de 200 páginas.
            </p>
            <ul className="mt-7 grid w-full gap-3.5 md:grid-cols-3 md:gap-5">
              {FEATURES.map((f, i) => (
                <li key={f.title} className="flex items-center gap-4 rounded-[24px] border border-white/[0.12] bg-white/[0.06] px-5 py-4 md:gap-5 md:px-6 md:py-5">
                  <span aria-hidden="true" className="w-7 flex-none text-center font-display text-[40px] leading-[.8] font-medium text-gold">
                    {i + 1}
                  </span>
                  <p className="text-[16px] leading-[1.45] text-pretty text-white/80">
                    <strong className="font-bold text-white">{f.title}:</strong> {f.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. O QUE TEM DENTRO ------------------------------------------------------------------ */}
        <section data-track="modulos" className="bg-plum">
          <div className="mx-auto max-w-[1120px] py-20 md:py-28">
            <div data-reveal className="px-5">
              <h2 className="text-center text-[clamp(30px,6.4vw,46px)] leading-[1.1] font-extrabold tracking-[-.025em] text-white">
                <span className="font-display text-[1.55em] font-medium tracking-normal text-rose">11</span> módulos e{' '}
                <span className="font-display text-[1.55em] font-medium tracking-normal text-rose">60</span> lições
              </h2>
            </div>

            <div data-reveal>
              <ul
                className="lp-rail mt-10 flex gap-5 overflow-x-auto px-[max(20px,calc(50%-125px))] pb-4 md:justify-center md:gap-10 md:overflow-visible md:px-5"
                aria-label="Telas do app"
              >
                {SCREENS.map((s) => (
                  <li key={s.src} className="flex w-[min(64vw,250px)] flex-none snap-center flex-col items-center md:w-[260px]">
                    <Phone src={s.src} alt={s.alt} className="w-full" />
                    <p className="mt-4 text-center text-[15px] leading-snug font-semibold text-balance text-white/85">{s.caption}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-center text-[13px] text-white/55 md:hidden">Arraste para o lado</p>
            </div>

            <div className="mx-auto mt-14 max-w-[920px] px-5 md:mt-20">
              <h3 className="text-center text-[clamp(22px,4.6vw,30px)] leading-tight font-bold tracking-[-.02em] text-balance text-gold-light">
                Tudo o que tem dentro do manual
              </h3>
              {/* Cards dos módulos: entram em sequência (data-stagger, ver .lp-motion no CSS). */}
              <ol data-stagger className="mt-7 grid gap-2.5 md:grid-flow-col md:grid-cols-2 md:grid-rows-6 md:gap-x-4">
                {MODULES.map((m, i) => (
                  <li
                    key={m.id}
                    style={{ '--d': `${i * 60}ms` } as React.CSSProperties}
                    className="flex items-center gap-3.5 rounded-[18px] border border-white/[0.12] bg-white/[0.06] p-2.5 pr-4 md:gap-4 md:hover:border-white/[0.24]"
                  >
                    <img
                      src={`/lp/modulos/modulo-${String(m.id).padStart(2, '0')}.webp`}
                      alt=""
                      width={72}
                      height={72}
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 flex-none rounded-[14px] object-cover md:h-[72px] md:w-[72px]"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block font-display text-[19px] leading-none font-medium text-gold">
                        {String(m.id).padStart(2, '0')}
                      </span>
                      <span className="mt-1 block text-[16px] leading-snug font-semibold text-white">{m.title}</span>
                      <span className="mt-0.5 block text-[13px] text-white/60">
                        {m.lessons} lições · {m.minutes} min
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 3b. BÔNUS -------------------------------------------------------------------------- */}
        <section data-track="bonus" className="bg-plum">
          <div className="mx-auto max-w-[880px] px-5 pb-20 md:pb-28">
            <h2 data-reveal className="text-center text-[clamp(30px,6.4vw,46px)] leading-[1.1] font-extrabold tracking-[-.025em] text-white">
              E ainda leva <span className="font-display text-[1.55em] font-medium tracking-normal text-rose">2</span> bônus
            </h2>
            <ul data-reveal className="mt-10 grid gap-5 md:mt-14 md:grid-cols-2 md:gap-6">
              {BONUSES.map((b) => (
                <li key={b.tag} className="overflow-hidden rounded-[28px] border border-white/[0.14] bg-night shadow-[0_20px_40px_rgba(20,6,16,.25)]">
                  <div className="pointer-events-none relative m-3 mb-0 h-[260px] overflow-hidden rounded-[20px] select-none">
                    <img
                      src={b.src}
                      alt={b.alt}
                      width={390}
                      height={844}
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full object-cover object-top"
                    />
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-night to-night/0" />
                  </div>
                  <div className="px-6 pt-3 pb-7 md:px-7">
                    <span className="inline-block rounded-full border border-gold/45 bg-gold/15 px-3 py-1 text-[13px] font-bold text-gold-light">
                      {b.tag}
                    </span>
                    <h3 className="mt-3 text-[20px] leading-tight font-bold text-balance text-white">{b.title}</h3>
                    <p className="mt-2 text-[15.5px] leading-[1.5] text-pretty text-white/80">{b.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 4. OFERTA -------------------------------------------------------------------------- */}
        <section id="oferta" data-track="oferta" ref={offerRef} className="relative scroll-mt-4 bg-night">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-16 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(224,122,155,.24), rgba(224,122,155,0))' }}
          />
          <div data-reveal className="relative mx-auto max-w-[480px] px-5 py-20 md:py-28">
            <div className="overflow-hidden rounded-[32px] bg-blush text-ink shadow-[0_30px_60px_rgba(20,6,16,.45)]">
              <img
                src="/lp/livro-titulo.webp"
                alt="Capa do Manual da Lash Designer"
                width={640}
                height={640}
                loading="lazy"
                className="block aspect-[16/10] w-full object-cover object-[50%_60%] md:aspect-[4/3]"
              />
              <div className="flex flex-col p-7 pt-6 md:p-9 md:pt-7">
                <h2 className="text-[26px] leading-tight font-extrabold tracking-[-.02em] text-plum">Manual da Lash Designer</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {INCLUDED.map((t) => (
                    <li key={t} className="flex gap-3 text-[16px] leading-[1.4] text-[#4A3A42]">
                      <span className="mt-0.5 flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full bg-gold text-white">
                        <Icon d={CHECK} size={14} strokeWidth={3} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex items-end gap-3 border-t border-plum/10 pt-6">
                  <span className="font-display text-[64px] leading-[.85] font-medium text-plum">
                    <span className="mr-1 align-top font-sans text-[22px] font-bold">R$</span>27
                  </span>
                  <span className="pb-1 text-[15px] leading-snug text-[#6B5C66]">
                    pagamento único,
                    <br />
                    sem mensalidade
                  </span>
                </div>
                <BuyButton pulse position="oferta" btnRef={offerBtnRef} className="mt-6 w-full !shadow-[0_14px_30px_rgba(91,42,78,.3)]">
                  Quero o meu manual
                </BuyButton>
                <p className="mt-4 text-center text-[15px] font-semibold text-balance text-plum">Uma única manutenção paga esse manual.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. GARANTIA + PERGUNTAS ------------------------------------------------------------ */}
        <section className="bg-plum">
          <div className="mx-auto flex max-w-[760px] flex-col gap-16 px-5 py-20 md:py-28">
            <div data-reveal data-track="garantia" className="flex flex-col items-center gap-5 text-center">
              <img
                src="/lp/selo-garantia.webp"
                alt="Selo de garantia de 7 dias"
                width={724}
                height={410}
                loading="lazy"
                decoding="async"
                className="lp-seal-mask block h-auto w-[280px] md:w-[340px]"
              />
              <div className="max-w-[600px]">
                <h2 className="text-[clamp(26px,5vw,32px)] leading-tight font-extrabold tracking-[-.02em] text-white">Garantia de 7 dias</h2>
                <p className="mt-2 text-[16.5px] leading-[1.55] text-pretty text-white/80">
                  Entre, leia, use. Se em até 7 dias você achar que o manual não é para você, devolvemos 100% do valor. Sem
                  perguntas.
                </p>
              </div>
            </div>

            <div data-reveal data-track="perguntas">
              <h2 className="text-center text-[clamp(26px,5vw,34px)] font-extrabold tracking-[-.02em] text-white">Perguntas frequentes</h2>
              <div className="mt-7 flex flex-col gap-2.5">
                {FAQ.map(([q, a], i) => {
                  const isOpen = open === i
                  return (
                    <div key={q} className="rounded-[22px] border border-white/[0.12] bg-white/[0.06]">
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`faq-${i}`}
                          onClick={() => {
                            if (!isOpen) track('lp_faq_opened', { question: q })
                            setOpen(isOpen ? -1 : i)
                          }}
                          className="flex min-h-[60px] w-full cursor-pointer items-center justify-between gap-3 px-5 py-4 text-left text-[17px] font-semibold text-white"
                        >
                          {q}
                          <Icon
                            d="M6 9l6 6 6-6"
                            size={20}
                            strokeWidth={2.4}
                            className={`flex-none text-rose transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </h3>
                      <div id={`faq-${i}`} hidden={!isOpen} className="px-5 pb-5 text-[16px] leading-[1.6] text-pretty text-white/80">
                        {a}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 6. CHAMADA FINAL ------------------------------------------------------------------- */}
        <section data-track="chamada_final" className="relative overflow-hidden bg-night">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-180px] left-1/2 h-[420px] w-[760px] -translate-x-1/2 rounded-full"
            style={{ background: 'radial-gradient(closest-side, rgba(224,122,155,.2), rgba(224,122,155,0))' }}
          />
          <div data-reveal className="relative mx-auto flex max-w-[760px] flex-col items-center px-5 py-20 text-center md:py-28">
            <h2 className="text-[clamp(28px,6vw,44px)] leading-[1.12] font-extrabold tracking-[-.025em] text-balance text-white">
              O manual que você queria ter recebido está a um clique.
            </h2>
            <BuyButton pulse position="final" btnRef={finalBtnRef} className="mt-8 w-full max-w-[340px] md:w-auto">
              Quero o meu manual
            </BuyButton>
            <p className="mt-3 text-[13px] text-white/70 md:text-[14px]">R$ 27 · acesso imediato · garantia de 7 dias</p>
          </div>
        </section>
      </main>

      {/* RODAPÉ ----------------------------------------------------------------------------- */}
      <footer className="border-t border-white/10 bg-[#3d1b35] pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-1 px-5 py-9 text-center text-[14px] text-white/65 md:flex-row md:justify-center md:gap-2">
          <span className="font-semibold text-white">Manual da Lash Designer</span>
          <span aria-hidden="true" className="hidden md:inline">·</span>
          <nav aria-label="Rodapé" className="flex flex-wrap items-center justify-center gap-x-1 font-semibold [&_a]:inline-flex [&_a]:min-h-11 [&_a]:items-center [&_a]:px-1.5 [&_a]:text-white/85 [&_a]:no-underline [&_a:hover]:text-white [&_a:hover]:underline">
            <a href="/termos">Termos</a>
            <span aria-hidden="true">·</span>
            <a href="/privacidade">Privacidade</a>
            <span aria-hidden="true">·</span>
            <a href={`mailto:${SUPPORT_EMAIL}`}>Suporte</a>
          </nav>
        </div>
      </footer>

      {/* BARRA FIXA (celular) ------------------------------------------------------------------ */}
      <div
        inert={!showBar}
        className={`lp-sticky fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-white/10 bg-night/95 px-4 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden ${showBar ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}
      >
        <div className="min-w-0 text-[15px] leading-tight font-bold text-white">
          Manual da Lash Designer
          <span className="block text-[14px] font-semibold text-gold-light">R$ 27</span>
        </div>
        <BuyButton position="barra" className="!h-12 flex-none !px-6 !text-[16px] !shadow-none">Quero o meu</BuyButton>
      </div>
    </div>
  )
}
