// Yarım kalan maçı telefona kaydeder, menüde "Oyuna Devam Et" için
import type { GameState } from './engine'

const KEY = 'cift-kanalli-pisti:kayit'
const VERSION = 2 // kurallar/durum yapısı değişince artır, eski kayıtlar yok sayılır

export interface SavedMatch {
  version: number
  target: number
  wins: number[]
  game: GameState
}

export function loadMatch(): SavedMatch | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as SavedMatch
    return data.version === VERSION ? data : null
  } catch {
    return null
  }
}

export function saveMatch(target: number, wins: number[], game: GameState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: VERSION, target, wins, game }))
  } catch {
    // depolama kapalıysa kaydetmeden devam
  }
}

export function clearMatch() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // yok say
  }
}
