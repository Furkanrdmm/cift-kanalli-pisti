import { useEffect, useRef, useState } from 'react'
import {
  type Card,
  type GameEvent,
  type GameState,
  type Move,
  type Target,
  allTargets,
  applyMove,
  channelsDone,
  gameWinner,
  isLegal,
  newGame,
  score,
  sideOf,
  sidesOf,
} from '../game/engine'
import { chooseMove } from '../game/bot'
import { HUMAN, playerNames, shortName, sideShortNames } from '../game/players'
import type { MatchData, MoveRecord } from '../online/room'
import { remoteToLocalSeat, toLocal, winsToLocal } from '../online/perspective'
import { type SavedMatch, clearMatch, saveMatch } from '../game/save'
import {
  type Box,
  type Flyer,
  FlyLayer,
  timings,
  boxOf,
  centered,
  flyIn,
  flyOut,
  nextFrame,
  pileCardBox,
  pileRotation,
  sleep,
} from './flyers'
import { PlayingCard } from './PlayingCard'
import { sfx } from '../game/sound'
import { haptic } from '../game/haptics'
import { SettingsPanel } from './SettingsPanel'
import { recordGame, recordMatch, recordPisti } from '../game/stats'

const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' } as const
const cardName = (c: Card) => c.rank + SUIT_SYMBOL[c.suit]

/** Kanallar bitince 2 yer olur: sağdaki asıl yer "1. yer", kanalların yeri "2. yer" */
const pileName = (index: number, pileCount: number) => (pileCount === 1 ? 'yer' : `${index + 1}. yer`)

function describe(e: GameEvent, pileCount: number, names: string[]): string {
  const who = names[e.player]
  const c = cardName(e.card)
  const where = e.target.kind === 'pile' ? pileName(e.target.index, pileCount) : 'kanal'
  switch (e.kind) {
    case 'play':
      return `${who}: ${c} → ${where}`
    case 'capture':
      return `${who}: ${c} ile ${where} aldı`
    case 'pisti':
      return `${who}: ${c} ile PİŞTİ! +${e.points}`
    case 'channelPisti':
      return `${who}: ${c} ile kanalda PİŞTİ! +${e.points}`
    case 'fill':
      return `${who}: ${c} → boş ${where}`
  }
}

/** Dağıtılırken gizlenecek kartlar: eller, ilk dağıtımda masadakiler de */
function dealIds(s: GameState, withTable: boolean): Set<string> {
  const ids = s.hands.flat().map((c) => c.id)
  if (withTable) ids.push(...(s.channels.filter(Boolean) as Card[]).map((c) => c.id), ...s.piles[0].map((c) => c.id))
  return new Set(ids)
}

const targetKey = (t: Target) => `${t.kind}-${t.index}`

/** Online oyun bağlantısı (OnlineScreen verir). Bütün oyuncu sıraları "yerel": 0 = ben. */
export interface OnlineLink {
  mySeat: number
  isHost: boolean
  names: string[]
  bots: boolean[]
  offline: boolean[]
  match: MatchData
  /** Yeni durumu odaya yaz (yerel bakış açısından); başarılıysa true */
  push: (expectedSeq: number, next: GameState, wins: number[], move: { player: number; move: Move } | null, newGame?: boolean) => Promise<boolean>
}

interface Props {
  target: number
  /** Yeni maç için oyuncu sayısı ve eşli mi (devam edilen maçta kayıttan gelir) */
  players?: number
  teamMode?: boolean
  resume?: SavedMatch | null
  online?: OnlineLink
  onExit: () => void
}

/** Odadaki durumu benim bakış açıma çevir */
function parseMatch(m: MatchData, mySeat: number) {
  const g = toLocal(JSON.parse(m.game) as GameState, mySeat)
  return { game: g, wins: winsToLocal(JSON.parse(m.wins) as number[], mySeat, !!g.teams) }
}

