import { DreamColumn, DreamSerializers } from '@rvohealth/dream'
import ApplicationModel from './ApplicationModel'
import Comment from './Comment'
import User from './User'

export default class Post extends ApplicationModel {
  public get table() {
    return 'posts' as const
  }

  public get serializers(): DreamSerializers<Post> {
    return {
      default: 'PostSerializer',
      summary: 'PostSummarySerializer',
      withRecentComment: 'PostWithRecentCommentSerializer',
      withComments: 'PostWithCommentsSerializer',
    }
  }

  public id: DreamColumn<Post, 'id'>
  public body: DreamColumn<Post, 'body'>
  public createdAt: DreamColumn<Post, 'createdAt'>
  public updatedAt: DreamColumn<Post, 'updatedAt'>

  @Post.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @Post.HasMany('Comment')
  public comments: Comment[]

  @Post.HasOne('Comment', { order: { id: 'desc' } })
  public recentComment: Comment | null
}
