// Oyuncunun adı, topladığı kart sayısı ve piştileri
import type { GameState } from '../game/engine'
import { Icon } from './Icon'

export function PlayerInfo({ name, game, p }: { name: string; game: GameState; p: number }) {
  return (
    <div className="player-info">
      <span className="player-name">{name}</span>
      <span className="chip" title="Toplanan kart">
        <Icon name="cards" size={13} /> {game.captured[p].length}
      </span>
      {game.pistiCount[p] > 0 && <span className="chip chip--gold">Pişti ×{game.pistiCount[p]}</span>}
    </div>
  )
}
