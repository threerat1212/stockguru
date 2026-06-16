import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/unit/**/*.{test,spec}.{ts,tsx}'],
    // Force React through Vite's transform pipeline so its index.js reads
    // NODE_ENV and resolves the development build (which supports act()).
    // Without this, plugin-react v6+ serves the production build and
    // @testing-library/react throws "act(...) not supported in production".
    server: {
      deps: {
        inline: ['react', 'react-dom'],
      },
    },
    env: {
      NODE_ENV: 'development',
    },
    coverage: {
      reporter: ['text', 'json-summary', 'json'],
      exclude: ['node_modules/', '__tests__/', '.next/'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
