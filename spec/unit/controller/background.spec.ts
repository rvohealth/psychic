import background from '../../../src/background'
import BackgroundTestController from '../../../test-app/app/controllers/BackgroundTestController'

// NOTE: instance methods are intentionally left off here, since backgrounding an instance method on
// a controller would force you to background the request object itself, which doesn't make sense.
describe('PsychicController background methods', () => {
  describe('.background', () => {
    it('adds the model static method to the worker queue', async () => {
      jest.spyOn(background, 'staticMethod').mockResolvedValue(undefined)

      await BackgroundTestController.background('doSomethingInBackground', 1, '2')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(background.staticMethod).toHaveBeenCalledWith(
        BackgroundTestController,
        'doSomethingInBackground',
        {
          filepath: 'app/controllers/BackgroundTestController',
          args: [1, '2'],
        },
      )
    })
  })

  describe('.backgroundWithDelay', () => {
    it('adds the model static method to the worker queue', async () => {
      jest.spyOn(background, 'staticMethod').mockResolvedValue(undefined)

      await BackgroundTestController.backgroundWithDelay(3, 'doSomethingInBackground', 1, '2')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(background.staticMethod).toHaveBeenCalledWith(
        BackgroundTestController,
        'doSomethingInBackground',
        {
          delaySeconds: 3,
          filepath: 'app/controllers/BackgroundTestController',
          args: [1, '2'],
        },
      )
    })
  })
})
