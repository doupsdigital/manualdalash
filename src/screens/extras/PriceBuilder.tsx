import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton, Screen } from '../../components/ui'
import { PriceBoard } from '../../components/art/PriceBoard'
import { ScaledBoard } from '../../components/art/ScaledBoard'
import { PALETTES, type PaletteId } from '../../lib/artPalettes'
import { exportNodeToPng, shareOrDownloadPng } from '../../lib/exportBoard'

const STORAGE_KEY = 'manual-lash:tabela-precos:board:v1'

interface BoardState {
  title: string
  rows: [string, string][]
  note: string
  foot1: string
  foot2: string
  palette: PaletteId
  post: boolean
}

const DEFAULT_STATE: BoardState = {
  title: 'Tabela de Valores',
  rows: [
    ['Fio a fio', ''],
    ['Volume brasileiro', ''],
    ['Volume russo', ''],
    ['Manutenção', ''],
  ],
  note: 'Manutenção válida até 21 dias.',
  foot1: '',
  foot2: '',
  palette: 'rosa',
  post: false,
}

function load(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_STATE
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_STATE
  }
}

export default function PriceBuilder() {
  const navigate = useNavigate()
  const [state, setState] = useState<BoardState>(load)
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // segue só em memória
    }
  }, [state])

  const updateRow = (i: number, col: 0 | 1, value: string) => {
    setState((s) => ({ ...s, rows: s.rows.map((r, idx) => (idx === i ? ([col === 0 ? value : r[0], col === 1 ? value : r[1]] as [string, string]) : r)) }))
  }
  const addRow = () => setState((s) => (s.rows.length >= 6 ? s : { ...s, rows: [...s.rows, ['', '']] }))
  const removeRow = (i: number) => setState((s) => ({ ...s, rows: s.rows.filter((_, idx) => idx !== i) }))

  const width = 1080
  const height = state.post ? 1350 : 1920
  const previewScale = 300 / width

  const canExport = state.rows.some((r) => r[0].trim() && r[1].trim())

  const onExport = async () => {
    if (!canExport || !exportRef.current) return
    setExporting(true)
    try {
      const blob = await exportNodeToPng(exportRef.current, width, height)
      await shareOrDownloadPng(blob, 'tabela-de-precos.png')
    } catch (e) {
      console.error('export tabela', e)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Screen className="px-5 pt-12 pb-10">
      <BackButton onClick={() => navigate('/bonus/tabela-precos')} label="Tabela de Preços" />
      <div className="mt-5 text-[24px] font-bold leading-[1.15] tracking-tight">Monte sua tabela</div>
      <div className="mt-2 text-[14px] leading-[1.5] text-white/85">
        Preencha os seus valores, escolha a paleta e baixe a imagem prontinha para postar.
      </div>

      <div className="mt-5 flex justify-center">
        <ScaledBoard width={width} height={height} scale={previewScale}>
          <PriceBoard palette={state.palette} post={state.post} title={state.title} rows={state.rows} note={state.note} foot1={state.foot1} foot2={state.foot2} />
        </ScaledBoard>
      </div>

      <div className="mt-5 flex justify-center gap-6">
        {(Object.keys(PALETTES) as PaletteId[]).map((id) => (
          <button key={id} onClick={() => setState((s) => ({ ...s, palette: id }))} className="flex flex-col items-center gap-1.5">
            <span
              className="block h-9 w-9 rounded-full"
              style={{ background: PALETTES[id].swatch, boxShadow: state.palette === id ? '0 0 0 2.5px #E07A9B' : 'none' }}
            />
            <span className="text-[11px] text-white/60">{PALETTES[id].label}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex rounded-full border border-white/15 bg-white/[0.05] p-1">
        <button
          onClick={() => setState((s) => ({ ...s, post: false }))}
          className={`press h-9 flex-1 rounded-full text-[13px] font-semibold ${!state.post ? 'bg-rose text-white' : 'text-white/70'}`}
        >
          Story
        </button>
        <button
          onClick={() => setState((s) => ({ ...s, post: true }))}
          className={`press h-9 flex-1 rounded-full text-[13px] font-semibold ${state.post ? 'bg-rose text-white' : 'text-white/70'}`}
        >
          Post
        </button>
      </div>

      <label className="mt-5 flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-white/60">Título</span>
        <input
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          className="h-11 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-[15px] text-white outline-none"
        />
      </label>

      <div className="mt-4 flex flex-col gap-2.5 rounded-[20px] border border-white/10 bg-white/[0.05] p-3.5">
        <span className="text-[14px] font-semibold text-white">Seus valores</span>
        {state.rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={r[0]}
              onChange={(e) => updateRow(i, 0, e.target.value)}
              placeholder="Nome"
              className="h-11 min-w-0 flex-1 rounded-[11px] border border-white/15 bg-white/[0.08] px-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <input
              value={r[1]}
              onChange={(e) => updateRow(i, 1, e.target.value)}
              placeholder="R$ 0"
              className="h-11 w-[96px] shrink-0 rounded-[11px] border border-white/15 bg-white/[0.08] px-3 text-sm text-white outline-none placeholder:text-white/40"
            />
            <button onClick={() => removeRow(i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80">
              ×
            </button>
          </div>
        ))}
        {state.rows.length < 6 && (
          <button onClick={addRow} className="press flex h-10 items-center justify-center rounded-full border border-white/20 text-sm font-semibold text-white/85">
            + Adicionar item
          </button>
        )}
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-white/60">Observação (opcional)</span>
        <input
          value={state.note}
          onChange={(e) => setState((s) => ({ ...s, note: e.target.value }))}
          placeholder="Ex.: Manutenção válida até 21 dias."
          className="h-11 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-[15px] text-white outline-none placeholder:text-white/40"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-white/60">Nome do estúdio</span>
          <input
            value={state.foot1}
            onChange={(e) => setState((s) => ({ ...s, foot1: e.target.value }))}
            placeholder="Seu nome"
            className="h-11 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-[15px] text-white outline-none placeholder:text-white/40"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-white/60">Instagram / WhatsApp</span>
          <input
            value={state.foot2}
            onChange={(e) => setState((s) => ({ ...s, foot2: e.target.value }))}
            placeholder="@seuinstagram"
            className="h-11 rounded-xl border border-white/15 bg-white/[0.08] px-3.5 text-[15px] text-white outline-none placeholder:text-white/40"
          />
        </label>
      </div>

      {!canExport && (
        <div className="mt-4 rounded-xl border border-[#C9A15B]/30 bg-[#C9A15B]/15 px-3 py-2.5 text-[13px] text-[#E8C27E]">
          Preencha ao menos um item com nome e preço para baixar a imagem.
        </div>
      )}

      <button
        onClick={onExport}
        disabled={!canExport || exporting}
        className="press mt-5 h-[52px] w-full rounded-full bg-rose text-[15.5px] font-semibold text-white disabled:opacity-50"
      >
        {exporting ? 'Gerando…' : 'Baixar imagem'}
      </button>

      {/* Nó fora da tela, em tamanho real, usado só para a exportação (mesma arte da prévia). */}
      <div style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none' }} aria-hidden="true">
        <div ref={exportRef} style={{ width, height }}>
          <PriceBoard palette={state.palette} post={state.post} title={state.title} rows={state.rows} note={state.note} foot1={state.foot1} foot2={state.foot2} />
        </div>
      </div>
    </Screen>
  )
}
