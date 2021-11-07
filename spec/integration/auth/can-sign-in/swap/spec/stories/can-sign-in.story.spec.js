import { launchServers, killServers } from 'psychic/psyspec/story'
import User from 'app/dreams/user'

beforeEach(async () => {
  await launchServers()
  await User.create({ email: 'fish', password: 'man' })
})

afterEach(async () => {
  await killServers()
})

it ('allows user to sign up, login in, and access an authenticated route', async () => {
  const count = await User
    .where({ email: 'fish' })
    .count()
    .do()
  expect(count).toBe(1)

  await goto('signup')
  await fillIn('email', 'fishman')
  await fillIn('password', 'fishman')
  await click('Submit')
  await sleep(500)

  await goto('login')
  await fillIn('email', 'fishman')
  await fillIn('password', 'fishman')
  await click('Submit')
  await expect(page).toMatch('Authed via WS')

  await goto('authtest')
  await expect(page).toMatch('Authtest')
  await expect(page).toMatch('Auth was successful')
})
