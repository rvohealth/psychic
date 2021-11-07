import sleep from 'src/helpers/sleep'
import {
  launchServers,
  killServers
} from 'spec/support/helpers/integration/launch-servers'

jest.setTimeout(60 * 1000)

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await runPsyCommand(`psy g:auth`)
    await runPsyCommand(`psy g:dream blog belongsto:user string:name`)
    await runPsyCommand(`psy g:route get authtest authtest#sayhi given:currentUser`)
    await runPsyCommand(`psy g:channel authtest sayhi`)
    await runPsyCommand(`psy g:js`)
    await swapIntegrationFiles('spec/integration/auth/can-sign-in/swap')
    await swapIntegrationFiles('spec/integration/swap')
    await runPsyCommand(`psy db:drop`)
    await runPsyCommand(`psy db:create`)
    await runPsyCommand(`psy db:migrate`)
    await launchServers()
  })

  afterEach(async () => {
    await killServers()
  })

  it('should allow sign in from auth boilerplate', async () => {
    await goto(`${baseUrl}/signup`)
    await fillIn('email', 'fishman')
    await fillIn('password', 'fishman')
    await click('Submit')
    await sleep(500)

    await goto(`${baseUrl}/login`)
    await fillIn('email', 'fishman')
    await fillIn('password', 'fishman')
    await click('Submit')

    await sleep(500)
    await goto(`${baseUrl}/authtest`)
    await expect(page).toMatch('Authtest')
    await expect(page).toMatch('Auth was successful')
  })
})
