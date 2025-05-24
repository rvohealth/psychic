import { DreamSerializer } from '@rvoh/dream'
import Post from '../models/Post.js'
import CommentSerializer from './CommentSerializer.js'

// Summary serializer: only id
export const PostSummarySerializer = (data: Post) => DreamSerializer(Post, data).attribute('id')

// Full post serializer: id, body, explicitlyOmittedFromParamSafeColumns, comments
export default (data: Post) =>
  PostSummarySerializer(data)
    .attribute('body')
    .attribute('explicitlyOmittedFromParamSafeColumns')
    .rendersMany('comments', { serializerCallback: () => CommentSerializer })

// Post with recent comment: id, body, recentComment
export const PostWithRecentCommentSerializer = (data: Post) =>
  PostSummarySerializer(data)
    .attribute('body')
    .rendersOne('recentComment', { serializerCallback: () => CommentSerializer })

// Post with comments: id, body, comments
export const PostWithCommentsSerializer = (data: Post) =>
  PostSummarySerializer(data)
    .attribute('body')
    .rendersMany('comments', { serializerCallback: () => CommentSerializer })
