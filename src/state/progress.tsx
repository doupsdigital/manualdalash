// Progresso da leitura: lições concluídas, checklist marcado, última lição vista e tamanho do texto.
// Nesta etapa fica só no navegador; a sincronização com o Supabase entra na etapa 3 (ver CLAUDE.md).
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 'manual-lash:progress:v1'

export type FontSize = 0 | 1 | 2
export const FONT_SIZES_PX: Record<FontSize, number> = { 0: 16, 1: 17, 2: 19 }

interface ProgressData {
  lessons: Record<string, string> // id da lição -> data de conclusão (ISO)
  checklist: Record<string, boolean>
  lastLesson: string | null
  fontSize: FontSize
}

const EMPTY: ProgressData = { lessons: {}, checklist: {}, lastLesson: null, fontSize: 0 }

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
}

const ProgressContext = createContext<ProgressStore | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProgressData>(load)

  useEffect(() => save(data), [data])

  const markLessonDone = useCallback((id: string) => {
    setData((d) => (d.lessons[id] ? d : { ...d, lessons: { ...d.lessons, [id]: new Date().toISOString() } }))
  }, [])

  const setLastLesson = useCallback((id: string) => {
    setData((d) => ({ ...d, lastLesson: id }))
  }, [])

  const toggleCheck = useCallback((key: string) => {
    setData((d) => ({ ...d, checklist: { ...d.checklist, [key]: !d.checklist[key] } }))
  }, [])

  const clearChecklist = useCallback(() => {
    setData((d) => ({ ...d, checklist: {} }))
  }, [])

  const cycleFontSize = useCallback(() => {
    setData((d) => ({ ...d, fontSize: (((d.fontSize + 1) % 3) as FontSize) }))
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
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const p = useContext(ProgressContext)
  if (!p) throw new Error('useProgress precisa estar dentro de ProgressProvider')
  return p
}
