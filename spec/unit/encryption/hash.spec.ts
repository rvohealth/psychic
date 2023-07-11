import bcrypt from 'bcrypt'
import Hash from '../../../src/encryption/hash'

// TODO: finish spec, ensuring that encryption key is passed
const originalEncryptionKey = process.env.APP_ENCRYPTION_KEY

describe('Hash', () => {
  describe('#gen', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'hash')
    })

    afterEach(() => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
    })

    it('signs the provided string using jwt', () => {
      Hash.gen('how')
      expect(bcrypt.hash).toHaveBeenCalledWith('how', 4)
    })

    it('uses 11 salt rounds in production', () => {
      process.env.NODE_ENV = 'production'
      Hash.gen('how')
      expect(bcrypt.hash).toHaveBeenCalledWith('how', 11)
      process.env.NODE_ENV = 'test'
    })
  })
})
