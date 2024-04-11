import { Job } from 'bullmq'
import background, { BackgroundQueuePriority } from '../../../src/background'

describe('backgroundedFunction', () => {
  context('priority', () => {
    const subject = async () => {
      await background.func({
        args: ['bottlearum'],
        filepath: 'test-app/app/services/functions/dummyFunction.ts',
        importKey: 'default',
        priority,
      })
    }
    let priority: BackgroundQueuePriority

    function expectAddedToQueueWithPriority(priority: BackgroundQueuePriority, priorityLevel: number) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(background.queue!.add).toHaveBeenCalledWith(
        'BackgroundJobQueueFunctionJob',
        {
          args: ['bottlearum'],
          filepath: '/app/services/functions/dummyFunction',
          importKey: 'default',
          priority,
        },
        { priority: priorityLevel },
      )
    }

    beforeEach(async () => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = '1'
      await background.connect()

      jest.spyOn(background.queue!, 'add').mockResolvedValue({} as Job)
    })

    afterEach(() => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = undefined
    })

    context('default priority', () => {
      beforeEach(() => {
        priority = 'default'
      })

      it('sends the default priority to the queue', async () => {
        await subject()
        expectAddedToQueueWithPriority('default', 2)
      })
    })

    context('urgent priority', () => {
      beforeEach(() => {
        priority = 'urgent'
      })

      it('sends the urgent priority to the queue', async () => {
        await subject()
        expectAddedToQueueWithPriority('urgent', 1)
      })
    })

    context('not_urgent priority', () => {
      beforeEach(() => {
        priority = 'not_urgent'
      })

      it('sends the not_urgent priority to the queue', async () => {
        await subject()
        expectAddedToQueueWithPriority('not_urgent', 3)
      })
    })

    context('last priority', () => {
      beforeEach(() => {
        priority = 'last'
      })

      it('sends the last priority to the queue', async () => {
        await subject()
        expectAddedToQueueWithPriority('last', 4)
      })
    })
  })

  context('delaySeconds', () => {
    const subject = async () => {
      await background.func({
        args: ['bottlearum'],
        filepath: 'test-app/app/services/functions/dummyFunction.ts',
        importKey: 'default',
        delaySeconds,
      })
    }
    let delaySeconds: number

    function expectAddedToQueueWithPriority(priority: BackgroundQueuePriority, delay: number) {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(background.queue!.add).toHaveBeenCalledWith(
        'BackgroundJobQueueFunctionJob',
        {
          filepath: '/app/services/functions/dummyFunction',
          args: ['bottlearum'],
          importKey: 'default',
          priority,
        },
        { delay, priority: 2 },
      )
    }

    beforeEach(async () => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = '1'
      await background.connect()

      jest.spyOn(background.queue!, 'add').mockResolvedValue({} as Job)
    })

    afterEach(() => {
      process.env.REALLY_TEST_BACKGROUND_QUEUE = undefined
    })

    it('sets the delay in milliseconds', async () => {
      delaySeconds = 25
      await subject()
      expectAddedToQueueWithPriority('default', 25000)
    })
  })
})
