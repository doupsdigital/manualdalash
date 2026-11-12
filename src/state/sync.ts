// Sincroniza o progresso local com o Supabase.
// Regra: lições concluídas somam (união, mantendo a data mais antiga); checklist e última
// lição vista vêm inteiros de quem foi atualizado por último (local ou banco).
import { supabase } from '../lib/supabase'
import type { ProgressSnapshot } from './progress'

async function pull(userId: string): Promise<ProgressSnapshot | null> {
  const { data, error } = await supabase!
    .from('progress')
    .select('lessons, checklist, last_lesson, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    lessons: (data.lessons as Record<string, string>) ?? {},
    checklist: (data.checklist as Record<string, boolean>) ?? {},
    lastLesson: data.last_lesson,
    updatedAt: data.updated_at,
  }
}

export async function push(userId: string, snap: ProgressSnapshot) {
  const { error } = await supabase!.from('progress').upsert({
    user_id: userId,
    lessons: snap.lessons,
    checklist: snap.checklist,
    last_lesson: snap.lastLesson,
    updated_at: snap.updatedAt,
  })
  if (error) throw error
}

export function merge(local: ProgressSnapshot, remote: ProgressSnapshot | null): ProgressSnapshot {
  if (!remote) return local
  const lessons: Record<string, string> = { ...local.lessons }
  for (const [id, remoteDate] of Object.entries(remote.lessons)) {
    const localDate = lessons[id]
    lessons[id] = !localDate || remoteDate < localDate ? remoteDate : localDate
  }
  const remoteIsNewer = remote.updatedAt > local.updatedAt
  return {
    lessons,
    checklist: remoteIsNewer ? remote.checklist : local.checklist,
    lastLesson: remoteIsNewer ? remote.lastLesson : local.lastLesson,
    updatedAt: new Date().toISOString(),
  }
}

/** Executado a cada login: baixa do banco, junta com o local e sobe o resultado. */
export async function syncAll(userId: string, local: ProgressSnapshot): Promise<ProgressSnapshot> {
  const remote = await pull(userId)
  const merged = merge(local, remote)
  await push(userId, merged)
  return merged
}
