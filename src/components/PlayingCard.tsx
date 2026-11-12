import type { HTMLAttributes } from 'react'
import { type Card, SUIT_SYMBOL } from '../game/engine'

interface Props extends HTMLAttributes<HTMLDivElement> {
  card?: Card | null
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  small?: boolean
  /** Dağıtım animasyonu sürerken yerini tutsun ama görünmesin */
  hidden?: boolean
}

export function PlayingCard({ card, faceDown, selected, disabled, small, hidden, style, className, ...rest }: Props) {
  const cls = [
    'card',
    small && 'card--small',
    selected && 'card--selected',
    disabled && 'card--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const st = hidden ? { ...style, visibility: 'hidden' as const } : style

  if (faceDown || !card) {
    return (
      <div {...rest} className={cls + ' card--back'} style={st}>
        <div className="card-back-pattern" />
      </div>
    )
  }

  const red = card.suit === 'H' || card.suit === 'D'
  const sym = SUIT_SYMBOL[card.suit]
  return (
    <div {...rest} className={cls + (red ? ' card--red' : '')} style={st}>
      <div className="card-corner card-corner--tl">
        <span>{card.rank}</span>
        <span>{sym}</span>
      </div>
      <div className="card-center">
        {['J', 'Q', 'K'].includes(card.rank) ? (
          <span className="card-face">
            <b>{card.rank}</b>
            <small>{sym}</small>
          </span>
        ) : (
          sym
        )}
      </div>
      <div className="card-corner card-corner--br">
        <span>{card.rank}</span>
        <span>{sym}</span>
      </div>
    </div>
  )
}
