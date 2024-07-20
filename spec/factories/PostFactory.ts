import { UpdateableProperties } from '@rvohealth/dream'
import Post from '../../test-app/app/models/Post'
import User from '../../test-app/app/models/User'

export default async function createPost(user: User, overrides: UpdateableProperties<Post> = {}) {
  return await Post.create({
    user,
    ...overrides,
  })
}
