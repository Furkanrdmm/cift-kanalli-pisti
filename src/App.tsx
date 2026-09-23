import { useState } from 'react'
import { Game } from './components/Game'
import { HowToPlay } from './components/HowToPlay'

type Screen = { name: 'menu' } | { name: 'howto' } | { name: 'bot'; target: number }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [target, setTarget] = useState(3)

  if (screen.name === 'bot') return <Game target={screen.target} onExit={() => setScreen({ name: 'menu' })} />
  if (screen.name === 'howto') return <HowToPlay onBack={() => setScreen({ name: 'menu' })} />

  return (
    <div className="table">
      <div className="menu">
        <h1 className="title">
          Çift Kanallı
          <span>Pişti</span>
        </h1>

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

        <button className="btn btn--primary" onClick={() => setScreen({ name: 'bot', target })}>
          Bilgisayara Karşı Oyna
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
