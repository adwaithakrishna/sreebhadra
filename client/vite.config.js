import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev the API runs on :5000; proxying keeps cookies same-origin (admin login works).
export default defineConfig({
  plugins: [react()],
  build: {
    // Vercel serves files from the repository's root public/ directory.
    outDir: process.env.VERCEL ? '../public' : 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
});
