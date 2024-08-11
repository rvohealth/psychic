import { BelongsTo, DreamColumn, HasMany, HasOne } from '@rvohealth/dream'
import PostSerializer, {
  PostSummarySerializer,
  PostWithCommentsSerializer,
  PostWithRecentCommentSerializer,
} from '../../../test-app/app/serializers/PostSerializer'
import ApplicationModel from './ApplicationModel'
import Comment from './Comment'
import User from './User'

export default class Post extends ApplicationModel {
  public get table() {
    return 'posts' as const
  }

  public id: DreamColumn<Post, 'id'>
  public body: DreamColumn<Post, 'body'>
  public createdAt: DreamColumn<Post, 'createdAt'>
  public updatedAt: DreamColumn<Post, 'updatedAt'>

  @BelongsTo(() => User)
  public user: User
  public userId: DreamColumn<Post, 'userId'>

  @HasMany(() => Comment)
  public comments: Comment[]

  @HasOne(() => Comment, { order: { id: 'desc' } })
  public recentComment: Comment | null
}

void new Promise<void>(accept => accept())
  .then(() =>
    Post.register('serializers', {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default: PostSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      summary: PostSummarySerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      withRecentComment: PostWithRecentCommentSerializer<any, any>,

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      withComments: PostWithCommentsSerializer<any, any>,
    }),
  )
  .catch()
