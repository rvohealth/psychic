import { send } from '../../../spec-helpers'

describe('controller before hooks', () => {
  it('calls before actions before running a method', async () => {
    const response = await send.get('/users-before-all-test', 200)
    expect(response.body).toEqual('before all action was called for all!')
  })
})
