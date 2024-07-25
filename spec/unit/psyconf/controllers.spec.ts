import Psyconf from '../../../src/psyconf'
import UsersController from '../../../test-app/app/controllers/UsersController'

describe('Psyconf', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new Psyconf()
      await config.boot()
      expect(config.controllers.UsersController.toString()).toEqual(UsersController.toString())
    })
  })
})
