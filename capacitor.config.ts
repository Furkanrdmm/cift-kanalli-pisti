import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.nekank.ciftkanallipisti',
  appName: 'Çift Kanallı Pişti',
  webDir: 'dist',
  // Şeffaf: oyun yüklenene kadar arkadaki tam ekran giriş görseli görünür
  backgroundColor: '#00000000',
  // Saat ve pil simgeleri açık renk; oyun ekranın tamamına çizilir (kenar boşluklarını CSS ayarlar)
  plugins: { SystemBars: { style: 'DARK', initialViewportFitValueHint: 'cover' } },
}

export default config
