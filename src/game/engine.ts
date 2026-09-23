// Çift Kanallı Pişti — oyun motoru (saf fonksiyonlar, arayüzden bağımsız)

export type Suit = 'S' | 'H' | 'D' | 'C' // maça, kupa, karo, sinek
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  id: string
  suit: Suit
  rank: Rank
}

export type Target = { kind: 'pile' } | { kind: 'channel'; index: number }

export interface Move {
  cardId: string
  target: Target
}

export type EventKind = 'play' | 'capture' | 'pisti' | 'channelPisti' | 'fill'

export interface GameEvent {
  player: number
  card: Card
  kind: EventKind
  points: number // pişti puanı (varsa)
}

export interface GameState {
  playerCount: number
  deck: Card[]
  hands: Card[][]
  /** Pişti kanalları. Başta 2 slot, ikisi de pişti olunca 1 slota düşer. null = boş */
  channels: (Card | null)[]
  channelMode: 'double' | 'single'
  /** Normal alan. pile[0] başlangıçta kapalı karttır. */
  pile: Card[]
  hiddenInPile: number
  captured: Card[][]
  pistiPoints: number[]
  pistiCount: number[]
  turn: number
  starter: number
  lastCapturer: number | null
  /** Kanal boşaldı, sıradaki oyuncu kanala kart atmak zorunda */
  mustFillChannel: boolean
  lastEvent: GameEvent | null
  finished: boolean
}

export const SUITS: Suit[] = ['S', 'H', 'D', 'C']
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const HAND_SIZE = 4

export function newDeck(): Card[] {
  const deck: Card[] = []
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ id: rank + suit, suit, rank })
  return deck
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Kural 3: yere açılan 4 karttan (kapalı dahil) 3'ü aynı olamaz */
function tableIsValid(cards: Card[]): boolean {
  const counts = new Map<Rank, number>()
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1)
  return [...counts.values()].every((n) => n < 3)
}

export function newGame(playerCount = 2, starter = 0): GameState {
  let deck: Card[]
  do deck = shuffle(newDeck())
  while (!tableIsValid(deck.slice(0, 4)))

  const [ch1, ch2, hidden, open] = deck.splice(0, 4)
  const state: GameState = {
    playerCount,
    deck,
    hands: Array.from({ length: playerCount }, () => []),
    channels: [ch1, ch2],
    channelMode: 'double',
    pile: [hidden, open],
    hiddenInPile: 1,
    captured: Array.from({ length: playerCount }, () => []),
    pistiPoints: Array(playerCount).fill(0),
    pistiCount: Array(playerCount).fill(0),
    turn: starter,
    starter,
    lastCapturer: null,
    mustFillChannel: false,
    lastEvent: null,
    finished: false,
  }
  deal(state)
  return state
}

/** Kartlar ilk dağıtılan oyuncudan (starter) başlayarak dağıtılır */
function deal(s: GameState) {
  for (let i = 0; i < s.playerCount; i++) {
    const p = (s.starter + i) % s.playerCount
    s.hands[p] = s.deck.splice(0, HAND_SIZE)
  }
}

export function pileTop(s: GameState): Card | null {
  return s.pile.length ? s.pile[s.pile.length - 1] : null
}

export function isLegal(s: GameState, player: number, move: Move): boolean {
  if (s.finished || s.turn !== player) return false
  const card = s.hands[player].find((c) => c.id === move.cardId)
  if (!card) return false
  const t = move.target
  if (s.mustFillChannel) return t.kind === 'channel' && s.channels[t.index] === null
  if (t.kind === 'pile') return true
  const ch = s.channels[t.index]
  // Kanala sadece pişti yapılabilir: aynı kart (vale de sadece valeyi alır)
  return !!ch && ch.rank === card.rank
}

