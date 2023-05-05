import PsychicConfig from '../../../src/config'
import PsychicServer from '../../../src/server'
import UsersController from '../../../test-app/app/controllers/Users'

describe('PsychicConfig', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new PsychicConfig(new PsychicServer().app)
      await config.boot()
      expect(config.controllers.Users.toString()).toEqual(UsersController.toString())
    })
  })
})
