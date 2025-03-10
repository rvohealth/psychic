import { UpdateableProperties } from '@rvoh/dream'
import Comment from '../../test-app/src/app/models/Comment'
import Post from '../../test-app/src/app/models/Post'

export default async function createComment(post: Post, overrides: UpdateableProperties<Comment> = {}) {
  return await Comment.create({
    post,
    ...overrides,
  })
}
