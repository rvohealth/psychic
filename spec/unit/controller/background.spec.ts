import background from '../../../src/background'
import BackgroundTestController from '../../../test-app/app/controllers/BackgroundTest'

// NOTE: instance methods are intentionally left off here, since backgrounding an instance method on
// a controller would force you to background the request object itself, which doesn't make sense.
describe('PsychicController background methods', () => {
  describe('.background', () => {
    it('adds the model static method to the worker queue', async () => {
      // @ts-ignore
      jest.spyOn(background, 'staticMethod').mockResolvedValue({})

      await BackgroundTestController.background('doSomethingInBackground', 1, '2')
      expect(background.staticMethod).toHaveBeenCalledWith(
        BackgroundTestController,
        'doSomethingInBackground',
        {
          filepath: 'app/controllers/BackgroundTest',
          args: [1, '2'],
        }
      )
    })
  })
})
