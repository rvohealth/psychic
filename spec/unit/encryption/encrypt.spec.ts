import jwt from 'jsonwebtoken'
import Encrypt from '../../../src/encryption/encrypt'
import InvalidAppEncryptionKey from '../../../src/error/encrypt/invalid-app-encryption-key'
import { Psyconf } from '../../../src'

const originalEncryptionKey = process.env.APP_ENCRYPTION_KEY

describe('Encrypt', () => {
  describe('#sign', () => {
    beforeEach(async () => {
      process.env.APP_ENCRYPTION_KEY = 'abc'
      await Psyconf.reconfigure()

      jest.spyOn(jwt, 'sign')
    })

    afterEach(async () => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
      await Psyconf.reconfigure()
    })

    it('signs the provided string using jwt', () => {
      Encrypt.sign('how')
      expect(jwt.sign).toHaveBeenCalledWith('how', 'abc')
    })

    context('with no APP_ENCRYPTION_KEY set', () => {
      beforeEach(async () => {
        process.env.APP_ENCRYPTION_KEY = ''
        await Psyconf.reconfigure()

        jest.spyOn(console, 'log').mockImplementation(() => {})
      })

      it('raises a targeted exception', () => {
        expect(() => Encrypt.sign('how')).toThrowError(InvalidAppEncryptionKey)
      })

      it('logs to the console to ensure that devs see their mistake', () => {
        try {
          Encrypt.sign('how')
        } catch (_) {
          // noop
        }

        expect(console.log).toHaveBeenCalledWith(new InvalidAppEncryptionKey().message)
      })
    })
  })
})
