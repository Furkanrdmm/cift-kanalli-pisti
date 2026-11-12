import { myName } from '../game/players'
import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { StatTile } from '../components/StatTile'
import { resetStats, useStats } from '../storage/stats'

const pct = (a: number, b: number) => (b ? `%${Math.round((a / b) * 100)}` : '–')

export function StatsScreen({ onBack }: { onBack: () => void }) {
  const s = useStats()
  const [askReset, setAskReset] = useState(false)
  const totalPisti = s.pisti + s.kanalPisti + s.valePisti

  return (
    <div className="table">
      <div className="howto">
        <header className="topbar">
          <button className="icon-btn" onClick={onBack} aria-label="Menüye dön">
            <Icon name="back" />
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
            <StatTile label="Oynanan maç" value={s.matches} />
            <StatTile label="Kazanılan maç" value={s.matchesWon} sub={pct(s.matchesWon, s.matches)} gold />
            <StatTile label="Galibiyet serisi" value={s.streak} sub={`En iyi: ${s.bestStreak}`} />
          </div>

          <h3 className="stat-heading">Oyunlar</h3>
          <div className="stat-grid">
            <StatTile label="Oynanan oyun" value={s.games} />
            <StatTile label="Kazanılan oyun" value={s.gamesWon} sub={pct(s.gamesWon, s.games)} gold />
            <StatTile label="En yüksek puan" value={s.bestScore} sub="bir oyunda" />
          </div>

          <h3 className="stat-heading">Piştiler</h3>
          <div className="stat-grid">
            <StatTile label="Toplam pişti" value={totalPisti} gold />
            <StatTile label="Yerde pişti" value={s.pisti} />
            <StatTile label="Kanal piştisi" value={s.kanalPisti} />
            <StatTile label="Vale piştisi" value={s.valePisti} gold={s.valePisti > 0} />
            <StatTile label="Oyun başına" value={s.games ? (totalPisti / s.games).toFixed(1) : '–'} sub="pişti" />
          </div>

          <button
            className="btn stat-reset"
            onClick={() => setAskReset(true)}
          >
            İstatistikleri sıfırla
          </button>
        </div>
      </div>
      {askReset && (
        <ConfirmDialog
          text="Bütün istatistikler silinecek. Emin misin?"
          yes="Sıfırla"
          onYes={() => {
            resetStats()
            setAskReset(false)
          }}
          onNo={() => setAskReset(false)}
        />
      )}
    </div>
  )
}