export function legalMoves(s: GameState, player: number): Move[] {
  const moves: Move[] = []
  for (const card of s.hands[player]) {
    if (s.mustFillChannel) {
      s.channels.forEach((ch, i) => {
        if (ch === null) moves.push({ cardId: card.id, target: { kind: 'channel', index: i } })
      })
      continue
    }
    moves.push({ cardId: card.id, target: { kind: 'pile' } })
    s.channels.forEach((ch, i) => {
      if (ch && ch.rank === card.rank) moves.push({ cardId: card.id, target: { kind: 'channel', index: i } })
    })
  }
  return moves
}

export function applyMove(prev: GameState, player: number, move: Move): GameState {
  if (!isLegal(prev, player, move)) throw new Error('Geçersiz hamle')
  const s: GameState = structuredClone(prev)
  const hand = s.hands[player]
  const card = hand.splice(hand.findIndex((c) => c.id === move.cardId), 1)[0]
  const t = move.target

  if (s.mustFillChannel && t.kind === 'channel') {
    s.channels[t.index] = card
    s.mustFillChannel = false
    s.lastEvent = { player, card, kind: 'fill', points: 0 }
  } else if (t.kind === 'channel') {
    const target = s.channels[t.index]!
    const points = card.rank === 'J' ? 20 : 10
    s.captured[player].push(target, card)
    s.pistiPoints[player] += points
    s.pistiCount[player]++
    s.channels[t.index] = null
    s.lastCapturer = player
    s.lastEvent = { player, card, kind: 'channelPisti', points }
    if (s.channels.every((c) => c === null)) {
      // İki kanal da pişti oldu → artık tek kanal, sıradaki oyuncu doldurmak zorunda
      s.channelMode = 'single'
      s.channels = [null]
      s.mustFillChannel = true
    }
  } else {
    const top = pileTop(s)
    if (top && (top.rank === card.rank || card.rank === 'J')) {
      const isPisti = s.pile.length === 1 && top.rank === card.rank
      const points = isPisti ? (card.rank === 'J' ? 20 : 10) : 0
      s.captured[player].push(...s.pile, card)
      s.pile = []
      s.hiddenInPile = 0
      s.pistiPoints[player] += points
      if (isPisti) s.pistiCount[player]++
      s.lastCapturer = player
      s.lastEvent = { player, card, kind: isPisti ? 'pisti' : 'capture', points }
    } else {
      s.pile.push(card)
      s.lastEvent = { player, card, kind: 'play', points: 0 }
    }
  }

  s.turn = (player + 1) % s.playerCount

  if (s.hands.every((h) => h.length === 0)) {
    if (s.deck.length > 0) {
      deal(s)
    } else {
      // Oyun bitti: yerde kalanlar (kanallar dahil) son alana gider
      if (s.lastCapturer !== null) {
        s.captured[s.lastCapturer].push(...s.pile, ...(s.channels.filter(Boolean) as Card[]))
      }
      s.pile = []
      s.hiddenInPile = 0
      s.channels = s.channels.map(() => null)
      s.mustFillChannel = false
      s.finished = true
    }
  }
  return s
}

export function cardValue(c: Card): number {
  if (c.rank === '2' && c.suit === 'C') return 2
  if (c.rank === '10' && c.suit === 'D') return 3
  if (c.rank === 'A' || c.rank === 'J') return 1
  return 0
}

export interface ScoreLine {
  cards: number
  cardPoints: number
  mostCards: number
  pisti: number
  pistiCount: number
  total: number
}

export function score(s: GameState): ScoreLine[] {
  const counts = s.captured.map((c) => c.length)
  const max = Math.max(...counts)
  const leaders = counts.filter((n) => n === max).length
  return s.captured.map((cards, p) => {
    const cardPoints = cards.reduce((sum, c) => sum + cardValue(c), 0)
    const mostCards = counts[p] === max && leaders === 1 ? 3 : 0
    const pisti = s.pistiPoints[p]
    return {
      cards: cards.length,
      cardPoints,
      mostCards,
      pisti,
      pistiCount: s.pistiCount[p],
      total: cardPoints + mostCards + pisti,
    }
  })
}
