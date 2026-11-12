// Links externos editáveis sem precisar tocar nas telas.
export const SUPPORT_EMAIL = 'suporte@manualdalash.com.br'

/** Link de checkout de cada extra (order bump). Vazio até serem cadastrados na Kiwify. */
export const EXTRAS_CHECKOUT_URLS: Record<'mensagens' | 'tabela-precos', string> = {
  mensagens: '',
  'tabela-precos': '',
}

export interface ForYouProduct {
  key: string
  name: string
  description: string
  price: string | null
  url: string
  gradient: [string, string]
  tileBg: string
  tileInk: string
  icon: string // path d dos ícones (24x24)
}

/** Vitrine de "Para você" — sem URL, o card não aparece. */
export const FOR_YOU_PRODUCTS: ForYouProduct[] = [
  {
    key: 'lashbox',
    name: 'LashBox',
    description: 'Artes, mensagens e vale-presentes prontos para o seu dia a dia',
    price: 'R$ 22,90/mês',
    url: 'https://lashbox.app/lp',
    gradient: ['#5B2A4E', '#E07A9B'],
    tileBg: '#FBE8EE',
    tileInk: '#E07A9B',
    icon: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  },
  {
    key: 'agenda-lotada',
    name: 'Agenda Lotada',
    description: '21 missões para conquistar clientes',
    price: 'R$ 37',
    url: 'https://www.agendalotada.com',
    gradient: ['#7A3A66', '#C9A15B'],
    tileBg: '#F6EBD3',
    tileInk: '#8A6A24',
    icon: 'M5 5h14v15H5zM5 10h14M9 3v4M15 3v4',
  },
  {
    key: 'studiomenu',
    name: 'StudioMenu',
    description: 'Seu catálogo de serviços online',
    price: null,
    url: '',
    gradient: ['#8A3F6F', '#5B2A4E'],
    tileBg: '#EDE1EA',
    tileInk: '#5B2A4E',
    icon: 'M5 6h14M5 12h14M5 18h9',
  },
]
