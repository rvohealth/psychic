import background from '../../../src/background'
import User from '../../../test-app/app/models/user'

describe('background (app singleton)', () => {
  describe('.staticMethod', () => {
    it('adds the static method to the worker queue', async () => {
      await background.connect()

      // @ts-ignore
      jest.spyOn(background.queue!, 'add').mockImplementation(() => {})

      await background.staticMethod(User, 'checkPassword', {
        filepath: 'app/models/user',
        args: ['howyadoin'],
      })
      expect(background.queue!.add).toHaveBeenCalledWith('BackgroundJobQueueStaticJob', {
        className: 'User',
        method: 'checkPassword',
        psychicpath: undefined,
        importKey: undefined,
        filepath: 'app/models/user',
        args: ['howyadoin'],
      })
    })
  })
})
