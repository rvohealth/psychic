import request from '../../../spec-helpers/spec-request'

describe('controller before hooks', () => {
  beforeEach(async () => {
    await request.init()
  })

  it('calls before actions before running a method', async () => {
    const response = await request.get('/users-before-all-test', 200)
    expect(response.body).toEqual('before all action was called for all!')
  })
})
