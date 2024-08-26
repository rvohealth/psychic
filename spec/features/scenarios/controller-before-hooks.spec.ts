import { specRequest as request } from '@rvohealth/psychic-spec-helpers'
import { PsychicServer } from '../../../src'

describe('controller before hooks', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('calls before actions before running a method', async () => {
    const response = await request.get('/users-before-all-test', 200)
    expect(response.body).toEqual('before all action was called for all!')
  })
})
