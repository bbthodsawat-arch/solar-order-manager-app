import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'firebase/firestore': path.resolve(__dirname, './src/lib/firestore-compat.ts'),
      'firebase/auth': path.resolve(__dirname, './src/lib/firebase-auth-compat.ts'),
      'firebase/app': path.resolve(__dirname, './src/lib/firebase-app-compat.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react','react-dom','react/jsx-runtime','react/jsx-dev-runtime','react-hot-toast','motion/react','lucide-react','recharts','date-fns'],
  },
  build: { outDir: 'dist', emptyOutDir: true, sourcemap: false, chunkSizeWarningLimit: 2000 },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
