import { myName } from '../game/players'
import { resetStats, useStats } from '../game/stats'

const pct = (a: number, b: number) => (b ? `%${Math.round((a / b) * 100)}` : '–')

function Tile({ label, value, sub, gold }: { label: string; value: number | string; sub?: string; gold?: boolean }) {
  return (
    <div className={'stat-tile' + (gold ? ' stat-tile--gold' : '')}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export function StatsScreen({ onBack }: { onBack: () => void }) {
  const s = useStats()
  const totalPisti = s.pisti + s.kanalPisti + s.valePisti

  return (
    <div className="table">
      <div className="howto">
        <header className="topbar">
          <button className="icon-btn" onClick={onBack} aria-label="Menüye dön">
            ←
          </button>
          <h2 className="howto-title">İstatistikler</h2>
          <span style={{ width: 38 }} />
        </header>

        <div className="howto-body">
          <p className="howto-intro">
            {myName() === 'Sen' ? 'Bilgisayara karşı oynadığın bütün maçlar' : `${myName()}, bilgisayara karşı oynadığın bütün maçlar`}
          </p>

          <h3 className="stat-heading">Maçlar</h3>
          <div className="stat-grid">
            <Tile label="Oynanan maç" value={s.matches} />
            <Tile label="Kazanılan maç" value={s.matchesWon} sub={pct(s.matchesWon, s.matches)} gold />
            <Tile label="Galibiyet serisi" value={s.streak} sub={`En iyi: ${s.bestStreak}`} />
          </div>

          <h3 className="stat-heading">Oyunlar</h3>
          <div className="stat-grid">
            <Tile label="Oynanan oyun" value={s.games} />
            <Tile label="Kazanılan oyun" value={s.gamesWon} sub={pct(s.gamesWon, s.games)} gold />
            <Tile label="En yüksek puan" value={s.bestScore} sub="bir oyunda" />
          </div>

          <h3 className="stat-heading">Piştiler</h3>
          <div className="stat-grid">
            <Tile label="Toplam pişti" value={totalPisti} gold />
            <Tile label="Yerde pişti" value={s.pisti} />
            <Tile label="Kanal piştisi" value={s.kanalPisti} />
            <Tile label="Vale piştisi" value={s.valePisti} gold={s.valePisti > 0} />
            <Tile label="Oyun başına" value={s.games ? (totalPisti / s.games).toFixed(1) : '–'} sub="pişti" />
          </div>

          <button
            className="btn stat-reset"
            onClick={() => {
              if (confirm('Bütün istatistikler silinecek. Emin misin?')) resetStats()
            }}
          >
            İstatistikleri sıfırla
          </button>
        </div>
      </div>
    </div>
  )
}
