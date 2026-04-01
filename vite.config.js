import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }

          if (id.includes('node_modules/@supabase/supabase-js')) {
            return 'supabase';
          }

          if (id.includes('node_modules/html5-qrcode') || id.includes('node_modules/qrcode')) {
            return 'qr';
          }

          if (
            id.includes('node_modules/react/')
            || id.includes('node_modules/react-dom/')
            || id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor';
          }

          return undefined;
        },
      },
    },
  },
})
