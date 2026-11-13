// Uygulama simgesi ve giriş ekranı görselini üretir.
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

// Uygulama simgesi mağaza simgesiyle aynı (Gemini görseli); capacitor-assets ön planı kendisi görünen alana küçültür
const gemini = fileURLToPath(new URL('../magaza/kaynak/simge-gemini.jpg', import.meta.url))
const background = svg(100, 100, `<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#1f6639"/><stop offset="1" stop-color="#102d1a"/></linearGradient></defs>
  <rect width="100" height="100" fill="url(#bg)"/>`)

// Giriş ekranının ortasındaki görsel: simge, kenarları yeşil zemine yumuşakça karışır.
// Android'de android/app/src/main/res/drawable/splash_screen.xml, oyunda index.html içindeki #intro aynı görseli gösterir.
const splashArt = async () => {
  const s = 960
  const fade = await sharp(Buffer.from(svg(s, s, `<rect x="60" y="60" width="${s - 120}" height="${s - 120}" rx="140" fill="#fff"/>`)))
    .blur(40).toBuffer()
  const art = await sharp(gemini).resize(s, s).ensureAlpha().composite([{ input: fade, blend: 'dest-in' }]).png().toBuffer()
  await sharp(art).toFile(fileURLToPath(new URL('../android/app/src/main/res/drawable-xxhdpi/splash_art.png', dir)))
  await sharp(art).toFile(fileURLToPath(new URL('../public/splash-art.png', dir)))
}

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
  sharp(gemini).resize(1024, 1024).png().toFile(fileURLToPath(new URL('icon-only.png', dir))),
  sharp(gemini).resize(1024, 1024).png().toFile(fileURLToPath(new URL('icon-foreground.png', dir))),
  png(background, 1024, 'icon-background.png'),
  splashArt(),
])
console.log('ikonlar hazır')
