import { useEffect, useRef, useState } from 'react'
import { type Card, type GameEvent, type GameState, type Move, type Target, allTargets, applyMove, channelsDone, isLegal, newGame, score } from '../game/engine'
import { chooseMove } from '../game/bot'
import { type SavedMatch, clearMatch, saveMatch } from '../game/save'
import {
  type Box,
  type Flyer,
  CAPTURE_PAUSE_MS,
  COLLECT_MS,
  DEAL_GAP_MS,
  DEAL_MS,
  FlyLayer,
  MOVE_MS,
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

const HUMAN = 0
const BOT = 1
const NAMES = ['Sen', 'Bilgisayar']
const BOT_DELAY = 700

const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' } as const
const cardName = (c: Card) => c.rank + SUIT_SYMBOL[c.suit]

/** Kanallar bitince 2 yer olur: sağdaki asıl yer "1. yer", kanalların yeri "2. yer" */
const pileName = (index: number, pileCount: number) => (pileCount === 1 ? 'yer' : `${index + 1}. yer`)

function describe(e: GameEvent, pileCount: number): string {
  const who = NAMES[e.player]
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

interface Props {
  target: number
  resume?: SavedMatch | null
  onExit: () => void
}

export function Game({ target, resume, onExit }: Props) {
  const [game, setGame] = useState<GameState>(() => resume?.game ?? newGame(2, HUMAN))
  const [wins, setWins] = useState(() => resume?.wins ?? [0, 0])
  const [selected, setSelected] = useState<string | null>(null)
  const [toast, setToast] = useState<GameEvent | null>(null)

  // Animasyon durumu: animasyon sürerken ekranda "view" gösterilir, oyun durumu sonra güncellenir
  const [view, setView] = useState<GameState | null>(null)
  const [flyers, setFlyers] = useState<Flyer[]>([])
  const [hidden, setHidden] = useState<Set<string>>(() => (resume ? new Set() : dealIds(game, true)))
  const [busy, setBusyState] = useState(!resume)
  const busyRef = useRef(!resume)
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
    const [a, b] = score(next).map((l) => l.total)
    if (a !== b) setWins((w) => w.map((n, i) => n + (i === (a > b ? 0 : 1) ? 1 : 0)))
  }

  /** Desteden kartları dağıtma animasyonu (ilk dağıtımda masadaki kartlar da) */
  const runDeal = async (s: GameState, withTable: boolean) => {
    await nextFrame()
    const root = rootRef.current
    if (!root) return
    const deck = box('[data-deck] .card')!
    const full = cardSize()
    const items: Flyer[] = []
    const n = ++seq.current
    const add = (card: Card, faceDown: boolean, to: Box | null, r1 = 0) => {
      if (to) items.push(flyIn(`d${n}-${card.id}`, card, faceDown, deck, to, { r1, ms: DEAL_MS, delay: items.length * DEAL_GAP_MS }))
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
    const opp = root.querySelectorAll('[data-opp-card]')
    for (let i = 0; i < 4; i++) {
      for (let k = 0; k < s.playerCount; k++) {
        const p = (s.starter + k) % s.playerCount
        const c = s.hands[p][i]
        if (!c) continue
        add(c, p !== HUMAN, p === HUMAN ? box(`[data-card-id="${c.id}"]`) : boxOf(opp[i], root))
      }
    }

    setFlyers(items)
    await sleep(items.length * DEAL_GAP_MS + DEAL_MS)
    setHidden(new Set())
    setFlyers([])
  }

  /** Hamleyi animasyonla oynat: kart ele/yere uçar, alınan kartlar toplanır, sonra durum güncellenir */
  const runMove = async (player: number, move: Move) => {
    if (busyRef.current || !isLegal(game, player, move)) return
    setBusy(true)
    setSelected(null)
    const prev = game
    const next = applyMove(prev, player, move)
    const root = rootRef.current!
    const full = cardSize()
    const card = prev.hands[player].find((c) => c.id === move.cardId)!
    const t = move.target
    const n = ++seq.current

    const opp = root.querySelectorAll('[data-opp-card]')
    const src = (player === HUMAN ? box(`[data-card-id="${card.id}"]`) : boxOf(opp[opp.length - 1], root)) ?? box('[data-deck] .card')!
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
    setFlyers([flyIn(`m${n}`, card, false, src, dest, { r1: rot, ms: MOVE_MS })])
    await sleep(MOVE_MS)

    // 2) Aldıysa yerdeki kartlar oyuncuya doğru toplanır
    const e = next.lastEvent!
    if (e.kind === 'capture' || e.kind === 'pisti' || e.kind === 'channelPisti') {
      if (e.kind !== 'capture') setToast(e)
      await sleep(CAPTURE_PAUSE_MS)
      const seat = box(`[data-seat="${player}"]`)!
      const outs: Flyer[] = []
      const out = (c: Card, faceDown: boolean, from: Box, r0: number) =>
        outs.push(flyOut(`o${n}-${c.id}`, c, faceDown, from, seat, { r0, ms: COLLECT_MS, delay: outs.length * 40 }))
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
      await sleep(COLLECT_MS + outs.length * 40)
    }

    // 3) Oyun durumunu güncelle; yeni el dağıtıldıysa dağıtma animasyonu
    const dealt = !next.finished && next.deck.length < prev.deck.length
    if (dealt) setHidden(dealIds(next, false))
    setView(null)
    setFlyers([])
    setGame(next)
    finishGame(next)
    if (dealt) await runDeal(next, false)
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
    if (resume || introDone.current) return
    introDone.current = true
    runDeal(game, true).then(() => setBusy(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Her hamlede kaydet; maç bittiyse kaydı sil
  useEffect(() => {
    if (wins.some((w) => w >= target)) clearMatch()
    else saveMatch(target, wins, game)
  }, [game, wins, target])

  // Bilgisayarın sırası
  useEffect(() => {
    if (busy || game.finished || game.turn !== BOT) return
    const t = setTimeout(() => runMove(BOT, chooseMove(game, BOT)), BOT_DELAY)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, busy])

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
    if (selected !== card.id) return setSelected(card.id)
    // Aynı karta ikinci dokunuş: tek seçenek varsa oyna
    const legal = allTargets(game).filter((t) => isLegal(game, HUMAN, { cardId: card.id, target: t }))
    if (legal.length === 1) runMove(HUMAN, { cardId: card.id, target: legal[0] })
    else setSelected(null)
  }

  const onTargetClick = (t: Target) => {
    if (selected && canPlay(t)) runMove(HUMAN, { cardId: selected, target: t })
  }

  let status: string
  if (game.finished) status = 'Oyun bitti'
  else if (game.turn === BOT) status = 'Bilgisayar düşünüyor…'
  else if (busy) status = ''
  else if (game.mustFill !== null)
    status = game.piles.length === 1 ? 'Yer boş! Yere bir kart atmak zorundasın' : `${game.mustFill + 1}. yer boş! Oraya bir kart atmak zorundasın`
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
          className={'slot slot--pile' + (canPlay(t) ? ' slot--hot' : '') + (must ? ' slot--must' : '')}
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

  return (
    <div className="table">
      <div className="game" ref={rootRef}>
        <div ref={measureRef} className="card card-measure" />
        <header className="topbar">
          <button className="icon-btn" onClick={onExit} aria-label="Menüye dön">
            ←
          </button>
          <div className="match-score">
            <span>Sen {wins[HUMAN]}</span>
            <span className="match-target">{target} alan kazanır</span>
            <span>{wins[BOT]} Bilgisayar</span>
          </div>
          <div className="deck-count" title="Destede kalan kart" data-deck>
            <PlayingCard faceDown small />
            <span>{shown.deck.length}</span>
          </div>
        </header>

        <section data-seat={BOT} className={'player player--top' + (game.turn === BOT && !game.finished ? ' player--active' : '')}>
          <div className="hand hand--opponent">
            {shown.hands[BOT].map((c) => (
              <PlayingCard key={c.id} faceDown small hidden={hidden.has(c.id)} data-opp-card="" />
            ))}
          </div>
          <PlayerInfo name={NAMES[BOT]} game={shown} p={BOT} />
        </section>

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
                    <div key={i} data-target={targetKey(t)} className={'slot' + (canPlay(t) ? ' slot--hot' : '')} onClick={() => onTargetClick(t)}>
                      {ch ? <PlayingCard card={ch} hidden={hidden.has(ch.id)} /> : <span className="slot-text">Pişti oldu</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {renderPile(0)}
        </section>

        <div className="status">
          <div className={'status-main' + (game.mustFill !== null && myTurn ? ' status-main--warn' : '')}>{status}</div>
          {last && <div className="status-last">{describe(last, shown.piles.length)}</div>}
        </div>

        <section data-seat={HUMAN} className={'player player--bottom' + (myTurn ? ' player--active' : '')}>
          <PlayerInfo name={NAMES[HUMAN]} game={shown} p={HUMAN} />
          <div className="hand">
            {shown.hands[HUMAN].map((c) => (
              <PlayingCard
                key={c.id}
                card={c}
                data-card-id={c.id}
                hidden={hidden.has(c.id)}
                selected={selected === c.id}
                disabled={!myTurn}
                onClick={() => onCardClick(c)}
              />
            ))}
          </div>
        </section>

        <FlyLayer flyers={flyers} />

        {toast && (
          <div className="toast" key={toast.card.id}>
            <div className="toast-title">PİŞTİ!</div>
            <div className="toast-sub">
              {NAMES[toast.player]} +{toast.points}
            </div>
          </div>
        )}

        {game.finished && !busy && (
          <ResultModal
            game={game}
            wins={wins}
            target={target}
            matchOver={matchOver}
            onNext={() => {
              if (matchOver) setWins([0, 0])
              startNewGame(newGame(2, 1 - game.starter))
            }}
            onExit={onExit}
          />
        )}
      </div>
    </div>
  )
}

function PlayerInfo({ name, game, p }: { name: string; game: GameState; p: number }) {
  return (
    <div className="player-info">
      <span className="player-name">{name}</span>
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
  onNext,
  onExit,
}: {
  game: GameState
  wins: number[]
  target: number
  matchOver: boolean
  onNext: () => void
  onExit: () => void
}) {
  const lines = score(game)
  const [a, b] = lines.map((l) => l.total)
  const title = matchOver
    ? wins[HUMAN] > wins[BOT]
      ? 'Maçı kazandın! 🏆'
      : 'Maçı bilgisayar kazandı'
    : a === b
      ? 'Berabere'
      : a > b
        ? 'Bu oyunu sen aldın!'
        : 'Bu oyunu bilgisayar aldı'

  const rows: [string, (l: (typeof lines)[number]) => string | number][] = [
    ['Toplanan kart', (l) => l.cards],
    ['En çok kart', (l) => l.mostCards],
    ['As / Vale / ♣2 / ♦10', (l) => l.cardPoints],
    ['Pişti', (l) => `${l.pisti} (${l.pistiCount})`],
  ]

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>{title}</h2>
        <table className="score-table">
          <thead>
            <tr>
              <th />
              <th>Sen</th>
              <th>Bilgisayar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, f]) => (
              <tr key={label}>
                <td>{label}</td>
                <td>{f(lines[HUMAN])}</td>
                <td>{f(lines[BOT])}</td>
              </tr>
            ))}
            <tr className="score-total">
              <td>Toplam</td>
              <td>{a}</td>
              <td>{b}</td>
            </tr>
          </tbody>
        </table>
        <div className="modal-match">
          Maç: Sen {wins[HUMAN]} – {wins[BOT]} Bilgisayar <small>({target} alan kazanır)</small>
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onExit}>
            Menü
          </button>
          <button className="btn btn--primary" onClick={onNext}>
            {matchOver ? 'Yeni Maç' : 'Sonraki Oyun'}
          </button>
        </div>
      </div>
    </div>
  )
}
