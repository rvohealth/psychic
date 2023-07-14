import background from '../../../src/background'
import User from '../../../test-app/app/models/User'

describe('background (app singleton)', () => {
  describe('.modelInstanceMethod', () => {
    it('instantiates the model and calls the specified method with the specified args', async () => {
      const user = await User.create({ email: 'ham@howyadoin', password_digest: 'coolidge' })
      jest.spyOn(User.prototype, '_testBackground')

      await background.modelInstanceMethod(user, 'testBackground', {
        args: ['howyadoin'],
      })
      expect(User.prototype._testBackground).toHaveBeenCalledWith(user.id, 'howyadoin')
    })
  })
})
