// Oyuncu istatistikleri: telefona kaydedilir
import { useSyncExternalStore } from 'react'

export interface Stats {
  games: number
  gamesWon: number
  matches: number
  matchesWon: number
  pisti: number // normal pişti (yerde)
  kanalPisti: number
  valePisti: number
  bestScore: number // bir oyunda alınan en yüksek puan
  streak: number // şu anki maç galibiyet serisi
  bestStreak: number
}

const KEY = 'cift-kanalli-pisti:istatistik'
const EMPTY: Stats = { games: 0, gamesWon: 0, matches: 0, matchesWon: 0, pisti: 0, kanalPisti: 0, valePisti: 0, bestScore: 0, streak: 0, bestStreak: 0 }

function load(): Stats {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY
  } catch {
    return EMPTY
  }
}

let current = load()
const listeners = new Set<() => void>()

function update(f: (s: Stats) => Stats) {
  current = f(current)
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // depolama kapalıysa kaydetmeden devam
  }
  listeners.forEach((l) => l())
}

/** Senin yaptığın pişti (vale piştisi kanalda da olsa vale sayılır) */
export function recordPisti(kind: 'pisti' | 'kanal' | 'vale') {
  update((s) => ({ ...s, pisti: s.pisti + (kind === 'pisti' ? 1 : 0), kanalPisti: s.kanalPisti + (kind === 'kanal' ? 1 : 0), valePisti: s.valePisti + (kind === 'vale' ? 1 : 0) }))
}

export function recordGame(won: boolean, myScore: number) {
  update((s) => ({ ...s, games: s.games + 1, gamesWon: s.gamesWon + (won ? 1 : 0), bestScore: Math.max(s.bestScore, myScore) }))
}

export function recordMatch(won: boolean) {
  update((s) => {
    const streak = won ? s.streak + 1 : 0
    return { ...s, matches: s.matches + 1, matchesWon: s.matchesWon + (won ? 1 : 0), streak, bestStreak: Math.max(s.bestStreak, streak) }
  })
}

export function resetStats() {
  update(() => EMPTY)
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useStats(): Stats {
  return useSyncExternalStore(subscribe, () => current)
}
