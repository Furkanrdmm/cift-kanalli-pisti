import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Göreli yollar: hem Android içinde hem sitede /oyna/ altında çalışsın
  base: './',
})
