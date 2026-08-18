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
    include: ['react','react-dom','react/jsx-runtime','react/jsx-dev-runtime','react-hot-toast','motion/react','lucide-react','recharts','date-fns'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('/firebase/')) return 'vendor-firebase';
          if (id.includes('/recharts/') || id.includes('/date-fns/')) return 'vendor-charts';
          if (id.includes('/jspdf/') || id.includes('/html2canvas/') || id.includes('/html5-qrcode/')) return 'vendor-docs';
          if (id.includes('/@google/genai/')) return 'vendor-ai';
          if (id.includes('/motion/') || id.includes('/lucide-react/')) return 'vendor-ui';
          if (id.includes('/react/') || id.includes('/react-dom/')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
