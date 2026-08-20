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
        // Stable entry URL lets the HTML bootstrap wait for legacy Service Worker
        // cleanup before requesting the React module. Dynamic chunks remain hashed.
        entryFileNames: 'assets/app.js',
        // Keep application modules in Rollup's native graph, but isolate large,
        // self-contained dependencies that otherwise inflate the initial entry.
        // This avoids the old broad vendor partitioning that caused cross-chunk
        // evaluation-order issues while still reducing the startup payload.
        manualChunks(id) {
          if (id.includes('/node_modules/recharts/')) return 'charts';
          if (id.includes('/node_modules/jspdf/')) return 'pdf';
          if (id.includes('/node_modules/html2canvas/')) return 'canvas';
          if (id.includes('/node_modules/html5-qrcode/')) return 'scanner';
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
