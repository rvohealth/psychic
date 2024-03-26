import generateClientAPIModule from '../../../../src/generate/client/apiModule'

describe('dream generate:model <name> [...attributes]', () => {
  context('when provided with a pascalized table name', () => {
    it('generates a dream model with multiple string fields', async () => {
      const res = await generateClientAPIModule('User')
      expect(res).toEqual(
        `\
import { apiCall } from './common'
import { User } from './schema'

export default class UsersAPI {
  public static index() {
    return apiCall('users.index').send()
  }

  public static show(id: string) {
    return apiCall('users.show', [id]).send()
  }

  public static create(body: Partial<User>) {
    return apiCall('users.create').send({ body })
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('users.update', [id]).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('users.destroy', [id]).send()
  }
}\
`
      )
    })
  })

  it('produces valid association paths when the model being generated is namespaced', async () => {
    const res = await generateClientAPIModule('api/v1/user')
    expect(res).toEqual(
      `\
import { apiCall } from '../../common'
import { User } from '../../schema'

export default class ApiV1UsersAPI {
  public static index() {
    return apiCall('api.v1.users.index').send()
  }

  public static show(id: string) {
    return apiCall('api.v1.users.show', [id]).send()
  }

  public static create(body: Partial<User>) {
    return apiCall('api.v1.users.create').send({ body })
  }

  public static update(id: string, body: Partial<User>) {
    return apiCall('api.v1.users.update', [id]).send({ body })
  }

  public static destroy(id: string) {
    return apiCall('api.v1.users.destroy', [id]).send()
  }
}\
`
    )
  })
})
