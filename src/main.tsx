import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/nunito'
import '@fontsource-variable/fredoka'
import './index.css'
import App from './App.tsx'
import { unlockAudio } from './game/sound'
import { applyTheme, getSettings } from './game/settings'

unlockAudio()
applyTheme(getSettings()) // renkler ilk çizimden önce gelsin

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
