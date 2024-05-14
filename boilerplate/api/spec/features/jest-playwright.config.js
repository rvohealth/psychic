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
      command: 'BROWSER=none REACT_APP_PSYCHIC_ENV=test yarn client',
      host: 'localhost',
      debug: process.env.DEBUG === '1',
      launchTimeout: 60000,
      port: 3000,
      usedPortAction: 'kill',
      waitOnScheme: {
        verbose: process.env.DEBUG === '1',
      },
    },
    {
      command:
        'APP_ROOT_PATH=$(pwd) TS_SAFE=1 FEATURE_SPEC_RUN=1 DEV_SERVER_PORT=7779 npx ts-node --transpile-only ./src/spec-server.ts',
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
