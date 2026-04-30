import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import Terminal from 'vite-plugin-terminal';

import packageJson from './package.json' assert { type: 'json' };

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isProd = mode === 'production';

  return {
    // Path aliases — avoids deep relative imports like '../../../components'
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@services': path.resolve(__dirname, './src/services'),
      },
    },

    plugins: [
      react(),
      // Only load Terminal plugin in dev — no overhead in production builds
      isDev &&
        Terminal({
          console: 'terminal',
          output: ['terminal', 'console'],
        }),
    ].filter(Boolean),

    server: {
      port: 5173,
      strictPort: true,

      // Useful if you have a backend API to proxy during dev
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
      watch: {
        // Only usePolling if you have Docker/WSL issues
        usePolling: process.platform === 'win32', // or env var
        interval: 300, // 100ms is heavy on CPU
        ignored: ['/src-tauri/target/**', '**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
      hmr: {
        overlay: true, // Show errors as overlay in browser
      },
    },

    clearScreen: true,

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      target: 'esnext',
      modulePreload: false,
      sourcemap: isDev, // Source maps only in dev (smaller prod bundle)
      reportCompressedSize: false,
      minify: isProd ? 'esbuild' : false,
      esbuild: {
        target: 'es2020', // or 'chrome89' — actual syntax target
        legalComments: 'none', // strip licenses to reduce bundle
      },
      cssCodeSplit: true, // Split CSS per chunk (default, but explicit)
      cssMinify: 'esbuild', // Faster than cssnano
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React ecosystem → one chunk
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            // Other node_modules → another chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            // Large libs you want separate (example)
            if (id.includes('node_modules/lodash') || id.includes('node_modules/moment')) {
              return 'utils';
            }
          },
          // Keep your file naming
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || '';
            if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(info)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|ttf|otf|eot)$/i.test(info)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            return 'assets/[ext]/[name]-[hash][extname]';
          },
        },
      },

      // Warn when a chunk exceeds this size (kb) — helps catch bundle bloat
      chunkSizeWarningLimit: 600,
    },

    // Optimize cold starts — pre-bundle known heavy deps
    optimizeDeps: {
      include: ['react', 'react-dom'],
      exclude: [], // add libs that don't need pre-bundling
      force: false, // set true only when deps stuck
    },

    // Expose env vars to your app (access via import.meta.env.VITE_*)
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
  };
});
