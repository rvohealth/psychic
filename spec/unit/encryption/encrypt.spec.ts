import Encrypt from '../../../src/encryption/encrypt'
import InvalidValuePassedToEncryptionDecode from '../../../src/error/encrypt/invalid-value-passed-to-encryption-decode'
import InvalidValuePassedToEncryptionSign from '../../../src/error/encrypt/invalid-value-passed-to-encryption-sign'
import MissingEncryptionKey from '../../../src/error/encrypt/missing-encryption-key'
import initializePsychicApplication from '../../../test-app/src/cli/helpers/initializePsychicApplication'

describe('Encrypt', () => {
  describe('#encrypt', () => {
    let originalEncryptionKey: string

    beforeEach(async () => {
      originalEncryptionKey = process.env.APP_ENCRYPTION_KEY!
      await initializePsychicApplication()
    })

    afterEach(async () => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
      await initializePsychicApplication()
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function expectCanEncryptAndDecryptValue(val: any) {
      const value = Encrypt.encrypt(val)
      expect(value).not.toEqual(val)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
      expect(Encrypt.decrypt(value as any)).toEqual(val)
    }

    it('can encrypt and decrypt object values', () => {
      expectCanEncryptAndDecryptValue({ name: 'chalupas johnson', workType: 'miracles' })
    })

    it('can encrypt and decrypt string values', () => {
      expectCanEncryptAndDecryptValue('howyadoin')
    })

    it('can encrypt and decrypt boolean values', () => {
      expectCanEncryptAndDecryptValue(true)
      expectCanEncryptAndDecryptValue(false)
    })

    it('can encrypt and decrypt numeric values', () => {
      expectCanEncryptAndDecryptValue(1)
      expectCanEncryptAndDecryptValue(1.1111)
    })

    it('can encrypt and decrypt an array of values', () => {
      expectCanEncryptAndDecryptValue([1, 'hi', true])
    })

    context('with null passed', () => {
      it('raises a targeted exception', () => {
        expect(() => Encrypt.encrypt(null)).toThrow(InvalidValuePassedToEncryptionSign)
      })
    })

    context('with undefined passed', () => {
      it('raises a targeted exception', () => {
        expect(() => Encrypt.encrypt(undefined)).toThrow(InvalidValuePassedToEncryptionSign)
      })
    })

    context('with no encryption key set', () => {
      beforeEach(async () => {
        process.env.APP_ENCRYPTION_KEY = ''
        await initializePsychicApplication()
      })

      it('raises a targeted exception', () => {
        expect(() => Encrypt.encrypt('how')).toThrow(MissingEncryptionKey)
      })
    })
  })

  describe('#decrypt', () => {
    context('with null passed', () => {
      it('raises a targeted exception', () => {
        expect(() => Encrypt.decrypt(null as unknown as string)).toThrow(InvalidValuePassedToEncryptionDecode)
      })
    })

    context('with undefined passed', () => {
      it('raises a targeted exception', () => {
        expect(() => Encrypt.decrypt(undefined as unknown as string)).toThrow(
          InvalidValuePassedToEncryptionDecode,
        )
      })
    })
  })

  describe('#generateKey', () => {
    it('generates a 32-bit, base64-encoded string', () => {
      const res = Encrypt.generateKey()
      expect(Buffer.from(res, 'base64').length).toEqual(32)
    })

    context('with a different key length specified', () => {
      it('generates a base64-encoded string with the provided bit length', () => {
        const res = Encrypt.generateKey(31)
        expect(Buffer.from(res, 'base64').length).toEqual(31)
      })
    })
  })

  describe('#validateKey', () => {
    it('returns true for a 32-bit, base64-encoded string', () => {
      const res = Encrypt.generateKey()
      expect(Encrypt.validateKey(res)).toEqual(true)
    })

    context('with a different key length specified', () => {
      it('returns false', () => {
        const res = Encrypt.generateKey(31)
        expect(Encrypt.validateKey(res)).toEqual(false)
      })
    })
  })
})
