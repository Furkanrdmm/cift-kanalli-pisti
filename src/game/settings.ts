// Oyuncu ayarları: ses, titreşim, oyun hızı. Telefona kaydedilir.
import { useSyncExternalStore } from 'react'

export type Speed = 'slow' | 'normal' | 'fast'
export type Felt = 'green' | 'burgundy' | 'navy'
export type CardBack = 'red' | 'blue' | 'green' | 'black'

export interface Settings {
  sound: boolean
  volume: number // 0..1
  vibration: boolean
  speed: Speed
  /** Oyuncunun adı (boşsa "Sen") */
  name: string
  felt: Felt
  cardBack: CardBack
}

const KEY = 'cift-kanalli-pisti:ayarlar'
const DEFAULTS: Settings = { sound: true, volume: 0.8, vibration: true, speed: 'normal', name: '', felt: 'green', cardBack: 'red' }

export const FELTS: [Felt, string][] = [
  ['green', 'Yeşil'],
  ['burgundy', 'Bordo'],
  ['navy', 'Lacivert'],
]
export const CARD_BACKS: [CardBack, string][] = [
  ['red', 'Bordo'],
  ['blue', 'Lacivert'],
  ['green', 'Yeşil'],
  ['black', 'Siyah'],
]

/** Masa ve kart arkası rengini sayfaya uygula (CSS bu işaretlere göre renk değiştirir) */
export function applyTheme(s: Settings) {
  document.documentElement.dataset.felt = s.felt
  document.documentElement.dataset.back = s.cardBack
}

/** Animasyon ve bilgisayar bekleme sürelerinin çarpanı */
export const SPEED_FACTOR: Record<Speed, number> = { slow: 1.5, normal: 1, fast: 0.6 }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

let current = load()
const listeners = new Set<() => void>()

export function getSettings(): Settings {
  return current
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // depolama kapalıysa sadece bu oturumda geçerli
  }
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings)
}
