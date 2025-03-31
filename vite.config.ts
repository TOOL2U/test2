import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  // Add history API fallback for SPA routing
  preview: {
    port: 5173
  },
  build: {
    outDir: 'dist',
  },
  // This ensures that the router works with direct URL access
  base: '/'
});
