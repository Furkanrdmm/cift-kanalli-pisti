// Uçan kart animasyonları: masanın üstünde ayrı bir katmanda kartları bir yerden başka yere kaydırır
import type { CSSProperties } from 'react'
import type { Card } from '../game/engine'
import { SPEED_FACTOR, getSettings } from '../game/settings'
import { PlayingCard } from './PlayingCard'

/** Animasyon süreleri (ms), ayarlardaki oyun hızına göre */
export function timings() {
  const k = SPEED_FACTOR[getSettings().speed]
  const ms = (n: number) => Math.round(n * k)
  return {
    move: ms(320), // elden yere
    capturePause: ms(260), // alınan kartlar toplanmadan önce kısa bekleme
    collect: ms(420), // yerden oyuncuya
    deal: ms(320), // desteden ele
    dealGap: ms(70), // dağıtılan kartlar arası
    bot: ms(700), // bilgisayarın düşünme süresi
  }
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface Flyer {
  key: string
  card: Card | null
  faceDown: boolean
  /** Kartın katmandaki yeri: "in" için varış, "out" için çıkış kutusu */
  box: Box
  dir: 'in' | 'out'
  dx: number
  dy: number
  scale: number
  r0: number
  r1: number
  ms: number
  delay: number
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
/** React'in yeni durumu ekrana çizmesini bekle */
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

export function boxOf(el: Element | null | undefined, root: Element): Box | null {
  if (!el) return null
  const r = el.getBoundingClientRect()
  const o = root.getBoundingClientRect()
  return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height }
}

const cx = (b: Box) => b.x + b.w / 2
const cy = (b: Box) => b.y + b.h / 2

/** Kutu içinde ortalanmış kart boyutunda kutu */
export function centered(slot: Box, card: { w: number; h: number }, ox = 0, oy = 0): Box {
  return { x: cx(slot) - card.w / 2 + ox, y: cy(slot) - card.h / 2 + oy, w: card.w, h: card.h }
}

/** Yerdeki kartların hafif dağınık duruşu (Game ekranındaki çizimle aynı) */
export const pileRotation = (idx: number) => ((idx * 37) % 17) - 8

export function pileCardBox(slot: Box, card: { w: number; h: number }, idx: number, i: number) {
  return { box: centered(slot, card, i * 3, i * 2), rot: pileRotation(idx) }
}

type Opts = { r0?: number; r1?: number; ms: number; delay?: number }

/** from'dan to'ya uçup to'da duran kart */
export function flyIn(key: string, card: Card | null, faceDown: boolean, from: Box, to: Box, o: Opts): Flyer {
  return { key, card, faceDown, box: to, dir: 'in', dx: cx(from) - cx(to), dy: cy(from) - cy(to), scale: from.w / to.w, r0: o.r0 ?? 0, r1: o.r1 ?? 0, ms: o.ms, delay: o.delay ?? 0 }
}

/** from'dan to'ya küçülerek gidip kaybolan kart */
export function flyOut(key: string, card: Card | null, faceDown: boolean, from: Box, to: Box, o: Opts): Flyer {
  return { key, card, faceDown, box: from, dir: 'out', dx: cx(to) - cx(from), dy: cy(to) - cy(from), scale: 0.45, r0: o.r0 ?? 0, r1: o.r1 ?? 0, ms: o.ms, delay: o.delay ?? 0 }
}

export function FlyLayer({ flyers }: { flyers: Flyer[] }) {
  return (
    <div className="fly-layer" aria-hidden>
      {flyers.map((f) => (
        <div
          key={f.key}
          className={'flyer flyer--' + f.dir}
          style={
            {
              left: f.box.x,
              top: f.box.y,
              width: f.box.w,
              height: f.box.h,
              '--dx': `${f.dx}px`,
              '--dy': `${f.dy}px`,
              '--s': f.scale,
              '--r0': `${f.r0}deg`,
              '--r1': `${f.r1}deg`,
              animationDuration: `${f.ms}ms`,
              animationDelay: `${f.delay}ms`,
            } as CSSProperties
          }
        >
          <PlayingCard card={f.card} faceDown={f.faceDown} />
        </div>
      ))}
    </div>
  )
}
