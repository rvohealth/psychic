import background from '../../../src/background'
import DummyService from '../../../test-app/app/services/DummyService'

describe('background (app singleton)', () => {
  describe('#instanceMethod', () => {
    it('calls the instance method, passing constructor args to the constructor and args to the instance method', async () => {
      jest.spyOn(DummyService.prototype, 'instanceMethodToTest').mockImplementation(() => {})
      await background.instanceMethod(DummyService, 'instanceRunInBG', {
        args: ['bottlearum'],
        constructorArgs: ['bottleawhiskey'],
        filepath: 'test-app/app/services/DummyService.ts',
      })
      expect(DummyService.prototype.instanceMethodToTest).toHaveBeenCalledWith('bottleawhiskey', 'bottlearum')
    })
  })
})
