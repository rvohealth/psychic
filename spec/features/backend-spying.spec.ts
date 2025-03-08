import UsersController from '../../test-app/src/app/controllers/UsersController'
import launchBrowser from './setup/helpers/launchBrowser'

describe('test that spying on backend modules works within fspec runs', () => {
  it('can spy on backend methods', async () => {
    vi.spyOn(UsersController.prototype, 'pingMessage', 'get').mockReturnValue('chalupas dujour 1')

    const browser = await launchBrowser()
    const page = await browser.newPage()

    await page.goto('http://localhost:3000/')

    const text = 'chalupas dujour 1'
    await expect(page).toMatchBidiText(text)
  })
})

it('resets spies between tests', async () => {
  const browser = await launchBrowser()
  const page = await browser.newPage()
  await page.goto('http://localhost:3000/')

  const text = 'helloworld'
  await expect(page).toMatchBidiText(text)
})
