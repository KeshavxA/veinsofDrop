import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'assets/logo.png'],
      manifest: {
        name: 'veinsofDrop',
        short_name: 'veinsofDrop',
        description: 'Real-time blood donation platform connecting donors to those in urgent need.',
        theme_color: '#db2b2b',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Home', url: '/', description: 'Browse donors' },
          { name: 'My Profile', url: '/profile', description: 'Manage your profile' },
        ],
      },
      workbox: {
        // Cache the app shell + assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // Firebase / API calls — NetworkFirst so live data is preferred
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'firebase-cache', networkTimeoutSeconds: 8 },
          },
        ],
        // Serve a custom offline page when navigation fails
        navigateFallback: '/offline.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/],
      },
      devOptions: {
        // Enable in dev so you can test the install prompt
        enabled: true,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 3000,
  },
})
