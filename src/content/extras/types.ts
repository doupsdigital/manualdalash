export interface MessageItem {
  id: string
  category: string
  title: string
  text: string
}

export interface MensagensExtra {
  key: 'mensagens'
  title: string
  subtitle: string
  intro: string
  howTo: string[]
  messages: MessageItem[]
}

export interface PriceSection {
  heading: string
  text?: string
  steps?: string[]
  items?: string[]
  rows?: { label: string; text: string }[]
}

export interface TabelaPrecosExtra {
  key: 'tabela-precos'
  title: string
  subtitle: string
  intro: string
  sections: PriceSection[]
}
