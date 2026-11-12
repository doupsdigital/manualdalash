// Quais extras (mensagens, tabela de preços) a cliente já comprou, via rpc('my_products').
// No modo local (sem Supabase), tudo fica bloqueado, para testar a tela como uma compradora nova.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'

export type ExtraKey = 'mensagens' | 'tabela-precos'

interface PurchasesStore {
  isUnlocked: (key: ExtraKey) => boolean
  /** Confere de novo no banco (botão "Já comprei, atualizar"). */
  refresh: () => Promise<void>
  loading: boolean
}

const PurchasesContext = createContext<PurchasesStore | null>(null)

export function PurchasesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase || status !== 'ready') return
    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('my_products')
      if (error) throw error
      setUnlocked(new Set((data ?? []) as string[]))
    } catch (e) {
      console.warn('my_products', e)
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (status === 'ready') refresh()
    else setUnlocked(new Set())
  }, [status, refresh])

  return (
    <PurchasesContext.Provider value={{ isUnlocked: (key) => unlocked.has(key), refresh, loading }}>
      {children}
    </PurchasesContext.Provider>
  )
}

export function usePurchases() {
  const s = useContext(PurchasesContext)
  if (!s) throw new Error('usePurchases precisa estar dentro de PurchasesProvider')
  return s
}
