import { describe as context } from '@jest/globals'
import background, { BackgroundQueuePriority } from '../../../src/background'
import DummyService from '../../../test-app/app/services/DummyService'
import readTmpFile from '../../helpers/readTmpFile'
import { Queue } from 'bullmq'

describe('background (app singleton)', () => {
  describe('#instanceMethod', () => {
    it('calls the instance method, passing constructor args to the constructor and args to the instance method', async () => {
      await background.instanceMethod(DummyService, 'instanceRunInBG', {
        args: ['bottlearum'],
        constructorArgs: ['bottleawhiskey'],
        filepath: 'test-app/app/services/DummyService.ts',
      })
      expect(await readTmpFile()).toEqual('bottleawhiskey,bottlearum')
    })

    context('priority', () => {
      let subject = async () => {
        await background.instanceMethod(DummyService, 'instanceRunInBG', {
          args: ['bottlearum'],
          constructorArgs: ['bottleawhiskey'],
          filepath: 'test-app/app/services/DummyService.ts',
          priority,
        })
      }
      let priority: BackgroundQueuePriority

      function expectAddedToQueueWithPriority(priority: BackgroundQueuePriority, priorityLevel: number) {
        expect(background.queue!.add).toHaveBeenCalledWith(
          'BackgroundJobQueueInstanceJob',
          {
            filepath: '/app/services/DummyService',
            args: ['bottlearum'],
            constructorArgs: ['bottleawhiskey'],
            priority,
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

        it('sends the default priority to the queue', async () => {
          await subject()
          expectAddedToQueueWithPriority('urgent', 1)
        })
      })

      context('not_urgent priority', () => {
        beforeEach(() => {
          priority = 'not_urgent'
        })

        it('sends the default priority to the queue', async () => {
          await subject()
          expectAddedToQueueWithPriority('not_urgent', 3)
        })
      })

      context('last priority', () => {
        beforeEach(() => {
          priority = 'last'
        })

        it('sends the default priority to the queue', async () => {
          await subject()
          expectAddedToQueueWithPriority('last', 4)
        })
      })
    })
  })
})
