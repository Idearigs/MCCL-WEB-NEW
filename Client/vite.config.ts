import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
    assetsInlineLimit: 0,
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
        manualChunks: (id) => {
          // React core — smallest, most cached chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // Stripe (only used on checkout — big chunk)
          if (id.includes('node_modules/@stripe/') || id.includes('node_modules/stripe')) {
            return 'vendor-stripe';
          }
          // Charts (only used in admin)
          if (id.includes('node_modules/recharts')) {
            return 'vendor-recharts';
          }
          // Socket.io (chat only)
          if (id.includes('node_modules/socket.io-client') || id.includes('node_modules/engine.io-client')) {
            return 'vendor-socket';
          }
          // Everything else in node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
}));
