import PsychicApplication from '../../../src/psychic-application.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicApplication', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new PsychicApplication()
      await config.boot()
      expect(config.controllers['controllers/UsersController'].toString()).toEqual(UsersController.toString())
    })
  })
})
