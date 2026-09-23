// Oyuncu ve taraf isimleri (0 her zaman sen, diğerleri bilgisayar)
import type { GameState } from './engine'

export const HUMAN = 0

export function playerNames(s: GameState): string[] {
  if (s.playerCount === 2) return ['Sen', 'Bilgisayar']
  if (s.teams) return ['Sen', 'Sağdaki Rakip', 'Ortağın', 'Soldaki Rakip']
  return ['Sen', 'Bilgisayar 1', 'Bilgisayar 2', 'Bilgisayar 3'].slice(0, s.playerCount)
}

/** Skor tablosundaki taraflar: eşli oyunda takımlar, tekli oyunda oyuncular */
export function sideNames(s: GameState): string[] {
  return s.teams ? ['Biz', 'Onlar'] : playerNames(s)
}

/** Üst çubuktaki kısa isimler */
export function sideShortNames(s: GameState): string[] {
  if (s.teams) return ['Biz', 'Onlar']
  if (s.playerCount === 2) return ['Sen', 'Bilgisayar']
  return ['Sen', 'B1', 'B2', 'B3'].slice(0, s.playerCount)
}

/** Menüdeki açıklama: "3 kişi", "4 kişi eşli" gibi */
export function modeLabel(s: GameState): string {
  return s.teams ? '4 kişi eşli' : `${s.playerCount} kişi`
}
