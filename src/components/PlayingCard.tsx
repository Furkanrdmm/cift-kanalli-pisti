import type { Card } from '../game/engine'

const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' } as const
const RANK_LABEL: Record<string, string> = { J: 'J', Q: 'Q', K: 'K', A: 'A' }

interface Props {
  card?: Card | null
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  small?: boolean
  style?: React.CSSProperties
  onClick?: () => void
}

export function PlayingCard({ card, faceDown, selected, disabled, small, style, onClick }: Props) {
  const cls = ['card', small && 'card--small', selected && 'card--selected', disabled && 'card--disabled', onClick && 'card--clickable']
    .filter(Boolean)
    .join(' ')

  if (faceDown || !card) {
    return (
      <div className={cls + ' card--back'} style={style} onClick={onClick}>
        <div className="card-back-pattern" />
      </div>
    )
  }

  const red = card.suit === 'H' || card.suit === 'D'
  const sym = SUIT_SYMBOL[card.suit]
  const label = RANK_LABEL[card.rank] ?? card.rank
  return (
    <div className={cls + (red ? ' card--red' : '')} style={style} onClick={onClick}>
      <div className="card-corner card-corner--tl">
        <span>{label}</span>
        <span>{sym}</span>
      </div>
      <div className="card-center">{['J', 'Q', 'K'].includes(card.rank) ? <span className="card-face">{label}</span> : sym}</div>
      <div className="card-corner card-corner--br">
        <span>{label}</span>
        <span>{sym}</span>
      </div>
    </div>
  )
}
