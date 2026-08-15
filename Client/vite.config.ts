import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Dev-only proxy: lets the local page call the production API/media same-origin
    // (server-to-server, so no browser Origin header — the API's CORS layer 500s on
    // unknown localhost origins otherwise). Only active for `vite`/`vite dev`.
    proxy: {
      '/api': { target: 'https://api.buymediamonds.co.uk', changeOrigin: true, secure: true },
      '/uploads': { target: 'https://api.buymediamonds.co.uk', changeOrigin: true, secure: true },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsInlineLimit: 4096,
    copyPublicDir: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        chat: path.resolve(__dirname, 'chat.html'),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.mp4') || assetInfo.name?.endsWith('.webm')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
        // Split vendor libraries into separate cached chunks
        // NOTE: React and react-router must NOT be in separate chunks from the
        // libs that depend on them (framer-motion, radix, etc.) — Rollup's
        // module evaluation order can leave React undefined when they init.
        manualChunks: (id) => {
          // Stripe (only used on checkout — very large, truly independent)
          if (id.includes('node_modules/@stripe/') || id.includes('node_modules/stripe')) {
            return 'vendor-stripe';
          }
          // Charts (only used in admin — large, truly independent)
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-') || id.includes('node_modules/victory-')) {
            return 'vendor-recharts';
          }
          // Socket.io (chat only — independent)
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // All other node_modules (React, router, radix, framer-motion, etc.)
          // kept together so React initialises before its dependents
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
