import sleep from 'src/helpers/sleep'
import { launchServers, killServers } from 'spec/support/helpers/integration/launch-servers'

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

  it('should have content "Psychic"', async () => {
    await goto(baseUrl)
    await sleep(10000)
    await expect(page).toMatch('Psychic')
  })
})
