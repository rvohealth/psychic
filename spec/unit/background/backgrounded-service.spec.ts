import { describe as context } from '@jest/globals'
import DummyService from '../../../test-app/app/services/DummyService'
import UrgentDummyService from '../../../test-app/app/services/UrgentDummyService'
import NotUrgentDummyService from '../../../test-app/app/services/NotUrgentDummyService'
import LastDummyService from '../../../test-app/app/services/LastDummyService'
import background, { BackgroundQueuePriority } from '../../../src/background'

describe('BackgroundedService', () => {
  it('calls the static method, passing args', async () => {
    jest.spyOn(DummyService, 'classRunInBG').mockImplementation(async () => {})
    await DummyService.background('classRunInBG', 'bottlearum')
    expect(DummyService.classRunInBG).toHaveBeenCalledWith('bottlearum')
  })

  it('calls the instance method, passing constructor args to the constructor and args to the instance method', async () => {
    jest.spyOn(DummyService.prototype, 'instanceMethodToTest').mockImplementation(async () => {})
    await new DummyService('hello').background('instanceRunInBG', {
      args: ['bottlearum'],
      constructorArgs: ['bottleawhiskey'],
    })
    expect(DummyService.prototype.instanceMethodToTest).toHaveBeenCalledWith('bottleawhiskey', 'bottlearum')
  })

  context('queue priority', () => {
    let subject = async () => {
      await new serviceClass('hello').background('instanceRunInBG', {
        args: ['bottlearum'],
        constructorArgs: ['bottleawhiskey'],
      })
    }
    let serviceClass:
      | typeof DummyService
      | typeof UrgentDummyService
      | typeof NotUrgentDummyService
      | typeof LastDummyService

    function expectAddedToQueueWithPriority(priority: BackgroundQueuePriority, priorityLevel: number) {
      expect(background.queue!.add).toHaveBeenCalledWith(
        'BackgroundJobQueueInstanceJob',
        {
          filepath: `/app/services/${serviceClass.name}`,
          args: ['bottlearum'],
          constructorArgs: ['bottleawhiskey'],
          priority: priority,
          importKey: undefined,
          method: 'instanceRunInBG',
        },
        { priority: priorityLevel }
      )
    }

    beforeEach(async () => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = '1'
      await background.connect()

      jest.spyOn(background.queue!, 'add').mockImplementation(() => {
        return {} as any
      })
    })

    afterEach(() => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = undefined
    })

    context('with a default priority', () => {
      beforeEach(() => {
        serviceClass = DummyService
      })

      it('uses priority 2', async () => {
        await subject()
        expectAddedToQueueWithPriority('default', 2)
      })
    })

    context('with an urgent priority', () => {
      beforeEach(() => {
        serviceClass = UrgentDummyService
      })

      it('uses priority 1', async () => {
        await subject()
        expectAddedToQueueWithPriority('urgent', 1)
      })
    })

    context('with a not_urgent priority', () => {
      beforeEach(() => {
        serviceClass = NotUrgentDummyService
      })

      it('uses priority 3', async () => {
        await subject()
        expectAddedToQueueWithPriority('not_urgent', 3)
      })
    })

    context('with a last priority', () => {
      beforeEach(() => {
        serviceClass = LastDummyService
      })

      it('uses priority 4', async () => {
        await subject()
        expectAddedToQueueWithPriority('last', 4)
      })
    })
  })
})
