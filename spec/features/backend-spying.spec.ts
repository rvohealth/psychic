import UsersController from '../../test-app/src/app/controllers/UsersController'
import puppeteer from 'puppeteer'

// describe('test that spying on backend modules works within fspec runs', () => {
describe('Cross-browser button test', () => {
  test.only('can spy on backend methods', async () => {
    vi.spyOn(UsersController.prototype, 'pingMessage', 'get').mockReturnValue('chalupas dujour 1')
    console.log('HIIIII')

    const browser = await puppeteer.launch({
      browser: 'firefox',
      dumpio: true,
      headless: true,
      defaultViewport: null,
      args: ['--no-zygote'],
      env: {
        MOZ_REMOTE_SETTINGS_DEVTOOLS: '1',
      },
      // args: ['--lang=en-US,en', '--no-remote', '--no-sandbox', '--disable-setuid-sandbox'],
      // extraPrefsFirefox: {
      //   'intl.accept_languages': 'en-US,en',
      // },
    })
    const page = await browser.newPage()

    await page.goto('http://localhost:3000/')
    // await new Promise(accept => {
    //   setTimeout(() => {
    //     accept({})
    //   }, 10000)
    // })

    const text = 'chalupas dujour 1'
    console.log(page.browserContext())
    await expect(page).toMatchBidiText(text)
  }, 30000)
})

// it('resets spies between tests', async () => {
//   await visit('/')
//
//   const text = 'helloworld'
//   expect(page).toHaveSelector(`body:has-text("${text}"), body *:has-text("${text}")`)
// })
// })
