import jwt from 'jsonwebtoken'
import Encrypt from '../../../src/encryption/encrypt'
import InvalidAppEncryptionKey from '../../../src/error/encrypt/invalid-app-encryption-key'

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

    context('with no APP_ENCRYPTION_KEY set', () => {
      beforeEach(() => {
        process.env.APP_ENCRYPTION_KEY = ''
        jest.spyOn(console, 'log').mockImplementation(() => {})
      })

      it('raises a targeted exception', () => {
        expect(() => Encrypt.sign('how')).toThrowError(InvalidAppEncryptionKey)
      })

      it('logs to the console to ensure that devs see their mistake', () => {
        try {
          Encrypt.sign('how')
        } catch (_) {}

        expect(console.log).toHaveBeenCalledWith(new InvalidAppEncryptionKey().message)
      })
    })
  })
})
