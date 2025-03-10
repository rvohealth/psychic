import { UpdateableProperties } from '@rvoh/dream'
import Post from '../../test-app/src/app/models/Post'
import User from '../../test-app/src/app/models/User'

export default async function createPost(user: User, overrides: UpdateableProperties<Post> = {}) {
  return await Post.create({
    user,
    ...overrides,
  })
}
