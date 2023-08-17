import background from '../../../src/background'
import DummyService from '../../../dist/test-app/app/services/DummyService'
import readTmpFile from '../../helpers/readTmpFile'

describe('background (app singleton)', () => {
  describe('.staticMethod', () => {
    it('calls the static method, passing args', async () => {
      await background.staticMethod(DummyService, 'classRunInBG', {
        filepath: 'test-app/app/services/DummyService.ts',
        args: ['bottlearum'],
      })
      expect(await readTmpFile()).toEqual('bottlearum')
    })
  })
})
