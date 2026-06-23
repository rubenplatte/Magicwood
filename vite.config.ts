import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Served from a subpath when deployed to GitHub Pages; override with BASE_URL.
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Magic Wood Boulders',
        short_name: 'Magic Wood',
        description:
          'Find, filter and save boulders in the Magic Wood climbing area, Switzerland.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // The boulder data for all areas is bundled into the main JS, which now
        // exceeds Workbox's 2 MiB default precache limit. Raise it so the whole
        // app shell + data is still precached for offline use at the crag.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Keep the whole app shell + bundled boulder data available offline,
        // and serve photos / map tiles from cache first (they're immutable).
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/storage\.e5gc6\.upcloudobjects\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mw-photos',
              expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // CARTO basemap + Esri World Imagery tiles
            urlPattern:
              /^https:\/\/(basemaps\.cartocdn\.com|[a-d]\.basemaps\.cartocdn\.com|server\.arcgisonline\.com)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mw-tiles',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 180 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
