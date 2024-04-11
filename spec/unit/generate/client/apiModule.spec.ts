import generateClientAPIModule from '../../../../src/generate/client/apiModule'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a dream model with multiple string fields', () => {
      const res = generateClientAPIModule('users', 'User')
      expect(res).toEqual(
        `\
import { apiCall } from './common'
import { User } from './schema'

export default class UsersAPI {
  public static index() {
    return apiCall('users.GET').send()
  }

  public static create(body: Partial<User>) {
    return apiCall('users.POST').send({ body })
  }

  public static show(id: string) {
    return apiCall('users.id.GET', { id }).send()
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('users.id.PATCH', { id }).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('users.id.DELETE', { id }).send()
  }
}\
`,
      )
    })
  })

  it('produces valid association paths when the model being generated is namespaced', () => {
    const res = generateClientAPIModule('/api/users', 'System/Main/User')
    expect(res).toEqual(
      `\
import { apiCall } from '../../common'
import { User } from '../../schema'

export default class SystemMainUsersAPI {
  public static index() {
    return apiCall('api.users.GET').send()
  }

  public static create(body: Partial<User>) {
    return apiCall('api.users.POST').send({ body })
  }

  public static show(id: string) {
    return apiCall('api.users.id.GET', { id }).send()
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('api.users.id.PATCH', { id }).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('api.users.id.DELETE', { id }).send()
  }
}\
`,
    )
  })
})
