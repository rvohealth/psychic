import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import ApplicationModel from './ApplicationModel.js'
import Comment from './Comment.js'
import User from './User.js'

const deco = new Decorators<typeof Post>()

export default class Post extends ApplicationModel {
  public override get table() {
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

  public get paramSafeColumns() {
    return ['body'] as const
  }

  public id: DreamColumn<Post, 'id'>
  public body: DreamColumn<Post, 'body'>
  public explicitlyOmittedFromParamSafeColumns: DreamColumn<Post, 'explicitlyOmittedFromParamSafeColumns'>
  public createdAt: DreamColumn<Post, 'createdAt'>
  public updatedAt: DreamColumn<Post, 'updatedAt'>

  @deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @deco.HasMany('Comment')
  public comments: Comment[]

  @deco.HasOne('Comment')
  public recentComment: Comment | null
}
