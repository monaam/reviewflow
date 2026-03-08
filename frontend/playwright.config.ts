import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /\.mobile\.spec\./,
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['iPhone 14'],
        // Override to use chromium instead of webkit
        browserName: 'chromium',
      },
      testMatch: /\.mobile\.spec\./,
    },
  ],
});
