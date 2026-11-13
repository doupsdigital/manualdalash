// Paletas e ajuste de fonte da Tabela de Valores, portados do motor de artes do LashBox
// (../lashbox/src/lib/artPalettes.ts), simplificado para um único tipo de arte.

export type PaletteId = 'rosa' | 'nude' | 'preto'

export const PALETTES: Record<PaletteId, { label: string; bg: string; fg: string; acc: string; swatch: string; pb: number }> = {
  rosa: { label: 'Rosa', bg: '#FBE4EB', fg: '#5B2A4E', acc: '#E07A9B', swatch: '#E07A9B', pb: 0.8 },
  nude: { label: 'Nude e dourado', bg: '#EFDFD0', fg: '#4A3426', acc: '#B08840', swatch: '#D9BFA3', pb: 0.85 },
  preto: { label: 'Preto e dourado', bg: '#0E0C0B', fg: '#D8B572', acc: '#D8B572', swatch: '#1A1614', pb: 1 },
}

/** O board sempre tem 1080px de largura; 1cqw do protótipo original = 1% disso = 10.8px. */
export const CQW = 10.8

/** Tamanho de fonte (px) que diminui conforme o texto cresce, nunca passando do tamanho base. */
export function fit2(len: number, table: [number, number][], k: number) {
  for (const [max, size] of table) {
    if (len <= max) return Math.round(size * k * CQW)
  }
  return Math.round(table[table.length - 1][1] * k * CQW)
}
