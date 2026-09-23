import type { HTMLAttributes } from 'react'
import type { Card } from '../game/engine'

const SUIT_SYMBOL = { S: '♠', H: '♥', D: '♦', C: '♣' } as const
const RANK_LABEL: Record<string, string> = { J: 'J', Q: 'Q', K: 'K', A: 'A' }

interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  card?: Card | null
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  small?: boolean
  /** Dağıtım animasyonu sürerken yerini tutsun ama görünmesin */
  hidden?: boolean
  onClick?: () => void
}

export function PlayingCard({ card, faceDown, selected, disabled, small, hidden, style, className, onClick, ...rest }: Props) {
  const cls = [
    'card',
    small && 'card--small',
    selected && 'card--selected',
    disabled && 'card--disabled',
    onClick && 'card--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const st = hidden ? { ...style, visibility: 'hidden' as const } : style

  if (faceDown || !card) {
    return (
      <div {...rest} className={cls + ' card--back'} style={st} onClick={onClick}>
        <div className="card-back-pattern" />
      </div>
    )
  }

  const red = card.suit === 'H' || card.suit === 'D'
  const sym = SUIT_SYMBOL[card.suit]
  const label = RANK_LABEL[card.rank] ?? card.rank
  return (
    <div {...rest} className={cls + (red ? ' card--red' : '')} style={st} onClick={onClick}>
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
