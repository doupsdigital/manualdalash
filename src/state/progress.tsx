// Progresso da leitura: lições concluídas, checklist marcado, última lição vista e tamanho do texto.
// Fica salvo no navegador e, quando logada, também no banco (sincronização em state/sync.ts).
// O tamanho do texto é só preferência do aparelho: nunca sincroniza.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'manual-lash:progress:v1'

export type FontSize = 0 | 1 | 2
export const FONT_SIZES_PX: Record<FontSize, number> = { 0: 16, 1: 17, 2: 19 }

export interface ProgressSnapshot {
  lessons: Record<string, string> // id da lição -> data de conclusão (ISO)
  checklist: Record<string, boolean>
  lastLesson: string | null
  updatedAt: string
}

interface ProgressData extends ProgressSnapshot {
  fontSize: FontSize
}

const EMPTY: ProgressData = {
  lessons: {},
  checklist: {},
  lastLesson: null,
  updatedAt: new Date(0).toISOString(),
  fontSize: 0,
}

function load(): ProgressData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY
    return { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    return EMPTY
  }
}

function save(data: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // sem espaço ou sem acesso ao storage: segue só em memória
  }
}

interface ProgressStore {
  isLessonDone: (id: string) => boolean
  doneCount: number
  markLessonDone: (id: string) => void
  lastLesson: string | null
  setLastLesson: (id: string) => void
  isChecked: (key: string) => boolean
  toggleCheck: (key: string) => void
  checkedCount: number
  clearChecklist: () => void
  fontSize: FontSize
  cycleFontSize: () => void
  /** Para a sincronização (state/sync.ts): o que sincroniza, sem o tamanho do texto. */
  snapshot: () => ProgressSnapshot
  /** Aplica o resultado já mesclado (local ∪ banco) de volta ao estado local. */
  applyMerge: (merged: ProgressSnapshot) => void
}

const ProgressContext = createContext<ProgressStore | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(load)

  useEffect(() => save(data), [data])

  const touch = <T extends Partial<ProgressData>>(patch: T) => ({ ...patch, updatedAt: new Date().toISOString() })

  const markLessonDone = useCallback((id: string) => {
    setData((d) => (d.lessons[id] ? d : { ...d, ...touch({ lessons: { ...d.lessons, [id]: new Date().toISOString() } }) }))
  }, [])

  const setLastLesson = useCallback((id: string) => {
    setData((d) => ({ ...d, ...touch({ lastLesson: id }) }))
  }, [])

  const toggleCheck = useCallback((key: string) => {
    setData((d) => ({ ...d, ...touch({ checklist: { ...d.checklist, [key]: !d.checklist[key] } }) }))
  }, [])

  const clearChecklist = useCallback(() => {
    setData((d) => ({ ...d, ...touch({ checklist: {} }) }))
  }, [])

  const cycleFontSize = useCallback(() => {
    setData((d) => ({ ...d, fontSize: (((d.fontSize + 1) % 3) as FontSize) }))
  }, [])

  const snapshot = useCallback(
    (): ProgressSnapshot => ({
      lessons: data.lessons,
      checklist: data.checklist,
      lastLesson: data.lastLesson,
      updatedAt: data.updatedAt,
    }),
    [data],
  )

  const applyMerge = useCallback((merged: ProgressSnapshot) => {
    setData((d) => ({ ...d, ...merged }))
  }, [])

  const value: ProgressStore = {
    isLessonDone: (id) => !!data.lessons[id],
    doneCount: Object.keys(data.lessons).length,
    markLessonDone,
    lastLesson: data.lastLesson,
    setLastLesson,
    isChecked: (key) => !!data.checklist[key],
    toggleCheck,
    checkedCount: Object.values(data.checklist).filter(Boolean).length,
    clearChecklist,
    fontSize: data.fontSize,
    cycleFontSize,
    snapshot,
    applyMerge,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const p = useContext(ProgressContext)
  if (!p) throw new Error('useProgress precisa estar dentro de ProgressProvider')
  return p
}
