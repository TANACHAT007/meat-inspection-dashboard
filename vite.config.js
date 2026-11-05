import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves the site under /<repo>/ — keep in sync with the repository name
const BASE = '/meat-inspection-dashboard/'

export default defineConfig({
  base: BASE,
  define: { __BUILD__: JSON.stringify(String(Date.now())) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'offline.html'],
      manifest: {
        name: 'Meat Inspection Dashboard — สถานีตรวจเนื้อ',
        short_name: 'Meat Inspect',
        description: 'แดชบอร์ดผลตรวจคุณภาพเนื้อวัวบนสายพาน',
        theme_color: '#c2303f', background_color: '#fbf7f6', display: 'standalone', start_url: BASE, scope: BASE,
        icons: [{ src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        navigateFallback: BASE + 'index.html',
        globIgnores: ['**/img/**', '**/model/**'],
        runtimeCaching: [
          { urlPattern: /\/model\//, handler: 'CacheFirst', options: { cacheName: 'machine-model', expiration: { maxEntries: 3 } } },
          { urlPattern: /\/img\//, handler: 'CacheFirst', options: { cacheName: 'machine-images', expiration: { maxEntries: 40 } } },
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts' } },
        ],
      },
    }),
  ],
})
