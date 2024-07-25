import bcrypt from 'bcrypt'
import Hash from '../../../src/encryption/hash'
import envValue from '../../../src/helpers/envValue'

// TODO: finish spec, ensuring that encryption key is passed
const originalEncryptionKey = envValue('APP_ENCRYPTION_KEY')

describe('Hash', () => {
  describe('#gen', () => {
    beforeEach(() => {
      jest.spyOn(bcrypt, 'hash')
    })

    afterEach(() => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
    })

    it('signs the provided string using jwt', async () => {
      await Hash.gen('how')
      expect(bcrypt.hash).toHaveBeenCalledWith('how', 4)
    })

    context('in non-test env', () => {
      it('uses longer salt', async () => {
        process.env.NODE_ENV = 'development'
        await Hash.gen('how')
        expect(bcrypt.hash).toHaveBeenCalledWith('how', 11)
        process.env.NODE_ENV = 'test'
      })
    })
  })
})
