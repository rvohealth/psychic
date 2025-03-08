import launchBrowser from './setup/helpers/launchBrowser'

describe('ensures that a second feature spec can run', () => {
  it('can run multiple feature specs', async () => {
    const browser = await launchBrowser()
    const page = await browser.newPage()
    await page.goto('http://localhost:3000')
  })
})
