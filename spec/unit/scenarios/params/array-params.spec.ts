import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { MockInstance } from 'vitest'
import PsychicApp from '../../../../src/psychic-app/index.js'
import PsychicServer from '../../../../src/server/index.js'

// the endpoint calls this.extractParams(User, ['name'], { key: 'users', array: true })
// (test-app/src/app/controllers/ParamsTestController.ts)
describe('hitting an endpoint that extracts an array of params', () => {
  let logWithLevelSpy: MockInstance

  beforeEach(async () => {
    process.env.__PSYCHIC_HOOKS_TEST_CACHE = ''
    logWithLevelSpy = vi.spyOn(PsychicApp, 'logWithLevel')
    await request.init(PsychicServer)
  })

  function expectNoServerError() {
    expect(logWithLevelSpy.mock.calls.filter(([level]) => level === 'error')).toEqual([])
    expect(
      (process.env.__PSYCHIC_HOOKS_TEST_CACHE || '').split(',').filter(entry => entry === 'server:error'),
    ).toEqual([])
  }

  it('returns the extracted params for an array of objects', async () => {
    const res = await request.post('/array-params-test', 200, {
      data: { users: [{ id: 1, name: 'a' }, { name: 'b' }] },
    })
    expect(res.body).toEqual([{ name: 'a' }, { name: 'b' }])
  })

  it('returns an empty array when the key is missing', async () => {
    const res = await request.post('/array-params-test', 200, { data: {} })
    expect(res.body).toEqual([])
  })

  it('returns an empty array when the key is null', async () => {
    const res = await request.post('/array-params-test', 200, { data: { users: null } })
    expect(res.body).toEqual([])
  })

  it.each([
    ['an empty object', {}],
    ['a single object', { name: 'a' }],
    ['a string', 'a'],
    ['an object with numeric keys', { '0': { name: 'a' } }],
    ['an array containing null', [null]],
    ['an array containing a number', [1]],
    ['an array containing a string', ['a']],
    ['an array containing an array', [[{ name: 'a' }]]],
  ])('responds 400 to %s, without a server error', async (_, users) => {
    await request.post('/array-params-test', 400, { data: { users } })
    expectNoServerError()
  })

  it('responds 400 to an element whose attribute fails validation, as before', async () => {
    await request.post('/array-params-test', 400, { data: { users: [{ name: 5 }] } })
    expectNoServerError()
  })
})
