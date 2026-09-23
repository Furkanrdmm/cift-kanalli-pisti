// Oyuncu ve taraf isimleri (0 her zaman sen, diğerleri bilgisayar)
import type { GameState } from './engine'
import { getSettings } from './settings'

export const HUMAN = 0

/** Ayarlardaki ad, boşsa "Sen" */
export function myName(): string {
  return getSettings().name.trim() || 'Sen'
}

/** Dar yerler için kısaltılmış ad */
const short = (n: string, max = 8) => (n.length > max ? n.slice(0, max - 1) + '…' : n)

export function playerNames(s: GameState): string[] {
  const me = myName()
  if (s.playerCount === 2) return [me, 'Bilgisayar']
  if (s.teams) return [me, 'Sağdaki Rakip', 'Ortağın', 'Soldaki Rakip']
  return [me, 'Bilgisayar 1', 'Bilgisayar 2', 'Bilgisayar 3'].slice(0, s.playerCount)
}

/** Skor tablosundaki taraflar: eşli oyunda takımlar, tekli oyunda oyuncular */
export function sideNames(s: GameState): string[] {
  return s.teams ? ['Biz', 'Onlar'] : playerNames(s)
}

/** Üst çubuktaki kısa isimler */
export function sideShortNames(s: GameState): string[] {
  if (s.teams) return ['Biz', 'Onlar']
  const me = short(myName())
  if (s.playerCount === 2) return [me, 'Bilgisayar']
  return [me, 'B1', 'B2', 'B3'].slice(0, s.playerCount)
}

/** Menüdeki açıklama: "3 kişi", "4 kişi eşli" gibi */
export function modeLabel(s: GameState): string {
  return s.teams ? '4 kişi eşli' : `${s.playerCount} kişi`
}
