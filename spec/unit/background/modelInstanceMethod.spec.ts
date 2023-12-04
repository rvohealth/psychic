import { describe as context } from '@jest/globals'
import background, { BackgroundQueuePriority } from '../../../src/background'
import User from '../../../test-app/app/models/User'

describe('background (app singleton)', () => {
  describe('.modelInstanceMethod', () => {
    it('instantiates the model and calls the specified method with the specified args', async () => {
      const user = await User.create({ email: 'ham@howyadoin', passwordDigest: 'coolidge' })
      jest.spyOn(User.prototype, '_testBackground')

      await background.modelInstanceMethod(user, 'testBackground', {
        args: ['howyadoin'],
      })
      expect(User.prototype._testBackground).toHaveBeenCalledWith(user.id, 'howyadoin')
    })
  })

  context('priority', () => {
    let user: User
    let subject = async () => {
      await background.modelInstanceMethod(user, 'testBackground', {
        args: ['howyadoin'],
        priority,
      })
    }
    let priority: BackgroundQueuePriority

    beforeEach(async () => {
      user = await User.create({ email: 'ham@howyadoin', passwordDigest: 'coolidge' })
    })

    function expectAddedToQueueWithPriority(priority: BackgroundQueuePriority, priorityLevel: number) {
      expect(background.queue!.add).toHaveBeenCalledWith(
        'BackgroundJobQueueModelInstanceJob',
        {
          filepath: 'app/models/User',
          id: user.id,
          args: ['howyadoin'],
          priority,
          importKey: undefined,
          method: 'testBackground',
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
