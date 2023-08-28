import background from '../../../src/background'
import DummyService from '../../../test-app/app/services/DummyService'
import readTmpFile from '../../helpers/readTmpFile'

describe('background (app singleton)', () => {
  describe('#instanceMethod', () => {
    it('calls the instance method, passing constructor args to the constructor and args to the instance method', async () => {
      await background.instanceMethod(DummyService, 'instanceRunInBG', {
        args: ['bottlearum'],
        constructorArgs: ['bottleawhiskey'],
        filepath: 'test-app/app/services/DummyService.ts',
      })
      expect(await readTmpFile()).toEqual('bottleawhiskey,bottlearum')
    })
  })
})
