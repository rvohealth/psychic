import { launchServers, killServers } from 'psychic/psyspec/story'

import User from 'app/dreams/user'

it ('renders the home page', async () => {
  await launchServers()
  await User.create({ email: 'ham', password: 'fishman' })
  await goto(baseUrl)
  await killServers()
})
