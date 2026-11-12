// Aç/kapa düğmesi (ayarlar ekranı)

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button className={'toggle' + (on ? ' toggle--on' : '')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span className="toggle-knob" />
    </button>
  )
}
