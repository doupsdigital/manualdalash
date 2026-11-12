// Busca no aparelho: título, intro, blocos, dica, erro comum e resumo, ignorando acentos/maiúsculas.
import { allLessons } from '../content'
import type { LessonWithModule } from '../content/types'

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function lessonText(lesson: LessonWithModule) {
  return [
    lesson.title,
    lesson.intro,
    lesson.tip,
    lesson.mistake,
    lesson.summary,
    ...lesson.blocks.flatMap((b) => [b.heading, b.text, ...(b.steps ?? []), ...(b.items ?? [])]),
  ]
    .filter(Boolean)
    .join(' ')
}

export interface SearchResult {
  lesson: LessonWithModule
  snippet: string
}

/** Recorta um trecho em torno da primeira ocorrência do termo, com o termo destacável pelo chamador. */
function makeSnippet(rawText: string, normalizedQuery: string, radius = 60) {
  const normalizedText = normalize(rawText)
  const at = normalizedText.indexOf(normalizedQuery)
  if (at === -1) return rawText.slice(0, radius * 2)
  const start = Math.max(0, at - radius)
  const end = Math.min(rawText.length, at + normalizedQuery.length + radius)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < rawText.length ? '…' : ''
  return prefix + rawText.slice(start, end).trim() + suffix
}

export function searchLessons(query: string): SearchResult[] {
  const q = query.trim()
  if (q.length < 2) return []
  const nq = normalize(q)
  const results: SearchResult[] = []
  for (const lesson of allLessons) {
    const text = lessonText(lesson)
    if (normalize(text).includes(nq)) {
      results.push({ lesson, snippet: makeSnippet(text, nq) })
    }
    if (results.length >= 20) break
  }
  return results
}

export { normalize }
