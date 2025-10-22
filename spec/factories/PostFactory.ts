import { UpdateableProperties } from '@rvoh/dream/types'
import Post from '../../test-app/src/app/models/Post.js'
import User from '../../test-app/src/app/models/User.js'

export default async function createPost(user: User, overrides: UpdateableProperties<Post> = {}) {
  return await Post.create({
    user,
    ...overrides,
  })
}
