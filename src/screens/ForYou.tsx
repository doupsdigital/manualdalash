import { Screen } from '../components/ui'
import { FOR_YOU_PRODUCTS } from '../lib/config'

export default function ForYou() {
  const products = FOR_YOU_PRODUCTS.filter((p) => p.url)

  return (
    <Screen className="px-5 pt-16 pb-[110px]">
      <div className="text-[30px] font-bold tracking-tight">Mais para o seu trabalho</div>
      <div className="mt-6 flex flex-col gap-4">
        {products.map((p) => (
          <div key={p.key} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.07]">
            <div className="h-14" style={{ background: `linear-gradient(120deg, ${p.gradient[0]}, ${p.gradient[1]})` }} />
            <div className="px-5 pb-5">
              <div
                className="-mt-[21px] -ml-[3px] flex h-[42px] w-[42px] items-center justify-center rounded-2xl border-[3px] border-night box-content"
                style={{ background: p.tileBg, color: p.tileInk }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <path d={p.icon} />
                </svg>
              </div>
              <div className="mt-3 text-[18px] font-bold">{p.name}</div>
              <div className="mt-1 text-[13px] leading-snug text-white/85">{p.description}</div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-[15px] font-bold" style={{ color: '#E8C27E' }}>
                  {p.price ?? ''}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  className="press flex h-12 items-center rounded-full bg-white/10 px-[26px] text-[15.5px] font-semibold text-white"
                >
                  Conhecer
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  )
}
