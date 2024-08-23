import { Attribute, DreamColumn, DreamSerializer, RendersMany, RendersOne } from '@rvohealth/dream'
import Post from '../models/Post'
import User from '../models/User'
import { PostWithCommentsSerializer, PostWithRecentCommentSerializer } from './PostSerializer'

export class UserSummarySerializer extends DreamSerializer {
  @Attribute(User)
  public id: DreamColumn<User, 'id'>
}

export default class UserSerializer extends UserSummarySerializer {
  @Attribute(User)
  public email: DreamColumn<User, 'email'>

  @Attribute(User)
  public name: DreamColumn<User, 'name'>
}

export class UserExtraSerializer extends UserSummarySerializer {
  @Attribute(User)
  public nicknames: DreamColumn<User, 'nicknames'>

  @Attribute({
    type: 'object',
    properties: {
      name: 'string',
      stuff: 'string[]',
      nestedStuff: {
        type: 'object',
        properties: {
          nested1: 'boolean',
          nested2: 'decimal[]',
        },
      },
    },
  })
  public howyadoin() {}
}

export class UserWithPostsSerializer extends UserSummarySerializer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersMany(() => PostWithCommentsSerializer<any, any>)
  public posts: Post[]
}

export class UserWithPostsMultiType2Serializer extends UserSummarySerializer {
  @RendersMany([Post, User], { serializerKey: 'summary' })
  public posts: Post[]
}

export class UserWithRecentPostSerializer extends UserSummarySerializer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @RendersOne(() => PostWithRecentCommentSerializer<any, any>, { nullable: true })
  public recentPost: Post | null
}