/** Oyun bittiyse kazananı ekleyip yeni maç skorunu hesapla */
function winsAfter(next: GameState, wins: number[]): number[] {
  if (!next.finished) return wins
  const winner = gameWinner(next)
  return wins.map((n, i) => (i === winner ? n + 1 : n))
}

/** Bağlantısı kopan oyuncunun sırası gelince kurucu bu kadar bekleyip onun yerine oynar */
const OFFLINE_TAKEOVER_MS = 15000

export function Game({ target, players = 2, teamMode = false, resume, online, onExit }: Props) {
  const [initial] = useState(() => (online ? parseMatch(online.match, online.mySeat) : null))
  const [game, setGameState] = useState<GameState>(() => initial?.game ?? resume?.game ?? newGame(players, HUMAN, teamMode))
  const [wins, setWinsState] = useState(() => initial?.wins ?? resume?.wins ?? sidesOf(game).map(() => 0))
  // Arka arkaya gelen online hamlelerde her zaman en güncel durumu kullanmak için
  const gameRef = useRef(game)
  const winsRef = useRef(wins)
  const setGame = (g: GameState) => {
    gameRef.current = g
    setGameState(g)
  }
  const setWins = (w: number[]) => {
    winsRef.current = w
    setWinsState(w)
  }
  const seqRef = useRef(online?.match.seq ?? 0)
  const gameNoRef = useRef(online?.match.gameNo ?? 0)
  const [selected, setSelected] = useState<string | null>(null)
  const [toast, setToast] = useState<GameEvent | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  // Animasyon durumu: animasyon sürerken ekranda "view" gösterilir, oyun durumu sonra güncellenir
  const [view, setView] = useState<GameState | null>(null)
  const [flyers, setFlyers] = useState<Flyer[]>([])
  // Yeni maçta kartlar dağıtılarak gelir; devam edilen (veya online'da sonradan girilen) maçta gelmez
  const [introDeal] = useState(() => !resume && !(online && online.match.seq > 0))
  const [hidden, setHidden] = useState<Set<string>>(() => (introDeal ? dealIds(game, true) : new Set()))
  const [busy, setBusyState] = useState(introDeal)
  const busyRef = useRef(introDeal)
  const setBusy = (b: boolean) => {
    busyRef.current = b
    setBusyState(b)
  }
  const rootRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const seq = useRef(0)
  const introDone = useRef(false)

  const q = (sel: string) => rootRef.current?.querySelector(sel)
  const box = (sel: string) => boxOf(q(sel), rootRef.current!)
  const cardSize = () => {
    const b = boxOf(measureRef.current, rootRef.current!)!
    return { w: b.w, h: b.h }
  }

  const finishGame = (next: GameState) => {
    if (!next.finished) return
    const winner = gameWinner(next)
    const mine = sideOf(next, HUMAN)
    const newWins = winsAfter(next, winsRef.current)
    setWins(newWins)
    if (winner === mine) {
      sfx.win()
      haptic.win()
    } else if (winner !== null) sfx.lose()

    // İstatistikler
    recordGame(winner === mine, score(next)[mine].total)
    const champ = newWins.findIndex((w) => w >= target)
    if (champ >= 0) recordMatch(champ === mine)
  }

  /** Desteden kartları dağıtma animasyonu (ilk dağıtımda masadaki kartlar da) */
  const runDeal = async (s: GameState, withTable: boolean) => {
    await nextFrame()
    const root = rootRef.current
    if (!root) return
    const T = timings()
    const deck = box('[data-deck] .card')!
    const full = cardSize()
    const items: Flyer[] = []
    const n = ++seq.current
    const add = (card: Card, faceDown: boolean, to: Box | null, r1 = 0) => {
      if (to) items.push(flyIn(`d${n}-${card.id}`, card, faceDown, deck, to, { r1, ms: T.deal, delay: items.length * T.dealGap }))
    }

    if (withTable) {
      s.channels.forEach((ch, i) => {
        const slot = box(`[data-target="channel-${i}"]`)
        if (ch && slot) add(ch, false, centered(slot, full))
      })
      const slot = box('[data-target="pile-0"]')
      if (slot) {
        s.piles[0].forEach((c, idx) => {
          const { box: b, rot } = pileCardBox(slot, full, idx, idx)
          add(c, idx < s.hiddenInPile, b, rot)
        })
      }
    }
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < s.playerCount; k++) {
        const p = (s.starter + k) % s.playerCount
        const c = s.hands[p][i]
        if (!c) continue
        const to = p === HUMAN ? box(`[data-card-id="${c.id}"]`) : boxOf(root.querySelectorAll(`[data-seat="${p}"] [data-opp-card]`)[i], root)
        add(c, p !== HUMAN, to)
      }
    }

    setFlyers(items)
    sfx.deal(items.length, T.dealGap, T.deal)
    await sleep(items.length * T.dealGap + T.deal)
    setHidden(new Set())
    setFlyers([])
  }

  /** Hamleyi animasyonla oynat: kart ele/yere uçar, alınan kartlar toplanır, sonra durum güncellenir.
   *  from: sürüklenen kartın bırakıldığı yer (yoksa elden başlar)
   *  remote: online'da başkasının hamlesi; animasyondan sonra odadaki durum esas alınır */
  const runMove = async (player: number, move: Move, from?: Box, remote?: { state: GameState }) => {
    if (busyRef.current || !isLegal(gameRef.current, player, move)) return
    setBusy(true)
    setSelected(null)
    const prev = gameRef.current
    const next = applyMove(prev, player, move)

    // Online: kendi hamlemi (veya kurucuysam bilgisayarın hamlesini) hemen odaya yaz
    let pushed: Promise<boolean> | null = null
    if (online && !remote) {
      const expected = seqRef.current
      seqRef.current = expected + 1
      pushed = online.push(expected, next, winsAfter(next, winsRef.current), { player, move })
    }
    const root = rootRef.current!
    const full = cardSize()
    const card = prev.hands[player].find((c) => c.id === move.cardId)!
    const t = move.target
    const n = ++seq.current
    const T = timings()

    const opp = root.querySelectorAll(`[data-seat="${player}"] [data-opp-card]`)
    const src = from ?? (player === HUMAN ? box(`[data-card-id="${card.id}"]`) : boxOf(opp[opp.length - 1], root)) ?? box('[data-deck] .card')!
    const slot = box(`[data-target="${targetKey(t)}"]`)!
    let dest: Box
    let rot = 0
    if (t.kind === 'pile') {
      const len = prev.piles[t.index].length
      ;({ box: dest, rot } = pileCardBox(slot, full, len, Math.min(len, 2)))
    } else {
      dest = centered(slot, full)
    }

    // 1) Kart elden hedefe uçar
    const viewA: GameState = structuredClone(prev)
    viewA.hands[player] = viewA.hands[player].filter((c) => c.id !== card.id)
    setView(viewA)
    setFlyers([flyIn(`m${n}`, card, false, src, dest, { r1: rot, ms: T.move })])
    sfx.play()
    if (player === HUMAN) haptic.tap()
    await sleep(T.move)
    sfx.land()

    // 2) Aldıysa yerdeki kartlar oyuncuya doğru toplanır
    const e = next.lastEvent!
    if (e.kind === 'capture' || e.kind === 'pisti' || e.kind === 'channelPisti') {
      if (e.kind !== 'capture') {
        setToast(e)
        const vale = e.card.rank === 'J'
        if (vale) sfx.valePisti()
        else if (e.kind === 'channelPisti') sfx.kanalPisti()
        else sfx.pisti()
        if (player === HUMAN) {
          ;(vale ? haptic.valePisti : haptic.pisti)()
          recordPisti(vale ? 'vale' : e.kind === 'channelPisti' ? 'kanal' : 'pisti')
        }
      }
      await sleep(T.capturePause)
      sfx.collect()
      const seat = box(`[data-seat="${player}"]`)!
      const outs: Flyer[] = []
      const out = (c: Card, faceDown: boolean, from: Box, r0: number) =>
        outs.push(flyOut(`o${n}-${c.id}`, c, faceDown, from, seat, { r0, ms: T.collect, delay: outs.length * 40 }))
      const viewB: GameState = structuredClone(viewA)
      if (t.kind === 'pile') {
        const pile = prev.piles[t.index]
        const visible = pile.slice(-3)
        visible.forEach((c, i) => {
          const idx = pile.length - visible.length + i
          const p = pileCardBox(slot, full, idx, i)
          out(c, t.index === 0 && idx < prev.hiddenInPile, p.box, p.rot)
        })
        viewB.piles[t.index] = []
        if (t.index === 0) viewB.hiddenInPile = 0
      } else {
        out(prev.channels[t.index]!, false, dest, 0)
        viewB.channels[t.index] = null
      }
      out(card, false, dest, rot)
      setView(viewB)
      setFlyers(outs)
      await sleep(T.collect + outs.length * 40)
    }

    // 3) Oyun durumunu güncelle; yeni el dağıtıldıysa dağıtma animasyonu
    const dealt = !next.finished && next.deck.length < prev.deck.length
    if (dealt) setHidden(dealIds(next, false))
    setView(null)
    setFlyers([])
    setGame(remote ? remote.state : next)
    finishGame(next)
    if (dealt) await runDeal(next, false)
    // Yazma başarısızsa (başkası önce yazdı) odadaki duruma yeniden eşitlen
    if (pushed && !(await pushed)) seqRef.current = -1
    setBusy(false)
  }

  const startNewGame = (g: GameState) => {
    setGame(g)
    setHidden(dealIds(g, true))
    setBusy(true)
    runDeal(g, true).then(() => setBusy(false))
  }

  // İlk açılışta kartları dağıt (devam edilen maçta dağıtma yok)
  useEffect(() => {
    if (!introDeal || introDone.current) return
    introDone.current = true
    runDeal(game, true).then(() => setBusy(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Her hamlede kaydet; maç bittiyse kaydı sil (online maçlar odada durur, kaydedilmez)
  useEffect(() => {
    if (online) return
    if (wins.some((w) => w >= target)) clearMatch()
    else saveMatch(target, wins, game)
  }, [game, wins, target, online])

  // Bilgisayarların sırası. Online'da bilgisayarları (ve bağlantısı kopan oyuncuyu) sadece kurucu oynatır.
  const botKey = online ? `${online.isHost}|${online.bots.join()}|${online.offline.join()}` : ''
  useEffect(() => {
    if (busy || game.finished || game.turn === HUMAN) return
    const p = game.turn
    let delay = timings().bot
    if (online) {
      if (!online.isHost) return
      if (!online.bots[p]) {
        if (!online.offline[p]) return // insan oyuncu: onun hamlesini bekle
        delay = OFFLINE_TAKEOVER_MS
      }
    } else if (showSettings) return
    const t = setTimeout(() => runMove(p, chooseMove(gameRef.current, p)), delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, busy, showSettings, botKey])

  // Online: odadan gelen yeni durumu işle (başkasının hamlesi, yeni oyun ya da eşitlenme)
  useEffect(() => {
    if (!online || busy) return
    const m = online.match
    if (m.seq <= seqRef.current) return
    const { game: g, wins: w } = parseMatch(m, online.mySeat)
    if (m.gameNo !== gameNoRef.current) {
      // Kurucu yeni oyunu başlattı
      seqRef.current = m.seq
      gameNoRef.current = m.gameNo
      setWins(w)
      startNewGame(g)
      return
    }
    const rec = m.move ? (JSON.parse(m.move) as MoveRecord) : null
    if (rec && m.seq === seqRef.current + 1) {
      const p = remoteToLocalSeat(rec.player, online.mySeat, g.playerCount)
      if (isLegal(gameRef.current, p, rec.move)) {
        seqRef.current = m.seq
        void runMove(p, rec.move, undefined, { state: g })
        return
      }
    }
    // Arada hamle kaçtıysa animasyonsuz eşitlen
    seqRef.current = m.seq
    setGame(g)
    setWins(w)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online?.match, busy])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1400)
    return () => clearTimeout(t)
  }, [toast])

  const shown = view ?? game
  const myTurn = !busy && !game.finished && game.turn === HUMAN
  const canPlay = (t: Target) => myTurn && !!selected && isLegal(game, HUMAN, { cardId: selected, target: t })

  const onCardClick = (card: Card) => {
    if (!myTurn) return
    if (selected !== card.id) {
      sfx.tick()
      return setSelected(card.id)
    }
    // Aynı karta ikinci dokunuş: tek seçenek varsa oyna
    const legal = allTargets(game).filter((t) => isLegal(game, HUMAN, { cardId: card.id, target: t }))
    if (legal.length === 1) runMove(HUMAN, { cardId: card.id, target: legal[0] })
    else setSelected(null)
  }

  const onTargetClick = (t: Target) => {
    if (selected && canPlay(t)) runMove(HUMAN, { cardId: selected, target: t })
  }

  // ---- Sürükle bırak: karta basılı tutup yere sürükleyerek oynama ----
  const [drag, setDrag] = useState<{ id: string; box: Box; over: string | null } | null>(null)
  const dragStart = useRef<{ id: string; px: number; py: number; ox: number; oy: number; w: number; h: number; moved: boolean } | null>(null)

  const targetAt = (x: number, y: number): Target | null => {
    const key = document.elementFromPoint(x, y)?.closest('[data-target]')?.getAttribute('data-target')
    if (!key) return null
    const [kind, index] = key.split('-')
    return { kind: kind as Target['kind'], index: Number(index) }
  }
  const dragBox = (d: NonNullable<typeof dragStart.current>, x: number, y: number): Box => {
    const o = rootRef.current!.getBoundingClientRect()
    return { x: x - o.left - d.ox, y: y - o.top - d.oy, w: d.w, h: d.h }
  }

  const onHandPointerDown = (e: React.PointerEvent<HTMLDivElement>, card: Card) => {
    if (!myTurn || e.button > 0) return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragStart.current = { id: card.id, px: e.clientX, py: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, h: r.height, moved: false }
  }

  const onHandPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragStart.current
    if (!d) return
    if (!d.moved && Math.hypot(e.clientX - d.px, e.clientY - d.py) < 8) return // küçük kıpırtı: dokunma say
    d.moved = true
    const over = targetAt(e.clientX, e.clientY)
    setSelected(d.id)
    setDrag({ id: d.id, box: dragBox(d, e.clientX, e.clientY), over: over ? targetKey(over) : null })
  }

  const onHandPointerUp = (e: React.PointerEvent<HTMLDivElement>, card: Card) => {
    const d = dragStart.current
    dragStart.current = null
    if (!d) return
    if (!d.moved) return onCardClick(card)

    let target = targetAt(e.clientX, e.clientY)
    if (target && !isLegal(game, HUMAN, { cardId: d.id, target })) target = null
    if (!target && d.py - e.clientY > 60) {
      // Yukarı fırlatıldı: kartın tek gidebileceği yer varsa oraya
      const legal = allTargets(game).filter((t) => isLegal(game, HUMAN, { cardId: d.id, target: t }))
      if (legal.length === 1) target = legal[0]
    }
    setDrag(null)
    if (target) runMove(HUMAN, { cardId: d.id, target }, dragBox(d, e.clientX, e.clientY))
    else setSelected(null)
  }

  const onHandPointerCancel = () => {
    dragStart.current = null
    setDrag(null)
    setSelected(null)
  }

  const names = online ? online.names : playerNames(game)
  let status: string
  if (game.finished) status = 'Oyun bitti'
  else if (game.turn !== HUMAN) status = `${names[game.turn]} düşünüyor…`
  else if (busy) status = ''
  else if (game.mustFill !== null)
    status = game.piles.length === 1 ? 'Yer boş! Yere bir kart atmak zorundasın' : `${game.mustFill + 1}. yer boş! Oraya bir kart atmak zorundasın`
  else if (drag) status = 'Parlayan yerin üstüne bırak'
  else if (selected) status = 'Nereye atacaksın? Parlayan yere dokun'
  else status = 'Sıra sende — bir kart seç'

  const last = shown.lastEvent
  const twoPiles = channelsDone(shown)
  const renderPile = (index: number) => {
    const pile = shown.piles[index]
    const t: Target = { kind: 'pile', index }
    const must = !busy && game.mustFill === index
    const visible = pile.slice(-3)
    return (
      <div className="zone">
        <div className="zone-label">
          {twoPiles ? `${index + 1}. Yer` : 'Yer'} {pile.length > 0 && <small>({pile.length})</small>}
        </div>
        <div
          data-target={targetKey(t)}
          className={'slot slot--pile' + (canPlay(t) ? ' slot--hot' : '') + (canPlay(t) && drag?.over === targetKey(t) ? ' slot--over' : '') + (must ? ' slot--must' : '')}
          onClick={() => onTargetClick(t)}
        >
          {visible.length === 0 && <span className="slot-text">{must ? 'Kart at' : 'Boş'}</span>}
          {visible.map((c, i) => {
            const idx = pile.length - visible.length + i
            const isLast = idx === pile.length - 1 && last?.card.id === c.id && (last.kind === 'play' || last.kind === 'fill')
            return (
              <PlayingCard
                key={c.id}
                card={c}
                hidden={hidden.has(c.id)}
                className={isLast ? 'card--last' : undefined}
                faceDown={index === 0 && idx < shown.hiddenInPile}
                style={{ position: 'absolute', transform: `rotate(${pileRotation(idx)}deg) translate(${i * 3}px, ${i * 2}px)` }}
              />
            )
          })}
        </div>
      </div>
    )
  }
  const matchOver = wins.some((w) => w >= target)
  const shortNames = game.teams ? ['Biz', 'Onlar'] : online ? names.map((n) => shortName(n)) : sideShortNames(game)
  const partner = game.teams ? game.teams[sideOf(game, HUMAN)].find((p) => p !== HUMAN) : undefined

  // Masa düzeni: sen alttasın, sıra saat yönünün tersine döner.
  // 2 kişi: rakip karşıda. 3 kişi: 2. oyuncu sağda, 3. karşıda. 4 kişi: 2. sağda, 3. karşıda, 4. solda.
  const multi = game.playerCount > 2
  const topSeat = multi ? 2 : 1
  const rightSeat = multi ? 1 : null
  const leftSeat = game.playerCount === 4 ? 3 : null

  const renderOpponent = (p: number, side: boolean) => (
    <div
      key={p}
      data-seat={p}
      className={
        'player ' +
        (side ? 'player--side' : 'player--top') +
        (game.turn === p && !game.finished ? ' player--active' : '') +
        (p === partner ? ' player--partner' : '')
      }
    >
      <div className={'hand hand--opponent' + (side ? ' hand--side' : '')}>
        {shown.hands[p].map((c) => (
          <PlayingCard key={c.id} faceDown small hidden={hidden.has(c.id)} data-opp-card="" />
        ))}
      </div>
      <PlayerInfo name={names[p]} game={shown} p={p} tag={online ? (online.bots[p] ? '🤖' : online.offline[p] ? 'bağlantı yok' : null) : null} />
    </div>
  )

  return (
    <div className="table">
      <div className={multi ? 'game game--multi' : 'game'} ref={rootRef}>
        <div ref={measureRef} className="card card-measure" />
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={onExit} aria-label="Menüye dön">
              ←
            </button>
            <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="Ayarlar">
              ⚙
            </button>
          </div>
          <div className="match-score">
            {shortNames.map((n, i) => (
              <span key={n}>
                {n} {wins[i]}
              </span>
            ))}
            <span className="match-target">{target} alan kazanır</span>
          </div>
          <div className="deck-count" title="Destede kalan kart" data-deck>
            <PlayingCard faceDown small />
            <span>{shown.deck.length}</span>
          </div>
        </header>

        <section className="opponents">{renderOpponent(topSeat, false)}</section>

        <div className={multi ? 'table-mid' : 'table-mid table-mid--duo'}>
          {multi && <div className="side side--left">{leftSeat !== null && renderOpponent(leftSeat, true)}</div>}
          <section className="board">
            {twoPiles ? (
              renderPile(1)
            ) : (
              <div className="zone">
                <div className="zone-label">Pişti Kanalları</div>
                <div className="zone-cards">
                  {shown.channels.map((ch, i) => {
                    const t: Target = { kind: 'channel', index: i }
                    return (
                      <div key={i} data-target={targetKey(t)} className={'slot' + (canPlay(t) ? ' slot--hot' : '') + (canPlay(t) && drag?.over === targetKey(t) ? ' slot--over' : '')} onClick={() => onTargetClick(t)}>
                        {ch ? <PlayingCard card={ch} hidden={hidden.has(ch.id)} /> : <span className="slot-text">Pişti oldu</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {renderPile(0)}
          </section>
          {rightSeat !== null && <div className="side side--right">{renderOpponent(rightSeat, true)}</div>}
        </div>

        <div className="status">
          <div className={'status-main' + (game.mustFill !== null && myTurn ? ' status-main--warn' : '')}>{status}</div>
          {last && <div className="status-last">{describe(last, shown.piles.length, names)}</div>}
        </div>

        <section data-seat={HUMAN} className={'player player--bottom' + (myTurn ? ' player--active' : '')}>
          <PlayerInfo name={names[HUMAN]} game={shown} p={HUMAN} />
          <div className="hand">
            {shown.hands[HUMAN].map((c) => (
              <PlayingCard
                key={c.id}
                card={c}
                data-card-id={c.id}
                hidden={hidden.has(c.id) || drag?.id === c.id}
                selected={selected === c.id}
                disabled={!myTurn}
                className="card--clickable card--draggable"
                onPointerDown={(e) => onHandPointerDown(e, c)}
                onPointerMove={onHandPointerMove}
                onPointerUp={(e) => onHandPointerUp(e, c)}
                onPointerCancel={onHandPointerCancel}
              />
            ))}
          </div>
        </section>

        {drag && (
          <div className="drag-card" style={{ left: drag.box.x, top: drag.box.y, width: drag.box.w, height: drag.box.h }}>
            <PlayingCard card={game.hands[HUMAN].find((c) => c.id === drag.id)} />
          </div>
        )}

        <FlyLayer flyers={flyers} />

        {toast && (
          <div className="toast" key={toast.card.id}>
            <div className={'toast-title' + (toast.card.rank === 'J' ? ' toast-title--vale' : '')}>{toast.card.rank === 'J' ? 'VALE PİŞTİ!' : 'PİŞTİ!'}</div>
            <div className="toast-sub">
              {names[toast.player]} +{toast.points}
            </div>
          </div>
        )}

        {showSettings && <SettingsPanel asModal onClose={() => setShowSettings(false)} />}

        {game.finished && !busy && (
          <ResultModal
            game={game}
            wins={wins}
            target={target}
            matchOver={matchOver}
            names={names}
            short={shortNames}
            waiting={online && !online.isHost ? `${online.names[remoteToLocalSeat(0, online.mySeat, game.playerCount)]} yeni oyunu başlatacak…` : null}
            onNext={() => {
              const nextWins = matchOver ? wins.map(() => 0) : wins
              setWins(nextWins)
              // Her oyunda başlayan oyuncu sırayla değişir
              const g = newGame(game.playerCount, (game.starter + 1) % game.playerCount, !!game.teams)
              if (online) {
                const expected = seqRef.current
                seqRef.current = expected + 1
                gameNoRef.current += 1
                void online.push(expected, g, nextWins, null, true).then((ok) => {
                  if (!ok) seqRef.current = -1
                })
              }
              startNewGame(g)
            }}
            onExit={onExit}
          />
        )}
      </div>
    </div>
  )
}

function PlayerInfo({ name, game, p, tag }: { name: string; game: GameState; p: number; tag?: string | null }) {
  return (
    <div className="player-info">
      <span className="player-name">{name}</span>
      {tag && <span className={'chip' + (tag === '🤖' ? '' : ' chip--warn')}>{tag}</span>}
      <span className="chip" title="Toplanan kart">
        🂠 {game.captured[p].length}
      </span>
      {game.pistiCount[p] > 0 && <span className="chip chip--gold">Pişti ×{game.pistiCount[p]}</span>}
    </div>
  )
}

function ResultModal({
  game,
  wins,
  target,
  matchOver,
  names,
  short,
  waiting,
  onNext,
  onExit,
}: {
  game: GameState
  wins: number[]
  target: number
  matchOver: boolean
  names: string[]
  short: string[]
  /** Online'da yeni oyunu kurucu başlatır; diğerleri bu yazıyı görür */
  waiting: string | null
  onNext: () => void
  onExit: () => void
}) {
  const lines = score(game)
  const sides = game.teams ? ['Biz', 'Onlar'] : names
  const mine = sideOf(game, HUMAN)
  const winner = gameWinner(game)
  const team = !!game.teams

  let title: string
  if (matchOver) {
    const champ = wins.findIndex((w) => w >= target)
    if (champ === mine) title = team ? 'Maçı kazandınız! 🏆' : 'Maçı kazandın! 🏆'
    else title = team ? 'Maçı rakipler kazandı' : `Maçı ${sides[champ]} kazandı`
  } else if (winner === null) title = 'Berabere'
  else if (winner === mine) title = team ? 'Bu oyunu siz aldınız!' : 'Bu oyunu sen aldın!'
  else title = team ? 'Bu oyunu rakipler aldı' : `Bu oyunu ${sides[winner]} aldı`

  const rows: [string, (l: (typeof lines)[number]) => string | number][] = [
    ['Toplanan kart', (l) => l.cards],
    ['En çok kart', (l) => l.mostCards],
    ['Kart puanı', (l) => l.cardPoints], // as, vale, ♣2, ♦10
    ['Pişti', (l) => `${l.pisti} (${l.pistiCount})`],
  ]
  const members = (i: number) => (team ? sidesOf(game)[i].map((p) => names[p]).join(' + ') : null)

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{title}</h2>
        <table className={'score-table' + (lines.length > 2 ? ' score-table--wide' : '')}>
          <thead>
            <tr>
              <th />
              {short.map((n, i) => (
                <th key={n} className={i === mine ? 'score-mine' : undefined}>
                  {n}
                  {members(i) && <small className="score-members">{members(i)}</small>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label}>
                <td>{label}</td>
                {lines.map((l, i) => (
                  <td key={i}>{f(l)}</td>
                ))}
              </tr>
            ))}
            <tr className="score-total">
              <td>Toplam</td>
              {lines.map((l, i) => (
                <td key={i}>{l.total}</td>
              ))}
            </tr>
          </tbody>
        </table>
        <div className="modal-match">
          Maç: {short.map((n, i) => `${n} ${wins[i]}`).join(' · ')} <small>({target} alan kazanır)</small>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onExit}>
            Menü
          </button>
          {waiting ? (
            <div className="modal-waiting">{waiting}</div>
          ) : (
            <button className="btn btn--primary" onClick={onNext}>
              {matchOver ? 'Yeni Maç' : 'Sonraki Oyun'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
