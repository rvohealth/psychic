import { Attribute, DreamColumn, DreamSerializer, RendersMany, RendersOne } from '@rvohealth/dream'
import Post from '../models/Post'
import User from '../models/User'
import Comment from '../models/Comment'
import Pet from '../models/Pet'

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
  @RendersMany(Post, { serializerKey: 'withComments' })
  public posts: Post[]
}

export class UserWithFlattenedPostSerializer extends UserSummarySerializer {
  @RendersOne(Post, { serializerKey: 'withComments', flatten: true })
  public post: Post
}

export class UserWithOptionalFlattenedPostSerializer extends UserSummarySerializer {
  @RendersOne(Post, { serializerKey: 'withComments', flatten: true, optional: true })
  public post: Post
}

export class UserWithOptionalFlattenedPolymorphicPostOrUserSerializer extends UserSummarySerializer {
  @RendersOne([Post, Comment], { serializerKey: 'summary', flatten: true, optional: true })
  public post: Post | Comment

  @Attribute('string')
  public email: string
}

export class UserWithMultipleFlattenedPolymorphicAssociationsSerializer extends UserSummarySerializer {
  @RendersOne([Post, Comment], { serializerKey: 'summary', flatten: true, optional: true })
  public post: Post | Comment

  @RendersOne([User, Pet], { serializerKey: 'summary', flatten: true, optional: true })
  public userOrPet: User | Pet

  @Attribute('string')
  public email: string
}

export class UserWithPostsMultiType2Serializer extends UserSummarySerializer {
  @RendersMany([Post, User], { serializerKey: 'summary' })
  public posts: Post[]
}

export class UserWithRecentPostSerializer extends UserSummarySerializer {
  @RendersOne(Post, { nullable: true, serializerKey: 'withRecentComment' })
  public recentPost: Post | null
}
