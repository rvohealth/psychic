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
})
