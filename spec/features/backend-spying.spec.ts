import UsersController from '../../test-app/src/app/controllers/UsersController'
import visit from './helpers/visit'

describe('test that spying on backend modules works within fspec runs', () => {
  it('can spy on backend methods', async () => {
    jest.spyOn(UsersController.prototype, 'pingMessage', 'get').mockReturnValue('chalupas dujour 1')

    await visit('/')

    const text = 'chalupas dujour 1'
    await expect(page).toHaveSelector(`body:has-text("${text}"), body *:has-text("${text}")`, {
      state: 'visible',
      timeout: 4000,
    })
  })

  it('resets spies between tests', async () => {
    await visit('/')

    const text = 'helloworld'
    await expect(page).toHaveSelector(`body:has-text("${text}"), body *:has-text("${text}")`, {
      state: 'visible',
      timeout: 4000,
    })
  })
})
