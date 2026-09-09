import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // The admin app registers a worker so low-stock alerts can reach an admin
    // whose tab is closed. Only the shell is cached — no API response ever is,
    // because a stale stock number is worse than a spinner.
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['push-sw.js'],
      manifest: {
        name: 'GoMyCode Games Admin',
        short_name: 'GMC Admin',
        description: 'Operations control for the GoMyCode Games storefront.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#20231f',
        background_color: '#f2efe8',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      workbox: {
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,png}'],
        navigateFallback: '/index.html',
        // No runtimeCaching at all, so every /api read goes to the network.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: { enabled: true, type: 'classic' },
    }),
  ],
});
