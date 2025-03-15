import { specRequest as request } from '@rvoh/psychic-spec-helpers'
import { PsychicServer } from '../../../src.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('controller before hooks', () => {
  beforeEach(async () => {
    await request.init(PsychicServer)
  })

  it('calls before actions before running a method', async () => {
    const response = await request.get('/users-before-all-test', 200)
    expect(response.body).toEqual('before all action was called for all!')
  })

  context('one of the before actions responds', () => {
    it('does not fire subsequent before actions on that controller, does not call endpoint', async () => {
      const beforeActionSpy = vi.spyOn(UsersController.prototype, 'beforeActionSequence2')
      const actionSpy = vi.spyOn(UsersController.prototype, 'beforeActionSequence')

      const response = await request.get('/users-before-action-sequence', 200)

      expect(beforeActionSpy).not.toHaveBeenCalled()
      expect(actionSpy).not.toHaveBeenCalled()

      expect(response.body).toEqual('before action 1')
    })
  })
})
