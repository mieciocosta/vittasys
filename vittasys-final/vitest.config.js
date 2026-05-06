import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    exclude: ['tests/e2e/**'],
    setupFiles: ['tests/helpers/setup.js'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
