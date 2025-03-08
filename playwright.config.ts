import { defineConfig } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config = defineConfig({
  tsconfig: './spec/features/tsconfig.json',
  testDir: './spec/features',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    browserName: 'firefox', // default browser, we'll override this in our tests
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    headless: true,
  },

  projects: [
    {
      name: 'firefox',
      use: {
        browserName: 'firefox', // or 'chromium' for Chromium
        channel: 'firefox', // or 'chrome' for Chrome
      },
    },
    //
    // {
    //   name: 'chromium',
    //   use: { ...devices['Desktop Chrome'], headless: process.env.BROWSER !== '1' },
    // },
    //
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    //
    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  webServer: {
    command: 'yarn client',
    port: 3000,
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 10000,
  },
})

export default config
