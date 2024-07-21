import { UpdateableProperties } from '@rvohealth/dream'
import Comment from '../../test-app/app/models/Comment'
import Post from '../../test-app/app/models/Post'

export default async function createComment(post: Post, overrides: UpdateableProperties<Comment> = {}) {
  return await Comment.create({
    post,
    ...overrides,
  })
}
