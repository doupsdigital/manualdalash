export interface LessonBlock {
  heading: string
  text?: string
  steps?: string[]
  items?: string[]
}

export interface Lesson {
  id: string
  title: string
  minutes: number
  intro: string
  blocks: LessonBlock[]
  tip?: string
  mistake?: string
  summary?: string
}

export interface Module {
  id: number
  title: string
  subtitle: string
  lessons: Lesson[]
}

export interface ChecklistSection {
  heading: string
  items: string[]
}

export interface ChecklistBonus {
  id: 'bonus-1'
  title: string
  subtitle: string
  intro: string
  sections: ChecklistSection[]
}

export interface GuideRow {
  label: string
  text: string
}

export interface GuideSection {
  heading: string
  rows: GuideRow[]
}

export interface GuideBonus {
  id: 'bonus-2'
  title: string
  subtitle: string
  intro: string
  sections: GuideSection[]
  note: string
}

export interface Manual {
  title: string
  modules: Module[]
  bonuses: [ChecklistBonus, GuideBonus]
}

/** Uma lição com o módulo a que pertence, usada nas listas achatadas (busca, "próxima lição"). */
export interface LessonWithModule extends Lesson {
  module: Module
}
