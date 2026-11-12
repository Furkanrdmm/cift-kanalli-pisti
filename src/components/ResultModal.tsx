// Oyun bitince çıkan puan tablosu ve maç durumu
import { type GameState, gameWinner, score, sideOf, sidesOf } from '../game/engine'
import { HUMAN } from '../game/players'

export function ResultModal({
  game,
  wins,
  target,
  matchOver,
  names,
  short,
  onNext,
  onExit,
}: {
  game: GameState
  wins: number[]
  target: number
  matchOver: boolean
  names: string[]
  short: string[]
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
    if (champ === mine) title = team ? 'Maçı kazandınız!' : 'Maçı kazandın!'
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
          <button className="btn btn--primary" onClick={onNext}>
            {matchOver ? 'Yeni Maç' : 'Sonraki Oyun'}
          </button>
        </div>
      </div>
    </div>
  )
}
