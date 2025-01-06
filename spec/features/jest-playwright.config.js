const { defineConfig, devices } = require('@playwright/test')

module.exports = {
  launchOptions: {
    headless: process.env.BROWSER !== '1',
  },
  browsers: [
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  serverOptions: [
    {
      command: 'BROWSER=none VITE_PSYCHIC_ENV=test yarn --cwd=./client dev',
      host: 'localhost',
      debug: process.env.DEBUG === '1',
      launchTimeout: 60000,
      port: 3000,
      usedPortAction: 'kill',
      waitOnScheme: {
        verbose: process.env.DEBUG === '1',
      },
    },
  ],
}
