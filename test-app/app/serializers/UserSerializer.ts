import { Attribute, DreamSerializer, RendersMany, RendersOne } from '@rvohealth/dream'
import Post from '../models/Post'
import User from '../models/User'
import { PostWithCommentsSerializer, PostWithRecentCommentSerializer } from './PostSerializer'

export class UserSummarySerializer extends DreamSerializer {
  @Attribute('string')
  public id: string
}

export default class UserSerializer extends UserSummarySerializer {
  @Attribute('string')
  public email: string

  @Attribute('string')
  public name: string
}

export class UserExtraSerializer extends UserSummarySerializer {
  @Attribute('string[]')
  public nicknames: string[]

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
  @RendersMany(() => PostWithCommentsSerializer<any, any>)
  public posts: Post[]
}

export class UserWithPostsMultiTypeSerializer extends UserSummarySerializer {
  @RendersMany(() => [PostWithCommentsSerializer<any, any>, PostWithRecentCommentSerializer<any, any>])
  public posts: Post[]
}

export class UserWithPostsMultiType2Serializer extends UserSummarySerializer {
  @RendersMany(() => [Post, User], { serializer: 'summary' })
  public posts: Post[]
}

export class UserWithRecentPostSerializer extends UserSummarySerializer {
  @RendersOne(() => PostWithRecentCommentSerializer<any, any>)
  public recentPost: Post | null
}
