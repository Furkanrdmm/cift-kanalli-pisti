import { CARD_BACKS, FELTS, type Speed, updateSettings, useSettings } from '../game/settings'
import { PlayingCard } from './PlayingCard'
import { haptic } from '../game/haptics'
import { sfx } from '../game/sound'

const SPEEDS: [Speed, string][] = [
  ['slow', 'Yavaş'],
  ['normal', 'Normal'],
  ['fast', 'Hızlı'],
]

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className={'toggle' + (on ? ' toggle--on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span className="toggle-knob" />
    </button>
  )
}

/** Ayarlar: menüden tam ekran, oyun içinden pencere olarak açılır */
export function SettingsPanel({ onClose, asModal }: { onClose: () => void; asModal?: boolean }) {
  const s = useSettings()

  const body = (
    <>
      <div className="settings-row">
        <span>Adın</span>
        <input
          className="name-input"
          type="text"
          maxLength={14}
          placeholder="Sen"
          value={s.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
          aria-label="Adın"
        />
      </div>

      <div className="settings-row settings-row--col">
        <span>Masa rengi</span>
        <div className="swatches">
          {FELTS.map(([k, label]) => (
            <button key={k} className={'swatch swatch--felt-' + k + (s.felt === k ? ' swatch--on' : '')} onClick={() => updateSettings({ felt: k })}>
              <span className="swatch-color" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row settings-row--col">
        <span>Kart arkası</span>
        <div className="swatches">
          {CARD_BACKS.map(([k, label]) => (
            <button key={k} className={'swatch swatch--back' + (s.cardBack === k ? ' swatch--on' : '')} data-back={k} onClick={() => updateSettings({ cardBack: k })}>
              <PlayingCard faceDown small />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <span>Ses efektleri</span>
        <Toggle
          label="Ses efektleri"
          on={s.sound}
          onChange={(v) => {
            updateSettings({ sound: v })
            if (v) sfx.tick()
          }}
        />
      </div>

      <div className={'settings-row' + (s.sound ? '' : ' settings-row--off')}>
        <span>Ses seviyesi</span>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.1}
          value={s.volume}
          disabled={!s.sound}
          onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
          onPointerUp={() => sfx.land()}
          aria-label="Ses seviyesi"
        />
      </div>

      <div className="settings-row">
        <span>Titreşim</span>
        <Toggle
          label="Titreşim"
          on={s.vibration}
          onChange={(v) => {
            updateSettings({ vibration: v })
            if (v) haptic.pisti()
          }}
        />
      </div>

      <div className="settings-row settings-row--col">
        <span>Oyun hızı</span>
        <div className="segmented segmented--text">
          {SPEEDS.map(([k, label]) => (
            <button key={k} className={s.speed === k ? 'active' : ''} onClick={() => updateSettings({ speed: k })}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={'settings-row settings-row--col' + (s.sound ? '' : ' settings-row--off')}>
        <span>Sesleri dene</span>
        <div className="sound-tests">
          <button className="chip-btn" disabled={!s.sound} onClick={() => sfx.pisti()}>
            Pişti
          </button>
          <button className="chip-btn" disabled={!s.sound} onClick={() => sfx.kanalPisti()}>
            Kanal piştisi
          </button>
          <button className="chip-btn" disabled={!s.sound} onClick={() => sfx.valePisti()}>
            Vale piştisi
          </button>
          <button
            className="chip-btn"
            disabled={!s.sound}
            onClick={() => {
              sfx.play()
              setTimeout(() => sfx.land(), 300)
            }}
          >
            Kart atma
          </button>
          <button className="chip-btn" disabled={!s.sound} onClick={() => sfx.collect()}>
            Yeri alma
          </button>
          <button className="chip-btn" disabled={!s.sound} onClick={() => sfx.win()}>
            Kazanma
          </button>
        </div>
      </div>
    </>
  )

  if (asModal) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
          <h2>Ayarlar</h2>
          {body}
          <button className="btn btn--primary settings-done" onClick={onClose}>
            Tamam
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="table">
      <div className="howto">
        <header className="topbar">
          <button className="icon-btn" onClick={onClose} aria-label="Menüye dön">
            ←
          </button>
          <h2 className="howto-title">Ayarlar</h2>
          <span style={{ width: 38 }} />
        </header>
        <div className="howto-body settings-body">{body}</div>
      </div>
    </div>
  )
}
