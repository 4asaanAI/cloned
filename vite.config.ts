import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      // ✅ Proxy to n8n to avoid HTTPS→HTTP mixed content
      '/api/n8n/chat': {
        target: 'http://localhost:5678',
        changeOrigin: true,
        secure: false,
        // Workflow is ACTIVE → use /webhook/chat
        rewrite: () => '/webhook/chat',
      },
    },
  },
  preview: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
