import background from '../../../src/background'
import User from '../../../test-app/app/models/User'
import DummyService from '../../../test-app/app/services/DummyService'

describe('BackgroundedService', () => {
  it('calls the static method, passing constructor args', async () => {
    await background.connect()

    // @ts-ignore
    jest.spyOn(background.queue!, 'add').mockImplementation(() => {})

    await DummyService.background('runInBG', 'bottlearum')
    expect(background.queue!.add).toHaveBeenCalledWith('BackgroundJobQueueStaticJob', {
      className: 'DummyService',
      method: 'runInBG',
      psychicpath: undefined,
      importKey: undefined,
      filepath: 'test-app/app/services/DummyService',
      args: ['bottlearum'],
    })
  })

  it('calls the instance method, passing constructor args', async () => {
    await background.connect()

    // @ts-ignore
    jest.spyOn(background.queue!, 'add').mockImplementation(() => {})

    await new DummyService().background('runInBG', 'bottlearum')
    expect(background.queue!.add).toHaveBeenCalledWith('BackgroundJobQueueInstanceJob', {
      className: 'DummyService',
      constructorArgs: [],
      method: 'runInBG',
      psychicpath: undefined,
      importKey: undefined,
      filepath: 'test-app/app/services/DummyService',
      args: ['bottlearum'],
    })
  })

  // context('BackgroundJobQueueInstanceJob', () => {
  //   it('calls the instance method, passing constructor args', async () => {
  //     await background.connect()
  //     const user = await User.create({ email: 'yo@ho', password_digest: 'bottlarum' })
  //     jest.spyOn(User.prototype, 'checkPassword').mockResolvedValue(true)

  //     await background.handler({
  //       name: 'BackgroundJobQueueInstanceJob',
  //       data: {
  //         id: user.id,
  //         method: 'checkPassword',
  //         constructorArgs: [],
  //         filepath: 'app/models/User',
  //         args: ['bottlarum'],
  //       },
  //     } as any)

  //     expect(User.prototype.checkPassword).toHaveBeenCalledWith('bottlarum')
  //   })
  // })

  // context('BackgroundJobQueueModelInstanceJob', () => {
  //   it('calls the instance method, passing constructor args', async () => {
  //     await background.connect()
  //     const user = await User.create({ email: 'yo@ho', password_digest: 'bottlarum' })
  //     jest.spyOn(User, 'find').mockResolvedValue(user)
  //     jest.spyOn(user, 'checkPassword').mockResolvedValue(true)
  //     await background.handler({
  //       name: 'BackgroundJobQueueModelInstanceJob',
  //       data: {
  //         id: user.id,
  //         method: 'checkPassword',
  //         constructorArgs: [],
  //         filepath: 'app/models/User',
  //         args: ['bottlarum'],
  //       },
  //     } as any)

  //     expect(user.checkPassword).toHaveBeenCalledWith('bottlarum')
  //   })
  // })
})
