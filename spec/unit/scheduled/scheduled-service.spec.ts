import { describe as context } from '@jest/globals'
import DummyScheduledService from '../../../test-app/app/services/DummyScheduledService'
import DefaultDummyScheduledService from '../../../test-app/app/services/DefaultDummyScheduledService'
import UrgentDummyScheduledService from '../../../test-app/app/services/UrgentDummyScheduledService'
import NotUrgentDummyScheduledService from '../../../test-app/app/services/NotUrgentDummyScheduledService'
import LastDummyScheduledService from '../../../test-app/app/services/LastDummyScheduledService'
import background, { BackgroundQueuePriority } from '../../../src/background'
import { Job } from 'bullmq'

describe('ScheduledService', () => {
  context('queue priority', () => {
    const subject = async () => {
      await serviceClass.schedule('* * * * *', 'instanceRunInBG', 'bottlearum')
    }
    let serviceClass:
      | typeof DummyScheduledService
      | typeof DefaultDummyScheduledService
      | typeof UrgentDummyScheduledService
      | typeof NotUrgentDummyScheduledService
      | typeof LastDummyScheduledService

    function expectAddedToQueueWithPriority(priority: BackgroundQueuePriority, priorityLevel: number) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(background.queue!.add).toHaveBeenCalledWith(
        'BackgroundJobQueueStaticJob',
        {
          globalName: `services/${serviceClass.name}`,
          args: ['bottlearum'],
          importKey: undefined,
          method: 'instanceRunInBG',
          priority,
        },
        {
          repeat: {
            pattern: '* * * * *',
          },
          jobId: `${serviceClass.name}:instanceRunInBG`,
          priority: priorityLevel,
        },
      )
    }

    beforeEach(() => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = '1'
      background.connect()

      jest.spyOn(background.queue!, 'add').mockResolvedValue({} as Job)
    })

    afterEach(() => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = undefined
    })

    context('with no priority specified', () => {
      beforeEach(() => {
        serviceClass = DummyScheduledService
      })

      it('uses priority 3', async () => {
        await subject()
        expectAddedToQueueWithPriority('not_urgent', 3)
      })
    })

    context('with a default priority', () => {
      beforeEach(() => {
        serviceClass = DefaultDummyScheduledService
      })

      it('uses priority 2', async () => {
        await subject()
        expectAddedToQueueWithPriority('default', 2)
      })
    })

    context('with an urgent priority', () => {
      beforeEach(() => {
        serviceClass = UrgentDummyScheduledService
      })

      it('uses priority 1', async () => {
        await subject()
        expectAddedToQueueWithPriority('urgent', 1)
      })
    })

    context('with a not_urgent priority', () => {
      beforeEach(() => {
        serviceClass = NotUrgentDummyScheduledService
      })

      it('uses priority 3', async () => {
        await subject()
        expectAddedToQueueWithPriority('not_urgent', 3)
      })
    })

    context('with a last priority', () => {
      beforeEach(() => {
        serviceClass = LastDummyScheduledService
      })

      it('uses priority 4', async () => {
        await subject()
        expectAddedToQueueWithPriority('last', 4)
      })
    })
  })
})
