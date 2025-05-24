import { DreamSerializer } from '@rvoh/dream'
import User from '../models/User.js'

// Summary serializer: only id
export const UserSummarySerializer = (data: User, passthrough?: { howyadoin: string }) =>
  DreamSerializer(User, data, passthrough).attribute('id')

// Full user serializer: id, email, name
export default (data: User, passthrough?: { howyadoin: string }) =>
  UserSummarySerializer(data, passthrough).attribute('email').attribute('name')

// UserExtraSerializer: id, nicknames, howyadoin (complex object)
export const UserExtraSerializer = (data: User, passthrough?: { howyadoin: string }) =>
  UserSummarySerializer(data, passthrough)
    .attribute('nicknames')
    .customAttribute('howyadoin', () => null, {
      openapi: {
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
      },
    })

export const UserWithPostsSerializer = (user: User) =>
  UserSummarySerializer(user).rendersMany('posts', { serializerKey: 'withComments' })

export const UserWithRecentPostSerializer = (user: User) =>
  UserSummarySerializer(user).rendersOne('recentPost', { serializerKey: 'withRecentComment', optional: true })

export const UserWithFlattenedPostSerializer = (user: User) =>
  UserSummarySerializer(user).rendersOne('recentPost', { serializerKey: 'withComments', flatten: true })

export const UserWithOptionalFlattenedPostSerializer = (user: User) =>
  UserSummarySerializer(user).rendersOne('recentPost', {
    serializerKey: 'withComments',
    flatten: true,
    optional: true,
  })
