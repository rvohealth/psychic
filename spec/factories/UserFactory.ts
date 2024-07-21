import { UpdateableProperties } from '@rvohealth/dream'
import User from '../../test-app/app/models/User'

let counter = 1

export default async function createUser(overrides: UpdateableProperties<User> = {}) {
  return await User.create({
    email: `user.${counter++}@example.com`,
    ...overrides,
  })
}
