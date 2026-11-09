import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'charts', test: /node_modules\/(recharts|d3-|victory-vendor)/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
