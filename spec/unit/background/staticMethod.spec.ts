import background from '../../../src/background'
import DummyService from '../../../test-app/app/services/DummyService'

describe('background (app singleton)', () => {
  describe('.staticMethod', () => {
    it('calls the static method, passing args', async () => {
      jest.spyOn(DummyService, 'classRunInBG').mockImplementation(() => {})
      await background.staticMethod(DummyService, 'classRunInBG', {
        filepath: 'test-app/app/services/DummyService.ts',
        args: ['bottlearum'],
      })
      expect(DummyService.classRunInBG).toHaveBeenCalledWith('bottlearum')
    })
  })
})
