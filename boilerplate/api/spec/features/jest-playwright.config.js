const { devices } = require('@playwright/test')

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
      command: 'BROWSER=none PORT=3000 REACT_APP_PSYCHIC_ENV=test yarn --cwd=../client start',
      host: '127.0.0.1',
      debug: process.env.DEBUG === '1',
      launchTimeout: 60000,
      port: 3000,
      usedPortAction: 'kill',
      waitOnScheme: {
        verbose: process.env.DEBUG === '1',
      },
    },
    {
      command: 'FEATURE_SPEC_RUN=1 SPEC_SERVER_PORT=7779 npx ts-node --transpile-only ./src/spec-server.ts',
      host: '127.0.0.1',
      launchTimeout:
        (process.env.LAUNCH_TIMEOUT_SECONDS && parseInt(process.env.LAUNCH_TIMEOUT_SECONDS) * 1000) || 60000,
      debug: process.env.DEBUG === '1',
      port: 7779,
      usedPortAction: 'kill',
      waitOnScheme: {
        verbose: process.env.DEBUG === '1',
      },
    },
  ],
}
