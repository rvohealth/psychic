import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { MockInstance } from 'vitest'
import PsychicApp from '../../../../src/psychic-app/index.js'
import PsychicServer from '../../../../src/server/index.js'
import User from '../../../../test-app/src/app/models/User.js'

describe('an error helper is passed a serializer', () => {
  let user: User

  beforeEach(async () => {
    await request.init(PsychicServer)
    user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
  })

  const expectedBody = () => ({
    reason: 'taken',
    user: { id: user.id, howyadoin: 'howyadoin' },
  })

  it('renders the serializer with the controller passthrough', async () => {
    const res = await request.get(`/users/${user.id}/conflict-with-serializer`, 409)
    expect(res.body).toEqual(expectedBody())
  })

  context('without fastJsonStringify', () => {
    it('renders the serializer with the controller passthrough', async () => {
      const res = await request.get(
        `/users/${user.id}/conflict-with-serializer-without-fast-json-stringify`,
        409,
      )
      expect(res.body).toEqual(expectedBody())
    })
  })

  context('with an array of serializers', () => {
    it('renders each serializer with the controller passthrough', async () => {
      const res = await request.get(`/users/${user.id}/conflict-with-serializer-array`, 409)
      expect(res.body).toEqual([expectedBody()])
    })
  })
})

// UsersController#testConflictWithPrimitive documents an object schema with a
// required key for its 409, which fast-json-stringify would throw on (a 500)
// for data that is not an object
describe('an error helper is passed a string, number or boolean on an endpoint with fastJsonStringify', () => {
  let user: User
  let logWithLevelSpy: MockInstance

  beforeEach(async () => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel')
    await request.init(PsychicServer)
    user = await User.create({ email: 'how@yadoin', password: 'howyadoin', name: 'fredo' })
  })

  function serverErrorHookCallCount() {
    return (process.env.__PSYCHIC_HOOKS_TEST_CACHE || '').split(',').filter(entry => entry === 'server:error')
      .length
  }

  function errorLogCount() {
    return logWithLevelSpy.mock.calls.filter(([level]) => level === 'error').length
  }

  it.each([
    ['false', 'false', 'false'],
    ['0', 'zero', '0'],
    ["''", 'empty-string', '""'],
    ['a string', 'string', '"taken"'],
  ])(
    'sends %s as JSON with the error status, without logging it or calling server:error hooks',
    async (_, data, json) => {
      const res = await request.get(`/users/${user.id}/conflict-with-primitive`, 409, { query: { data } })
      expect(res.headers['content-type']).toEqual('application/json; charset=utf-8')
      expect(res.text).toEqual(json)
      expect(errorLogCount()).toEqual(0)
      expect(serverErrorHookCallCount()).toEqual(0)
    },
  )
})
