// Titreşim: Android'de Capacitor eklentisi, tarayıcıda navigator.vibrate (varsa)
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { getSettings } from './settings'

const safe = (p: Promise<unknown>) => void p.catch(() => {})
const on = () => getSettings().vibration

export const haptic = {
  /** Kart atma, seçme: hafif dokunuş */
  tap() {
    if (on()) safe(Haptics.impact({ style: ImpactStyle.Light }))
  },
  /** Pişti */
  pisti() {
    if (on()) safe(Haptics.notification({ type: NotificationType.Success }))
  },
  /** Vale piştisi: üç güçlü vuruş */
  valePisti() {
    if (!on()) return
    ;[0, 140, 280].forEach((ms) => setTimeout(() => safe(Haptics.impact({ style: ImpactStyle.Heavy })), ms))
  },
  /** Maçı kazandın */
  win() {
    if (on()) safe(Haptics.vibrate({ duration: 300 }))
  },
}
