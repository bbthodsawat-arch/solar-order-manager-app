import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-hot-toast', 'motion/react', 'lucide-react', 'recharts', 'date-fns'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app.js',
        // Split only dependency packages; application modules stay in Rollup's
        // native graph to avoid cross-chunk evaluation-order issues.
        manualChunks(id) {
          if (id.includes('/node_modules/recharts/')) return 'charts';
          if (id.includes('/node_modules/jspdf/')) return 'pdf';
          if (id.includes('/node_modules/html2canvas/')) return 'canvas';
          if (id.includes('/node_modules/html5-qrcode/')) return 'scanner';
          if (id.includes('/node_modules/firebase/')) return 'firebase';
          if (id.includes('/node_modules/motion/')) return 'motion';
          if (id.includes('/node_modules/lucide-react/')) return 'icons';
          if (id.includes('/node_modules/date-fns/')) return 'dates';
          if (id.includes('/node_modules/@google/genai/')) return 'genai';
          if (id.includes('/node_modules/qrcode.react/')) return 'qrcode';
          if (id.includes('/node_modules/thai-address-select/')) return 'thai-address';
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
