import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Post from './Post'

export default class Comment extends ApplicationModel {
  public get table() {
    return 'comments' as const
  }

  public get serializers(): DreamSerializers<Comment> {
    return {
      default: 'CommentSerializer',
      summary: 'CommentSummarySerializer',
    }
  }

  public id: DreamColumn<Comment, 'id'>
  public body: DreamColumn<Comment, 'body'>
  public createdAt: DreamColumn<Comment, 'createdAt'>
  public updatedAt: DreamColumn<Comment, 'updatedAt'>

  @Comment.BelongsTo('Post')
  public post: Post
  public postId: DreamColumn<Comment, 'postId'>
}
