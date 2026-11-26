import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Use relative paths for Electron compatibility
    test: {
        environment: 'node',
        include: ['src/**/*.test.{js,jsx}'],
        coverage: {
            provider: 'v8',
            // AST-aware remapping maps V8 coverage back to the JSX source accurately.
            // Without it, mounting a component reports most of its unexecuted
            // handlers as covered (App.jsx showed 90 % of lines for 37 % real).
            experimentalAstAwareRemapping: true,
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/**/*.test.{js,jsx}', 'src/main.jsx'],
            reporter: ['text-summary', 'text', 'lcov', 'json-summary'],
            reportsDirectory: 'coverage',
            // Ratchet: global floors sit just under the measured coverage and must only go up.
            // Lowering one is debt and must be recorded in docs/DEBT.md.
            thresholds: {
                lines: 51,
                statements: 51,
                functions: 42,
                branches: 50,
                // Modules already under characterization tests must stay covered.
                'src/utils/{gameUtils,achievementUtils,mobDisplayUtils}.js': {
                    lines: 95,
                    statements: 95,
                    functions: 100,
                },
                // Save/load is characterized by mounting <App /> (App.storage.test.jsx).
                'src/App.jsx': {
                    lines: 36,
                    statements: 36,
                    functions: 29,
                    branches: 43,
                },
            },
        },
    },
});
