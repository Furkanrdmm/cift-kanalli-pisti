// Uygulama simgesi ve açılış ekranı kaynaklarını üretir.
// Kullanım: node assets/build-icons.mjs && npx @capacitor/assets generate --android
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const HEART = 'M50 90 C22 68 4 52 4 32 C4 17 16 6 30 6 C39 6 46 11 50 19 C54 11 61 6 70 6 C84 6 96 17 96 32 C96 52 78 68 50 90 Z'
const SPADE =
  'M50 4 C78 28 96 42 96 60 C96 74 85 82 73 82 C64 82 57 78 53 72 C54 82 58 90 66 96 L34 96 C42 90 46 82 47 72 C43 78 36 82 27 82 C15 82 4 74 4 60 C4 42 22 28 50 4 Z'

// 100x100 koordinatlarında iki kart (maça ve kupa)
const cards = `
  <g transform="rotate(-13 50 54)">
    <rect x="12" y="20" width="40" height="56" rx="6" fill="#fbf6e9" stroke="#3e2210" stroke-width="1.6"/>
    <path d="${SPADE}" fill="#1b1b1b" transform="translate(20.5 36) scale(0.23)"/>
  </g>
  <g transform="rotate(13 50 54)">
    <rect x="48" y="22" width="40" height="56" rx="6" fill="#fbf6e9" stroke="#3e2210" stroke-width="1.6"/>
    <path d="${HEART}" fill="#c62828" transform="translate(56.5 39) scale(0.23)"/>
  </g>`

const felt = `
  <defs>
    <radialGradient id="felt" cx="50%" cy="40%" r="75%">
      <stop offset="0" stop-color="#2a8048"/>
      <stop offset="1" stop-color="#134526"/>
    </radialGradient>
  </defs>`

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`

// Tam simge (eski Android ve web için)
const iconOnly = svg(100, 100, `${felt}
  <rect width="100" height="100" fill="url(#felt)"/>
  <rect x="5" y="5" width="90" height="90" rx="16" fill="none" stroke="#e8c26a" stroke-width="2" opacity=".55"/>
  <g transform="translate(4 -4) scale(0.92)">${cards}</g>`)

// Uyarlanabilir simge: ön plan (şeffaf, ortadaki güvenli alanda) + arka plan
const foreground = svg(100, 100, `<g transform="translate(13 14.5) scale(0.74)">${cards}</g>`)
const background = svg(100, 100, `${felt}<rect width="100" height="100" fill="url(#felt)"/>`)

// Açılış ekranı: ahşap zemin, ortada simge
const splash = svg(100, 100, `${felt}
  <rect width="100" height="100" fill="#3e2210"/>
  <g transform="translate(38 38) scale(0.24)">
    <rect width="100" height="100" rx="22" fill="url(#felt)"/>
    <rect x="4" y="4" width="92" height="92" rx="19" fill="none" stroke="#e8c26a" stroke-width="2" opacity=".6"/>
    <g transform="translate(4 -4) scale(0.92)">${cards}</g>
  </g>`)

// Web simgesi (yuvarlak köşeli)
const favicon = svg(100, 100, `${felt}
  <rect width="100" height="100" rx="22" fill="url(#felt)"/>
  <rect x="4" y="4" width="92" height="92" rx="19" fill="none" stroke="#e8c26a" stroke-width="2" opacity=".6"/>
  <g transform="translate(4 -4) scale(0.92)">${cards}</g>`)

const dir = new URL('.', import.meta.url)
const png = (s, size, name) => sharp(Buffer.from(s), { density: (72 * size) / 100 }).resize(size, size).png().toFile(fileURLToPath(new URL(name, dir)))

writeFileSync(new URL('../public/favicon.svg', dir), favicon)
writeFileSync(new URL('icon.svg', dir), favicon)
await Promise.all([
  png(iconOnly, 1024, 'icon-only.png'),
  png(foreground, 1024, 'icon-foreground.png'),
  png(background, 1024, 'icon-background.png'),
  png(splash, 2732, 'splash.png'),
  png(splash, 2732, 'splash-dark.png'),
])
console.log('ikonlar hazır')
