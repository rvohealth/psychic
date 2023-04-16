import background from '../../../src/background'
import User from '../../../test-app/app/models/user'

describe('background (app singleton)', () => {
  describe('#handler', () => {
    context('BackgroundJobQueueStaticJob', () => {
      it('calls the instance method, passing constructor args', async () => {
        await background.connect()
        jest.spyOn(User, 'backgroundTest').mockImplementation(() => {})
        await background.handler({
          name: 'BackgroundJobQueueStaticJob',
          data: {
            method: 'backgroundTest',
            filepath: 'app/models/user',
            args: ['bottlarum'],
          },
        } as any)

        expect(User.backgroundTest).toHaveBeenCalledWith('bottlarum')
      })
    })

    context('BackgroundJobQueueInstanceJob', () => {
      it('calls the instance method, passing constructor args', async () => {
        await background.connect()
        const user = await User.create({ email: 'yo@ho', password_digest: 'bottlarum' })
        jest.spyOn(User.prototype, 'checkPassword').mockResolvedValue(true)

        await background.handler({
          name: 'BackgroundJobQueueInstanceJob',
          data: {
            id: user.id,
            method: 'checkPassword',
            constructorArgs: [],
            filepath: 'app/models/user',
            args: ['bottlarum'],
          },
        } as any)

        expect(User.prototype.checkPassword).toHaveBeenCalledWith('bottlarum')
      })
    })

    context('BackgroundJobQueueModelInstanceJob', () => {
      it('calls the instance method, passing constructor args', async () => {
        await background.connect()
        const user = await User.create({ email: 'yo@ho', password_digest: 'bottlarum' })
        jest.spyOn(User, 'find').mockResolvedValue(user)
        jest.spyOn(user, 'checkPassword').mockResolvedValue(true)
        await background.handler({
          name: 'BackgroundJobQueueModelInstanceJob',
          data: {
            id: user.id,
            method: 'checkPassword',
            constructorArgs: [],
            filepath: 'app/models/user',
            args: ['bottlarum'],
          },
        } as any)

        expect(user.checkPassword).toHaveBeenCalledWith('bottlarum')
      })
    })
  })
})
