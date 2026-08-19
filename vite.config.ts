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
    // Keep Rollup's native chunk graph. The previous hand-written vendor
    // partitioning could create cross-chunk circular evaluation order and
    // trigger browser TDZ errors such as "Cannot access 'A' before initialization".
    // Correctness is more important than the old manual split; Vite/Rollup can
    // still split dynamic imports safely without forcing module execution order.
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
