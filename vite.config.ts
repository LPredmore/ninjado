
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  envPrefix: 'VITE_',
  server: {
    port: 8080,
    host: true, // Changed from "::" to true to enable all network interfaces properly
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
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
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
