import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import UsersController from '../../../test-app/app/controllers/UsersController'

describe('PsychicConfig', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new PsychicConfig(new PsychicServer().app)
      await config.boot()
      expect(config.controllers.UsersController.toString()).toEqual(UsersController.toString())
    })
  })
})
