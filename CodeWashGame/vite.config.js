import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for Electron compatibility
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/**/*.test.{js,jsx}', 'src/main.jsx'],
      reporter: ['text-summary', 'text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      // Ratchet: global floors sit just under the measured coverage and must only go up.
      // Lowering one is debt and must be recorded in docs/DEBT.md.
      thresholds: {
        lines: 24,
        statements: 24,
        functions: 40,
        branches: 65,
        // Modules already under characterization tests must stay covered.
        'src/utils/{gameUtils,achievementUtils,mobDisplayUtils}.js': {
          lines: 95,
          statements: 95,
          functions: 100,
        },
      },
    },
  },
})
