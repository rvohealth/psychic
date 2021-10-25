import sleep from 'src/helpers/sleep'
import { launchServers, killServers } from 'spec/support/helpers/integration/launch-servers'

jest.setTimeout(60 * 1000)

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await runPsyCommand(`CORE_INTEGRATION_TEST=true npm run psy g:auth`)
    await runPsyCommand(`CORE_INTEGRATION_TEST=true npm run psy g:js`)
    await swapIntegrationFiles('spec/integration/auth/can-sign-in/swap')
    await launchServers()
  })

  afterEach(async () => {
    await killServers()
  })

  it('should allow sign in from auth boilerplate', async () => {
    await goto(baseUrl)
    await sleep(10000)
  })
})
