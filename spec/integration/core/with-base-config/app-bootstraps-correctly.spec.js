import { launchServers, killServers } from 'spec/support/helpers/integration/launch-servers'

describe('Landing on home page of boiler-plate react app', () => {
  beforeEach(async () => {
    await launchServers()
  })

  afterEach(async () => {
    await killServers()
  })

  it('should have content "Psychic"', async () => {
    await goto(baseUrl)
    await expect(page).toMatch('Psychic')
  })
})
