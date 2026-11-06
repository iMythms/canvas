import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pwaBuild } from './scripts/pwa-build.ts';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss(), pwaBuild()],
  resolve: {
    alias: [
      // Monaco ships its own DOMPurify copy, independent of its npm dependency.
      { find: /^\.\/dompurify\/dompurify\.js$/, replacement: fileURLToPath(new URL('./node_modules/dompurify/dist/purify.es.mjs', import.meta.url)) },
    ],
  },
  build: { chunkSizeWarningLimit: 2500 },
});
