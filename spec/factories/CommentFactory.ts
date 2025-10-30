import { UpdateableProperties } from '@rvoh/dream/types'
import Comment from '../../test-app/src/app/models/Comment.js'
import Post from '../../test-app/src/app/models/Post.js'

export default async function createComment(post: Post, overrides: UpdateableProperties<Comment> = {}) {
  return await Comment.create({
    post,
    ...overrides,
  })
}
