import { visit } from '@rvoh/psychic-spec-helpers'
import UsersController from '../../test-app/src/app/controllers/UsersController.js'

describe('test that spying on backend modules works within fspec runs', () => {
  it('can spy on backend methods', async () => {
    vi.spyOn(UsersController.prototype, 'pingMessage', 'get').mockReturnValue('chalupas dujour 1')

    const page = await visit('/')

    const text = 'chalupas dujour 1'
    await expect(page).toMatchTextContent(text)
  })
})

it('resets spies between tests', async () => {
  const page = await visit('/')
  const text = 'helloworld'
  await expect(page).toMatchTextContent(text)
})
