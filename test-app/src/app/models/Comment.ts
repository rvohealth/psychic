import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from './ApplicationModel.js'
import Post from './Post.js'

const Deco = new Decorators<InstanceType<typeof Comment>>()

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

  @Deco.BelongsTo('Post')
  public post: Post
  public postId: DreamColumn<Comment, 'postId'>
}
