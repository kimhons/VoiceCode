import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const isProd = process.env.BUILD_MODE === 'prod'

export default defineConfig({
  plugins: [
    react(), 
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast'
          ],
          'audio-vendor': [
            'lucide-react',
            'embla-carousel-react'
          ],
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],
          'chart-vendor': [
            'recharts'
          ],
          'util-vendor': [
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'date-fns'
          ]
        },
        // Ensure consistent chunk names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.tsx', '').replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          if (/\.(mp3|wav|ogg)$/i.test(assetInfo.name!)) {
            return `audio/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|webp)$/i.test(assetInfo.name!)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name!)) {
            return `fonts/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: !isProd,
    // Minify options
    minify: isProd ? 'terser' : false,
    terserOptions: isProd ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    } : undefined
  },
  server: {
    // Enable compression for dev server
    compress: true,
    // Optimize HMR
    hmr: {
      overlay: true
    },
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      'lucide-react'
    ],
    exclude: [
      // Exclude workers from optimization
      '/public/workers/ai-processor.worker.js'
    ]
  },
  // Worker configuration
  worker: {
    format: 'es'
  },
  // CSS optimization
  css: {
    devSourcemap: !isProd,
    preprocessorOptions: {
      scss: {
        additionalData: `@use "sass:color";`
      }
    }
  },
  // Enable experimental features for better performance
  esbuild: {
    // Drop console in production
    drop: isProd ? ['console', 'debugger'] : [],
    // Target modern browsers
    target: 'es2020',
    // Enable tree shaking
    treeShaking: true
  }
})

