import { useState } from 'react'

const KEY = 'cift-kanalli-pisti:ana-ekran-ipucu-kapali'

/** iPhone/iPad'de Safari'den açıldıysa (ana ekrandan değil) */
function isIosBrowser(): boolean {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
  return ios && !standalone
}

function dismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** iPhone'da "Ana Ekrana Ekle" ipucu */
export function InstallHint() {
  const [show, setShow] = useState(() => isIosBrowser() && !dismissed())
  if (!show) return null

  const close = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // yok say
    }
    setShow(false)
  }

  return (
    <div className="install-hint">
      <button className="install-close" onClick={close} aria-label="Kapat">
        ×
      </button>
      <b>Uygulama gibi oyna</b>
      <span>
        Safari'de alttaki <span className="install-share">⬆︎</span> Paylaş düğmesine dokun, sonra <b>“Ana Ekrana Ekle”</b> de.
      </span>
    </div>
  )
}
