import background from '../../../src/background'
import User from '../../../test-app/app/models/user'

describe('background (app singleton)', () => {
  describe('.modelInstanceMethod', () => {
    it('adds the model instance method to the worker queue', async () => {
      const user = await User.create({ email: 'ham@howyadoin', password_digest: 'coolidge' })
      await background.connect()

      // @ts-ignore
      jest.spyOn(background.queue!, 'add').mockImplementation(() => {})

      await background.modelInstanceMethod(user, 'checkPassword', {
        args: ['howyadoin'],
      })
      expect(background.queue!.add).toHaveBeenCalledWith('BackgroundJobQueueModelInstanceJob', {
        className: 'User',
        id: user.id,
        method: 'checkPassword',
        psychicpath: undefined,
        importKey: undefined,
        filepath: 'app/models/user',
        args: ['howyadoin'],
      })
    })
  })
})
