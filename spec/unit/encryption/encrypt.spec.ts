import jwt from 'jsonwebtoken'
import { PsychicApplication } from '../../../src'
import Encrypt from '../../../src/encryption/encrypt'
import InvalidAppEncryptionKey from '../../../src/error/encrypt/invalid-app-encryption-key'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'

const originalEncryptionKey = process.env.APP_ENCRYPTION_KEY

describe('Encrypt', () => {
  describe('#sign', () => {
    beforeEach(async () => {
      process.env.APP_ENCRYPTION_KEY = 'abc'
      await initializePsychicApplication()

      jest.spyOn(jwt, 'sign')
    })

    afterEach(async () => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
      await initializePsychicApplication()
    })

    it('signs the provided string using jwt', () => {
      Encrypt.sign('how')
      expect(jwt.sign).toHaveBeenCalledWith('how', 'abc')
    })

    context('with no APP_ENCRYPTION_KEY set', () => {
      let spy: jest.SpyInstance

      beforeEach(async () => {
        process.env.APP_ENCRYPTION_KEY = ''
        await initializePsychicApplication()

        spy = jest.spyOn(PsychicApplication, 'log').mockImplementation(() => {})
      })

      it('raises a targeted exception', () => {
        expect(() => Encrypt.sign('how')).toThrowError(InvalidAppEncryptionKey)
      })

      it('logs to the console to ensure that devs see their mistake', () => {
        try {
          Encrypt.sign('how')
        } catch {
          // noop
        }

        expect(spy).toHaveBeenCalledWith(new InvalidAppEncryptionKey().message)
      })
    })
  })
})
