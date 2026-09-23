// Oyun sesleri: dosya kullanmadan telefonda anlık üretilir (Web Audio)
import { getSettings } from './settings'

let ctx: AudioContext | null = null
let noiseBuf: AudioBuffer | null = null

function audio(): AudioContext | null {
  if (!getSettings().sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Tarayıcılar sesi ancak bir dokunuştan sonra açar: ilk dokunuşta hazırla */
export function unlockAudio() {
  const once = () => {
    audio()
    window.removeEventListener('pointerdown', once)
  }
  window.addEventListener('pointerdown', once)
}

function noise(c: AudioContext): AudioBuffer {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

function out(c: AudioContext, gain: number): GainNode {
  const g = c.createGain()
  g.gain.value = gain * getSettings().volume
  g.connect(c.destination)
  return g
}

type NoiseOpts = { filter: BiquadFilterType; freq: number; freqEnd?: number; q?: number; gain: number; attack?: number }

/** Filtrelenmiş hışırtı: kart kayması, çarpma, alkış */
function hiss(c: AudioContext, at: number, dur: number, o: NoiseOpts) {
  const src = c.createBufferSource()
  src.buffer = noise(c)
  const f = c.createBiquadFilter()
  f.type = o.filter
  f.frequency.setValueAtTime(o.freq, at)
  if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, at + dur)
  f.Q.value = o.q ?? 1
  const env = c.createGain()
  const attack = o.attack ?? 0.004
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(1, at + attack)
  env.gain.exponentialRampToValueAtTime(0.001, at + dur)
  src.connect(f).connect(env).connect(out(c, o.gain))
  src.start(at, Math.random() * 0.5)
  src.stop(at + dur + 0.02)
}

type ToneOpts = { type?: OscillatorType; gain: number; attack?: number; freqEnd?: number; detune?: number }

/** Tek nota */
function tone(c: AudioContext, at: number, freq: number, dur: number, o: ToneOpts) {
  const osc = c.createOscillator()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, at)
  if (o.freqEnd) osc.frequency.exponentialRampToValueAtTime(o.freqEnd, at + dur)
  if (o.detune) osc.detune.value = o.detune
  const env = c.createGain()
  const attack = o.attack ?? 0.01
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(1, at + attack)
  env.gain.exponentialRampToValueAtTime(0.001, at + dur)
  osc.connect(env).connect(out(c, o.gain))
  osc.start(at)
  osc.stop(at + dur + 0.02)
}

/** Çan sesi: kanal piştisi için */
function bell(c: AudioContext, at: number, freq: number, gain: number) {
  tone(c, at, freq, 0.9, { gain, attack: 0.003 })
  tone(c, at, freq * 2.76, 0.5, { gain: gain * 0.35, attack: 0.003 })
  tone(c, at, freq * 5.4, 0.25, { gain: gain * 0.15, attack: 0.003 })
}

const clap = (c: AudioContext, at: number, gain = 0.35) => hiss(c, at, 0.12, { filter: 'bandpass', freq: 1400, q: 0.8, gain })

// Nota frekansları
const N = { C5: 523, E5: 659, G5: 784, A5: 880, C6: 1047, D6: 1175, E6: 1319, G6: 1568, A6: 1760, C7: 2093, A3: 220, C4: 262, Eb4: 311, G4: 392 }

export const sfx = {
  /** Kart elden çıkar */
  play() {
    const c = audio()
    if (!c) return
    hiss(c, c.currentTime, 0.09, { filter: 'bandpass', freq: 2600, freqEnd: 1100, q: 1.2, gain: 0.22 })
  },

  /** Kart yere oturur */
  land() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    hiss(c, t, 0.07, { filter: 'lowpass', freq: 2200, gain: 0.45 })
    tone(c, t, 150, 0.06, { gain: 0.12, freqEnd: 90 })
  },

  /** Yerdeki kartlar toplanır */
  collect() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    for (let i = 0; i < 3; i++) hiss(c, t + i * 0.05, 0.1, { filter: 'bandpass', freq: 2000 - i * 250, q: 1, gain: 0.16 })
  },

  /** Kart dağıtma: her kart için kısa bir ses */
  deal(count: number, gapMs: number, durMs: number) {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    for (let i = 0; i < count; i++) {
      const at = t + (i * gapMs + durMs * 0.8) / 1000
      hiss(c, at, 0.05, { filter: 'highpass', freq: 2500, gain: 0.14 })
    }
  },

  /** Normal pişti */
  pisti() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    clap(c, t)
    ;[N.C6, N.E6, N.G6].forEach((f, i) => tone(c, t + i * 0.07, f, 0.2, { type: 'triangle', gain: 0.16 }))
    tone(c, t + 0.21, N.C7, 0.45, { gain: 0.14 })
  },

  /** Vale piştisi: daha büyük, özel fanfar */
  valePisti() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    clap(c, t, 0.4)
    clap(c, t + 0.1, 0.3)
    ;[N.G5, N.C6, N.E6, N.G6].forEach((f, i) => tone(c, t + i * 0.09, f, 0.22, { type: 'triangle', gain: 0.17 }))
    // Uzun akor: iki hafif kaydırılmış ses kalın bir tını verir
    for (const f of [N.C6, N.E6, N.G6, N.C7]) {
      tone(c, t + 0.38, f, 0.9, { type: 'triangle', gain: 0.08, attack: 0.02 })
      tone(c, t + 0.38, f, 0.9, { type: 'sawtooth', gain: 0.02, attack: 0.02, detune: 8 })
    }
    tone(c, t + 0.38, N.C5 / 2, 0.8, { gain: 0.12 })
    clap(c, t + 0.38, 0.35)
  },

  /** Kanal piştisi: çan */
  kanalPisti() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    clap(c, t, 0.25)
    bell(c, t, N.A5, 0.18)
    bell(c, t + 0.13, N.E6, 0.16)
    bell(c, t + 0.26, N.A6, 0.12)
  },

  /** Oyunu / maçı kazandın */
  win() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    ;[N.C5, N.E5, N.G5, N.C6].forEach((f, i) => tone(c, t + i * 0.12, f, 0.3, { type: 'triangle', gain: 0.16 }))
    for (const f of [N.C6, N.E6, N.G6]) tone(c, t + 0.5, f, 0.8, { type: 'triangle', gain: 0.09 })
  },

  /** Oyunu kaybettin */
  lose() {
    const c = audio()
    if (!c) return
    const t = c.currentTime
    ;[N.G4, N.Eb4, N.C4].forEach((f, i) => tone(c, t + i * 0.18, f, 0.35, { type: 'triangle', gain: 0.15 }))
  },

  /** Kart seçme, düğme */
  tick() {
    const c = audio()
    if (!c) return
    hiss(c, c.currentTime, 0.025, { filter: 'highpass', freq: 3500, gain: 0.1 })
  },
}
