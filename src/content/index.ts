import manualJson from './manual.json'
import type { Manual, LessonWithModule } from './types'

export const manual = manualJson as unknown as Manual

export const modules = manual.modules
export const checklistBonus = manual.bonuses[0]
export const guideBonus = manual.bonuses[1]

/** Todas as lições, na ordem do manual, cada uma com o módulo a que pertence. */
export const allLessons: LessonWithModule[] = modules.flatMap((module) =>
  module.lessons.map((lesson) => ({ ...lesson, module })),
)

export const totalLessons = allLessons.length

export function getModule(id: number) {
  return modules.find((m) => m.id === id)
}

export function getLesson(id: string) {
  return allLessons.find((l) => l.id === id)
}

export function moduleCoverUrl(moduleId: number) {
  return `/modulos/modulo-${String(moduleId).padStart(2, '0')}.webp`
}

/** Checklist key estável: `${sectionIndex}-${itemIndex}`. */
export function checklistKey(sectionIndex: number, itemIndex: number) {
  return `${sectionIndex}-${itemIndex}`
}

export const checklistTotal = checklistBonus.sections.reduce((acc, s) => acc + s.items.length, 0)
