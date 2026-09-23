import { useEffect, useState } from 'react'
import { type Card, type GameEvent, type GameState, type Move, type Target, allTargets, applyMove, channelsDone, isLegal, newGame, score } from '../game/engine'
import { chooseMove } from '../game/bot'
import { PlayingCard } from './PlayingCard'

const HUMAN = 0
const BOT = 1
const NAMES = ['Sen', 'Bilgisayar']
const BOT_DELAY = 900

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

interface Props {
  target: number
  onExit: () => void
}

export function Game({ target, onExit }: Props) {
  const [game, setGame] = useState<GameState>(() => newGame(2, HUMAN))
  const [wins, setWins] = useState([0, 0])
  const [selected, setSelected] = useState<string | null>(null)
  const [toast, setToast] = useState<GameEvent | null>(null)

  const commit = (next: GameState) => {
    setGame(next)
    setSelected(null)
    const e = next.lastEvent
    if (e && (e.kind === 'pisti' || e.kind === 'channelPisti')) setToast(e)
    if (next.finished) {
      const [a, b] = score(next).map((l) => l.total)
      if (a !== b) setWins((w) => w.map((n, i) => n + (i === (a > b ? 0 : 1) ? 1 : 0)))
    }
  }

  // Bilgisayarın sırası
  useEffect(() => {
    if (game.finished || game.turn !== BOT) return
    const t = setTimeout(() => commit(applyMove(game, BOT, chooseMove(game, BOT))), BOT_DELAY)
    return () => clearTimeout(t)
  }, [game])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1400)
    return () => clearTimeout(t)
  }, [toast])

  const myTurn = !game.finished && game.turn === HUMAN
  const canPlay = (t: Target) => myTurn && !!selected && isLegal(game, HUMAN, { cardId: selected, target: t })
  const play = (move: Move) => {
    if (isLegal(game, HUMAN, move)) commit(applyMove(game, HUMAN, move))
  }

  const onCardClick = (card: Card) => {
    if (!myTurn) return
    if (selected !== card.id) return setSelected(card.id)
    // Aynı karta ikinci dokunuş: tek seçenek varsa oyna
    const legal = allTargets(game).filter((t) => isLegal(game, HUMAN, { cardId: card.id, target: t }))
    if (legal.length === 1) play({ cardId: card.id, target: legal[0] })
    else setSelected(null)
  }

  const onTargetClick = (t: Target) => {
    if (selected && canPlay(t)) play({ cardId: selected, target: t })
  }

  let status: string
  if (game.finished) status = 'Oyun bitti'
  else if (game.turn === BOT) status = 'Bilgisayar düşünüyor…'
  else if (game.mustFill !== null) status = `${game.mustFill + 1}. yer boş! Oraya bir kart atmak zorundasın`
  else if (selected) status = 'Nereye atacaksın? Parlayan yere dokun'
  else status = 'Sıra sende — bir kart seç'

  const twoPiles = channelsDone(game)
  const renderPile = (index: number) => {
    const pile = game.piles[index]
    const t: Target = { kind: 'pile', index }
    const must = game.mustFill === index
    const visible = pile.slice(-3)
    return (
      <div className="zone">
        <div className="zone-label">
          {twoPiles ? `${index + 1}. Yer` : 'Yer'} {pile.length > 0 && <small>({pile.length})</small>}
        </div>
        <div className={'slot slot--pile' + (canPlay(t) ? ' slot--hot' : '') + (must ? ' slot--must' : '')} onClick={() => onTargetClick(t)}>
          {visible.length === 0 && <span className="slot-text">{must ? 'Kart at' : 'Boş'}</span>}
          {visible.map((c, i) => {
            const idx = pile.length - visible.length + i
            const rot = ((idx * 37) % 17) - 8
            return (
              <PlayingCard
                key={c.id}
                card={c}
                faceDown={index === 0 && idx < game.hiddenInPile}
                style={{ position: 'absolute', transform: `rotate(${rot}deg) translate(${i * 3}px, ${i * 2}px)` }}
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
      <div className="game">
        <header className="topbar">
          <button className="icon-btn" onClick={onExit} aria-label="Menüye dön">
            ←
          </button>
          <div className="match-score">
            <span>Sen {wins[HUMAN]}</span>
            <span className="match-target">{target} alan kazanır</span>
            <span>{wins[BOT]} Bilgisayar</span>
          </div>
          <div className="deck-count" title="Destede kalan kart">
            <PlayingCard faceDown small />
            <span>{game.deck.length}</span>
          </div>
        </header>

        <section className={'player player--top' + (game.turn === BOT && !game.finished ? ' player--active' : '')}>
          <div className="hand hand--opponent">
            {game.hands[BOT].map((c) => (
              <PlayingCard key={c.id} faceDown small />
            ))}
          </div>
          <PlayerInfo name={NAMES[BOT]} game={game} p={BOT} />
        </section>

        <section className="board">
          {twoPiles ? (
            renderPile(1)
          ) : (
            <div className="zone">
              <div className="zone-label">Pişti Kanalları</div>
              <div className="zone-cards">
                {game.channels.map((ch, i) => {
                  const t: Target = { kind: 'channel', index: i }
                  return (
                    <div key={i} className={'slot' + (canPlay(t) ? ' slot--hot' : '')} onClick={() => onTargetClick(t)}>
                      {ch ? <PlayingCard card={ch} /> : <span className="slot-text">Pişti oldu</span>}
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
          {game.lastEvent && <div className="status-last">{describe(game.lastEvent, game.piles.length)}</div>}
        </div>

        <section className={'player player--bottom' + (myTurn ? ' player--active' : '')}>
          <PlayerInfo name={NAMES[HUMAN]} game={game} p={HUMAN} />
          <div className="hand">
            {game.hands[HUMAN].map((c) => (
              <PlayingCard key={c.id} card={c} selected={selected === c.id} disabled={!myTurn} onClick={() => onCardClick(c)} />
            ))}
          </div>
        </section>

        {toast && (
          <div className="toast" key={toast.card.id}>
            <div className="toast-title">PİŞTİ!</div>
            <div className="toast-sub">
              {NAMES[toast.player]} +{toast.points}
            </div>
          </div>
        )}

        {game.finished && (
          <ResultModal
            game={game}
            wins={wins}
            target={target}
            matchOver={matchOver}
            onNext={() => {
              if (matchOver) setWins([0, 0])
              setGame(newGame(2, 1 - game.starter))
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
