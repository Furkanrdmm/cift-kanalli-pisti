// Bilgisayar rakibi: gördüğü kartları sayar, basit puanlama ile hamle seçer
import { type Card, type GameState, type Move, type Rank, cardValue, legalMoves, pileTop } from './engine'

function seenCounts(s: GameState, player: number): Map<Rank, number> {
  const seen = new Map<Rank, number>()
  const add = (c: Card | null) => c && seen.set(c.rank, (seen.get(c.rank) ?? 0) + 1)
  s.captured.flat().forEach(add)
  s.pile.slice(s.hiddenInPile).forEach(add)
  s.channels.forEach(add)
  s.hands[player].forEach(add)
  return seen
}

export function chooseMove(s: GameState, player: number): Move {
  const moves = legalMoves(s, player)
  const seen = seenCounts(s, player)
  const unseen = (r: Rank) => 4 - (seen.get(r) ?? 0)
  const jacksOut = unseen('J') > 0
  const top = pileTop(s)
  const pileValue = s.pile.reduce((sum, c) => sum + cardValue(c), 0)

  const evaluate = (m: Move): number => {
    const card = s.hands[player].find((c) => c.id === m.cardId)!
    let v = Math.random() * 0.5

    if (s.mustFillChannel) {
      // Rakibin pişti yapamayacağı kartı koy, değerli kartları ve valeyi sakla
      return v - unseen(card.rank) * 10 - cardValue(card) * 3 - (card.rank === 'J' ? 6 : 0)
    }

    if (m.target.kind === 'channel') return v + 100 + (card.rank === 'J' ? 20 : 10) + cardValue(card) * 4

    if (top && (top.rank === card.rank || card.rank === 'J')) {
      const isPisti = s.pile.length === 1 && top.rank === card.rank
      v += 20 + (pileValue + cardValue(card)) * 4 + s.pile.length * 0.6
      if (isPisti) v += card.rank === 'J' ? 60 : 30
      else if (card.rank === 'J' && pileValue === 0 && s.pile.length < 4) v -= 18 // valeyi boşa harcama
      return v
    }

    // Kart atma: rakibe fırsat verme
    v -= cardValue(card) * 3
    if (card.rank === 'J') v -= 10
    if (s.channels.some((c) => c && c.rank === card.rank)) v -= 4 // kanal piştisi fırsatını harcama
    if (s.pile.length === 0) {
      v -= unseen(card.rank) * 4 // tek kart kalır, rakip pişti yapabilir
    } else {
      const risk = Math.min(1, unseen(card.rank) * 0.25 + (jacksOut ? 0.4 : 0))
      v -= risk * ((pileValue + cardValue(card)) * 3 + s.pile.length * 0.5)
    }
    return v
  }

  let best = moves[0]
  let bestScore = -Infinity
  for (const m of moves) {
    const sc = evaluate(m)
    if (sc > bestScore) [best, bestScore] = [m, sc]
  }
  return best
}
