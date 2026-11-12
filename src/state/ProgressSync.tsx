// Componente sem interface: liga o progresso local ao Supabase.
// No login, junta local + banco (syncAll); depois disso, sobe cada mudança 400ms depois dela acontecer.
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'
import { useProgress } from './progress'
import { push, syncAll } from './sync'

export function ProgressSync() {
  const { status, user } = useAuth()
  const { snapshot, applyMerge } = useProgress()
  const readyToPush = useRef(false)

  useEffect(() => {
    readyToPush.current = false
    if (status !== 'ready' || !user || !supabase) return
    let cancelled = false
    syncAll(user.id, snapshot())
      .then((merged) => {
        if (cancelled) return
        applyMerge(merged)
        readyToPush.current = true
      })
      .catch((e) => console.warn('syncAll', e))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id])

  const updatedAt = snapshot().updatedAt
  useEffect(() => {
    if (status !== 'ready' || !user || !supabase || !readyToPush.current) return
    const timer = window.setTimeout(() => {
      push(user.id, snapshot()).catch((e) => console.warn('push progress', e))
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.id, updatedAt])

  return null
}
