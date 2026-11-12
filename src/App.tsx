import { useEffect, useState } from 'react'
import { App as NativeApp } from '@capacitor/app'
import { Icon } from './components/Icon'
import { Game } from './components/Game'
import { HowToPlay } from './components/HowToPlay'
import { SettingsPanel } from './components/SettingsPanel'
import { StatsScreen } from './components/StatsScreen'
import { InstallHint } from './components/InstallHint'
import { ConfirmDialog } from './components/ConfirmDialog'
import { applyTheme, useSettings } from './game/settings'
import { modeLabel, sideShortNames } from './game/players'
import { type SavedMatch, clearMatch, loadMatch } from './game/save'

type Screen =
  | { name: 'menu' }
  | { name: 'howto' }
  | { name: 'settings' }
  | { name: 'stats' }
  | { name: 'bot'; target: number; players: number; teamMode: boolean; resume: SavedMatch | null }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' })
  const [target, setTarget] = useState(3)
  const [players, setPlayers] = useState(2)
  const [teamMode, setTeamMode] = useState(true)
  const [askNew, setAskNew] = useState(false)
  const toMenu = () => setScreen({ name: 'menu' })
  const settings = useSettings()
  useEffect(() => applyTheme(settings), [settings])

  // Telefonun geri tuşu: açık pencereyi kapatır, ekrandaysan menüye döner, menüdeysen çıkar
  useEffect(() => {
    const h = NativeApp.addListener('backButton', () => {
      if (askNew) setAskNew(false)
      else if (screen.name !== 'menu') toMenu()
      else void NativeApp.exitApp()
    })
    return () => void h.then((l) => l.remove())
  }, [screen, askNew])

  const startNew = () => {
    setAskNew(false)
    clearMatch()
    setScreen({ name: 'bot', target, players, teamMode: players === 4 && teamMode, resume: null })
  }

  if (screen.name === 'bot')
    return <Game target={screen.target} players={screen.players} teamMode={screen.teamMode} resume={screen.resume} onExit={toMenu} />
  if (screen.name === 'howto') return <HowToPlay onBack={toMenu} />
  if (screen.name === 'settings') return <SettingsPanel onClose={toMenu} />
  if (screen.name === 'stats') return <StatsScreen onBack={toMenu} />

  // Menüye her dönüşte kayıt yeniden okunur
  const saved = loadMatch()

  return (
    <div className="table">
      <div className="menu">
        <InstallHint />
        <img className="menu-logo" src="./favicon.svg" alt="" />
        <h1 className="title">
          Çift Kanallı
          <span>Pişti</span>
        </h1>

        {saved && (
          <button
            className="btn btn--primary"
            onClick={() => setScreen({ name: 'bot', target: saved.target, players: saved.game.playerCount, teamMode: !!saved.game.teams, resume: saved })}
          >
            Oyuna Devam Et
            <small className="btn-sub">
              {modeLabel(saved.game)} · {sideShortNames(saved.game).map((n, i) => `${n} ${saved.wins[i]}`).join(' – ')}
            </small>
          </button>
        )}

        <div className="menu-section">
          <div className="menu-label">Kaç kişi?</div>
          <div className="segmented">
            {[2, 3, 4].map((n) => (
              <button key={n} className={n === players ? 'active' : ''} onClick={() => setPlayers(n)}>
                {n}
              </button>
            ))}
          </div>
          {players === 4 && (
            <div className="segmented segmented--text">
              <button className={teamMode ? 'active' : ''} onClick={() => setTeamMode(true)}>
                Eşli
              </button>
              <button className={!teamMode ? 'active' : ''} onClick={() => setTeamMode(false)}>
                Tekli
              </button>
            </div>
          )}
          {players > 2 && (
            <div className="menu-hint">
              {players === 4 && teamMode ? 'Sen ve karşındaki bilgisayar bir takımsınız' : `Sen ve ${players - 1} bilgisayar`}
            </div>
          )}
        </div>

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
          onClick={() => (saved ? setAskNew(true) : startNew())}
        >
          {saved ? 'Yeni Maç (Bilgisayara Karşı)' : 'Bilgisayara Karşı Oyna'}
        </button>
        <div className="menu-row">
          <button className="btn" onClick={() => setScreen({ name: 'howto' })}>
            <span className="menu-icon"><Icon name="book" size={22} /></span>
            Kurallar
          </button>
          <button className="btn" onClick={() => setScreen({ name: 'stats' })}>
            <span className="menu-icon"><Icon name="chart" size={22} /></span>
            İstatistik
          </button>
          <button className="btn" onClick={() => setScreen({ name: 'settings' })}>
            <span className="menu-icon"><Icon name="gear" size={22} /></span>
            Ayarlar
          </button>
        </div>
      </div>
      {askNew && <ConfirmDialog text="Yarım kalan maç silinecek. Yeni maç başlasın mı?" yes="Yeni Maç" onYes={startNew} onNo={() => setAskNew(false)} />}
    </div>
  )
}
