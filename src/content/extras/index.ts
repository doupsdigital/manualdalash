import mensagensJson from './mensagens.json'
import tabelaPrecosJson from './tabela-precos.json'
import type { MensagensExtra, TabelaPrecosExtra } from './types'

export const mensagensExtra = mensagensJson as MensagensExtra
export const tabelaPrecosExtra = tabelaPrecosJson as TabelaPrecosExtra

/** Categorias na ordem em que aparecem no conteúdo (não alfabética). */
export const mensagensCategorias: string[] = Array.from(new Set(mensagensExtra.messages.map((m) => m.category)))
