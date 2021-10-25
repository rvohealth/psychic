import sleep from 'src/helpers/sleep'
import { launchServers, killServers } from 'spec/support/helpers/integration/launch-servers'

jest.setTimeout(60 * 1000)

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await runPsyCommand(`CORE_INTEGRATION_TEST=true npm run psy g:auth`)
    console.log('*********************')
    await runPsyCommand(`CORE_INTEGRATION_TEST=true npm run psy g:js`)
    console.log('*********************')
    await swapIntegrationFiles('spec/integration/auth/can-sign-in/swap')
    console.log('*********************')
    await launchServers()
  })

  afterEach(async () => {
    await killServers()
  })

  it('should have content "Psychic"', async () => {
    console.log('SPAM')
    await goto(baseUrl)
    console.log('SPAM2')
    await expect(page).toMatch('Psychic')
    console.log('SPAM3')
  })
})
