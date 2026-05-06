const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node src/server.js',
    port: 3000,
    timeout: 10000,
    reuseExistingServer: true,
    env: { NODE_ENV: 'test', PORT: '3000' },
  },
});
