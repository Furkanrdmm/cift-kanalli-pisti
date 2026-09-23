// Bilgisayar rakibi: gördüğü kartları sayar, basit puanlama ile hamle seçer
import { type Card, type GameState, type Move, type Rank, cardValue, legalMoves, pileTop } from './engine'

function seenCounts(s: GameState, player: number): Map<Rank, number> {
  const seen = new Map<Rank, number>()
  const add = (c: Card | null) => c && seen.set(c.rank, (seen.get(c.rank) ?? 0) + 1)
  s.captured.flat().forEach(add)
  s.piles.forEach((pile, i) => pile.slice(i === 0 ? s.hiddenInPile : 0).forEach(add))
  s.channels.forEach(add)
  s.hands[player].forEach(add)
  return seen
}

export function chooseMove(s: GameState, player: number): Move {
  const moves = legalMoves(s, player)
  const seen = seenCounts(s, player)
  const unseen = (r: Rank) => 4 - (seen.get(r) ?? 0)
  const jacksOut = unseen('J') > 0

  const evaluate = (m: Move): number => {
    const card = s.hands[player].find((c) => c.id === m.cardId)!
    let v = Math.random() * 0.5

    if (m.target.kind === 'channel') return v + 100 + (card.rank === 'J' ? 20 : 10) + cardValue(card) * 4

    if (s.mustFill !== null) {
      // Boş yere tek kart kalacak: rakibin pişti yapamayacağı kartı koy, değerli kartları ve valeyi sakla
      return v - unseen(card.rank) * 10 - cardValue(card) * 3 - (card.rank === 'J' ? 6 : 0)
    }

    const pile = s.piles[m.target.index]
    const top = pileTop(pile)
    const pileValue = pile.reduce((sum, c) => sum + cardValue(c), 0)

    if (top && (top.rank === card.rank || card.rank === 'J')) {
      const isPisti = pile.length === 1 && top.rank === card.rank
      v += 20 + (pileValue + cardValue(card)) * 4 + pile.length * 0.6
      if (isPisti) v += card.rank === 'J' ? 60 : 30
      else if (card.rank === 'J' && pileValue === 0 && pile.length < 4) v -= 18 // valeyi boşa harcama
      return v
    }

    // Kart atma: rakibe fırsat verme
    v -= cardValue(card) * 3
    if (card.rank === 'J') v -= 10
    if (s.channels.some((c) => c && c.rank === card.rank)) v -= 4 // kanal piştisi fırsatını harcama
    if (s.piles.some((p, i) => i !== m.target.index && pileTop(p)?.rank === card.rank)) v -= 6 // öbür yeri alabilecek kartı harcama
    if (pile.length === 0) {
      v -= unseen(card.rank) * 4 // tek kart kalır, rakip pişti yapabilir
    } else {
      const risk = Math.min(1, unseen(card.rank) * 0.25 + (jacksOut ? 0.4 : 0))
      v -= risk * ((pileValue + cardValue(card)) * 3 + pile.length * 0.5)
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
