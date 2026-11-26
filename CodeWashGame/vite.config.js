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
                lines: 17,
                statements: 17,
                functions: 18,
                branches: 11,
                // Modules already under characterization tests must stay covered.
                'src/utils/{gameUtils,achievementUtils,mobDisplayUtils}.js': {
                    lines: 95,
                    statements: 95,
                    functions: 100,
                },
            },
        },
    },
});
