import { useState } from 'react'
import { Game } from './components/Game'
import { HowToPlay } from './components/HowToPlay'
import { type SavedMatch, clearMatch, loadMatch } from './game/save'

type Screen = { name: 'menu' } | { name: 'howto' } | { name: 'bot'; target: number; resume: SavedMatch | null }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [target, setTarget] = useState(3)
  const toMenu = () => setScreen({ name: 'menu' })

  if (screen.name === 'bot') return <Game target={screen.target} resume={screen.resume} onExit={toMenu} />
  if (screen.name === 'howto') return <HowToPlay onBack={toMenu} />

  // Menüye her dönüşte kayıt yeniden okunur
  const saved = loadMatch()

  return (
    <div className="table">
      <div className="menu">
        <h1 className="title">
          Çift Kanallı
          <span>Pişti</span>
        </h1>

        {saved && (
          <button className="btn btn--primary" onClick={() => setScreen({ name: 'bot', target: saved.target, resume: saved })}>
            Oyuna Devam Et
            <small className="btn-sub">
              Maç: Sen {saved.wins[0]} – {saved.wins[1]} Bilgisayar
            </small>
          </button>
        )}

        <div className="menu-section">
          <div className="menu-label">Kaç oyun alan kazanır?</div>
          <div className="segmented">
            {[1, 3, 5].map((n) => (
              <button key={n} className={n === target ? 'active' : ''} onClick={() => setTarget(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          className={saved ? 'btn' : 'btn btn--primary'}
          onClick={() => {
            if (saved && !confirm('Yarım kalan maç silinecek. Yeni maç başlasın mı?')) return
            clearMatch()
            setScreen({ name: 'bot', target, resume: null })
          }}
        >
          {saved ? 'Yeni Maç (Bilgisayara Karşı)' : 'Bilgisayara Karşı Oyna'}
        </button>
        <button className="btn" disabled>
          Arkadaşla Online <small>(yakında)</small>
        </button>
        <button className="btn" onClick={() => setScreen({ name: 'howto' })}>
          Nasıl Oynanır?
        </button>
      </div>
    </div>
  )
}
