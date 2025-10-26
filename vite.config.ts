
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envPrefix: 'VITE_',
  server: {
    port: 8080,
    host: true, // Changed from "::" to true to enable all network interfaces properly
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectRegister: false,
      includeAssets: ['favicon.ico', 'ninjado-logo-180.png', 'ninjado-logo-192.png', 'ninjado-logo-512.png', 'logo.png'],
      manifest: {
        name: 'NinjaDo - Master Your Routine',
        short_name: 'NinjaDo',
        description: 'Transform your daily tasks into epic ninja missions',
        theme_color: '#FFAD1F',
        background_color: '#E3F2FD',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'ninjado-logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'ninjado-logo-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^\/]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
