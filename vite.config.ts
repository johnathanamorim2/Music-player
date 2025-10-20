import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa'; // Importando o plugin

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(), 
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'], // Adicionando webp
        globIgnores: ['**/ignore-me.js', '**/*.map'], // ✅ substitui "exclude"
      },
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'placeholder.svg', 'background.webp'], // Adicionando background.webp
      manifest: {
        name: 'Leccor Music PWA',
        short_name: 'LeccorMusic',
        description: 'Encontre e salve suas músicas favoritas para ouvir offline.',
        theme_color: '#5b21b6', // Cor roxa (purple-700)
        background_color: '#111827', // Cor de fundo (gray-900)
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));