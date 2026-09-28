import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (
            id.includes('react-dom') ||
            id.includes('/react/') ||
            id.includes('react-router') ||
            id.includes('scheduler')
          ) {
            return 'react';
          }
          if (id.includes('i18next')) return 'i18n';
          if (id.includes('highlight.js')) return 'hljs';
          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('mdast') ||
            id.includes('micromark') ||
            id.includes('unified') ||
            id.includes('hast-')
          ) {
            return 'markdown';
          }
          if (id.includes('framer-motion') || id.includes('/motion/')) return 'motion';
          if (id.includes('@tanstack')) return 'query';
          if (id.includes('date-fns')) return 'date';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
  },
});
