import { defineConfig } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: BASE_URL,
    extraHTTPHeaders: { 'ngrok-skip-browser-warning': 'true' },
  },
  webServer: undefined, // app runs separately via `node server.js`
});
