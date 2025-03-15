import UsersController from '../../../test-app/src/app/controllers/UsersController.js'

describe('PsychicController', () => {
  describe('.controllerActionPath', () => {
    it('returns the controller global name, minus the "controllers/" prefix', () => {
      expect(UsersController.controllerActionPath('helloWorld')).toEqual('Users#helloWorld')
    })
  })
})
