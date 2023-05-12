import jwt from 'jsonwebtoken'
import Encrypt from '../../../src/encryption/encrypt'

const originalEncryptionKey = process.env.APP_ENCRYPTION_KEY

describe('Encrypt', () => {
  describe('#sign', () => {
    beforeEach(() => {
      process.env.APP_ENCRYPTION_KEY = 'abc'
      jest.spyOn(jwt, 'sign')
    })

    afterEach(() => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
    })

    it('signs the provided string using jwt', () => {
      Encrypt.sign('how')
      expect(jwt.sign).toHaveBeenCalledWith('how', 'abc')
    })
  })
})
