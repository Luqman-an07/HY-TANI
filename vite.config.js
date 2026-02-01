import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa' // 1. Import Plugin PWA
import path from 'path' // 2. Import Path untuk fix leaflet

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    
    // 3. Konfigurasi PWA (Agar bisa Install di HP)
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'HY-TANI - Sistem Satelit Inklusif',
        short_name: 'HY-TANI',
        description: 'Aplikasi Monitoring Lahan Pertanian Berbasis Satelit',
        theme_color: '#064e3b', // Warna Emerald-900
        background_color: '#ffffff',
        display: 'standalone', // HILANGKAN Browser Bar (Full Screen App)
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png', // Pastikan file ini ada di folder public/
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png', // Pastikan file ini ada di folder public/
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],

  // 4. Konfigurasi Alias (Fix Leaflet Draw & Import Path)
  resolve: {
    alias: {
      // Fix untuk Leaflet Draw yang error di build process
      'leaflet-draw': path.resolve(__dirname, 'src/lib/leaflet-draw-fix.js'),
      // Opsional: Alias untuk src agar import lebih bersih (misal: @/components/...)
      '@': path.resolve(__dirname, './src'),
    }
  },
})