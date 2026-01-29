import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path' // TAMBAHKAN INI

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX BARU: Arahkan ke file workaround yang kita buat
      'leaflet-draw': path.resolve(__dirname, 'src/lib/leaflet-draw-fix.js') 
    }
  },
})