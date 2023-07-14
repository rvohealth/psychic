import User from '../../../test-app/app/models/User'
import DummyService from '../../../test-app/app/services/DummyService'

describe('BackgroundedService', () => {
  it('calls the static method, passing args', async () => {
    jest.spyOn(DummyService, 'classRunInBG').mockImplementation(() => {})
    await DummyService.background('classRunInBG', 'bottlearum')
    expect(DummyService.classRunInBG).toHaveBeenCalledWith('bottlearum')
  })

  it('calls the instance method, passing constructor args to the constructor and args to the instance method', async () => {
    jest.spyOn(DummyService.prototype, 'instanceMethodToTest').mockImplementation(() => {})
    await new DummyService('hello').background('instanceRunInBG', {
      args: ['bottlearum'],
      constructorArgs: ['bottleawhiskey'],
    })
    expect(DummyService.prototype.instanceMethodToTest).toHaveBeenCalledWith('bottleawhiskey', 'bottlearum')
  })
})
