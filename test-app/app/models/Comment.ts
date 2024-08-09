import { BelongsTo, DreamColumn } from '@rvohealth/dream'
import CommentSerializer, {
  CommentSummarySerializer,
} from '../../../test-app/app/serializers/CommentSerializer'
import ApplicationModel from './ApplicationModel'
import Post from './Post'

export default class Comment extends ApplicationModel {
  public get table() {
    return 'comments' as const
  }

  public id: DreamColumn<Comment, 'id'>
  public body: DreamColumn<Comment, 'body'>
  public createdAt: DreamColumn<Comment, 'createdAt'>
  public updatedAt: DreamColumn<Comment, 'updatedAt'>

  @BelongsTo(() => Post)
  public post: Post
  public postId: DreamColumn<Comment, 'postId'>
}

Comment.register('serializers', {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: CommentSerializer<any, any>,

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  summary: CommentSummarySerializer<any, any>,
})
