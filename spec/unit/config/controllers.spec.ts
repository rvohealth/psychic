import HowlConfig from '../../../src/config'
import HowlServer from '../../../src/server'
import UsersController from '../../../test-app/app/controllers/users'

describe('HowlConfig', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new HowlConfig(new HowlServer().app)
      await config.boot()
      expect(config.controllers.users.toString()).toEqual(UsersController.toString())
    })
  })
})
