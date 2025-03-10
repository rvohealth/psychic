import { Decorators, DreamColumn, DreamSerializers } from '@rvoh/dream'
import ApplicationModel from './ApplicationModel'
import Comment from './Comment'
import User from './User'

const Deco = new Decorators<InstanceType<typeof Post>>()

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

  @Deco.BelongsTo('User')
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @Deco.HasMany('Comment')
  public comments: Comment[]

  @Deco.HasOne('Comment')
  public recentComment: Comment | null
}
