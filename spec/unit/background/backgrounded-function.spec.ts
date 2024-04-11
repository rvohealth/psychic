import {
  backgroundedDummyConstFunction,
  backgroundedDummyDefaultFunction,
  backgroundedDummyNamedFunction,
} from '../../../test-app/app/services/functions/dummyFunction'
import readTmpFile from '../../helpers/readTmpFile'

describe('backgroundedFunction', () => {
  context('passed a default exported function', () => {
    it('runs the function in the background', async () => {
      await backgroundedDummyDefaultFunction('hello', 'world')
      expect(await readTmpFile()).toEqual('hello 1 world')
    })
  })

  context('passed an exported const function', () => {
    it('runs the function in the background', async () => {
      await backgroundedDummyConstFunction('hello', 'world')
      expect(await readTmpFile()).toEqual('hello 2 world')
    })
  })

  context('passed an exported, named function', () => {
    it('runs the function in the background', async () => {
      await backgroundedDummyNamedFunction('hello', 'world')
      expect(await readTmpFile()).toEqual('hello 3 world')
    })
  })
})
