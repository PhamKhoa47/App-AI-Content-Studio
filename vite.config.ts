import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // Hỗ trợ deploy lên sub-folder hoặc non-root domain
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'PK Creative Hub 2026',
            short_name: 'PK Creative',
            description: 'AI Content Intelligence Suite 2026',
            theme_color: '#d91b1b',
            icons: [
              {
                src: 'https://picsum.photos/seed/pk-logo/192/192',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'https://picsum.photos/seed/pk-logo/512/512',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN),
        'process.env.GA_MEASUREMENT_ID': JSON.stringify(env.GA_MEASUREMENT_ID)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true, // Sentry needs sourcemaps for better error tracking
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production',
          },
        },
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              'vendor-genai': ['@google/genai'],
              'vendor-sentry': ['@sentry/react'],
              'vendor-ga': ['react-ga4'],
            },
          },
        },
      },
    };
});
