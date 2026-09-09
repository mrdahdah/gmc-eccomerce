import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Workbox generates /sw.js (precache + offline shell) and pulls in our
      // hand-written push/notificationclick handlers from public/push-sw.js.
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      // src/features/notifications/push.ts owns registration, because it has to
      // hold on to the registration object to subscribe to push anyway.
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png', 'push-sw.js'],
      manifest: {
        name: 'GoMyCode Games',
        short_name: 'GMC Games',
        description: 'Buy and sell games, gear and accessories.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#a34f32',
        background_color: '#f2efe8',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Browse products', url: '/products' },
          { name: 'My cart', url: '/cart' },
          { name: 'My orders', url: '/orders' },
        ],
      },
      workbox: {
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // The SPA shell answers every navigation; API calls must never be
        // served from it, or an offline tab would render HTML into fetch().
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            // Product imagery: cheap to re-fetch, expensive to wait for.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'gmc-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Catalog reads stay fresh when online but survive a dropped
            // connection. Anything that mutates state is deliberately excluded.
            urlPattern: ({ url, request }) =>
              request.method === 'GET' && /\/api\/(products|categories|storefront)/.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gmc-catalog',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: {
        // Push needs a real service worker in dev too, otherwise the only way
        // to test a subscription is against a production build.
        enabled: true,
        type: 'classic',
        navigateFallback: 'index.html',
      },
    }),
  ],
});
