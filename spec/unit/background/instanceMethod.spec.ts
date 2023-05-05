import background from '../../../src/background'
import User from '../../../test-app/app/models/User'

describe('background (app singleton)', () => {
  describe('#instanceMethod', () => {
    it('adds the instance method to the worker queue', async () => {
      await background.connect()

      // @ts-ignore
      jest.spyOn(background.queue!, 'add').mockImplementation(async () => undefined)

      await background.instanceMethod(User, 'checkPassword', {
        filepath: 'app/models/User',
        args: ['howyadoin'],
      })

      expect(background.queue!.add).toHaveBeenCalledWith('BackgroundJobQueueInstanceJob', {
        className: 'User',
        method: 'checkPassword',
        psychicpath: undefined,
        importKey: undefined,
        constructorArgs: [],
        filepath: 'app/models/User',
        args: ['howyadoin'],
      })
    })
  })
})
