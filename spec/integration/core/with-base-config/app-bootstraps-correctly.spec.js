import { launchServers, killServers } from 'spec/support/helpers/integration/launch-servers'
import psyEval from 'spec/support/helpers/integration/psy-eval'

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await psyEval(async function() {
      console.log('ham')
    })
    // await launchServers()
  })

  afterEach(async () => {
    // await killServers()
  })

  it('should have content "Psychic"', async () => {
    // await goto(baseUrl)
    // await expect(page).toMatch('Psychic')
  })
})
