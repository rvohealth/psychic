import PsychicApp from '../../../src/psychic-app/index.js'
import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicApp', () => {
  describe('get #controllers', () => {
    it('returns controllers from controllers folder', async () => {
      const config = new PsychicApp()
      await config.boot()
      expect(config.controllers['controllers/UsersController']!.toString()).toEqual(
        UsersController.toString(),
      )
    })
  })
})
