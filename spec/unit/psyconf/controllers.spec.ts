import PsychicApplication from '../../../src/psychic-application'
import UsersController from '../../../test-app/app/controllers/UsersController'

describe('PsychicApplication', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new PsychicApplication()
      await config.boot()
      expect(config.controllers['controllers/UsersController'].toString()).toEqual(UsersController.toString())
    })
  })
})
