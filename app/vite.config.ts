import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_USE_FIREBASE_EMULATORS': JSON.stringify(mode === 'test' ? 'true' : 'false'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './@'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        // The Functions article renderer references these two stable public
        // entry files. Firebase gives them revalidation caching; lazy chunks
        // and non-entry assets keep content hashes and immutable caching.
        entryFileNames: (chunkInfo) => chunkInfo.name === 'index'
          ? 'assets/app.js'
          : 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => assetInfo.name === 'index.css'
          ? 'assets/app.css'
          : 'assets/[name]-[hash][extname]',
        manualChunks: (id) => {
          // The rich-text editor is dashboard-only and substantially larger
          // than the article form itself. Keep it out of both the public entry
          // and the page chunk so browsers can cache it independently.
          if (id.includes('/node_modules/@tiptap/') || id.includes('/node_modules/prosemirror-')) {
            return 'editor';
          }
        },
      },
    },
  },
}))
