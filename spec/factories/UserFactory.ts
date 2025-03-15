import { UpdateableProperties } from '@rvoh/dream'
import User from '../../test-app/src/app/models/User.js'

let counter = 1

export default async function createUser(overrides: UpdateableProperties<User> = {}) {
  return await User.create({
    email: `user.${counter++}@example.com`,
    ...overrides,
  })
}
