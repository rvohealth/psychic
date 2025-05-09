import { Encrypt } from '@rvoh/dream'
import InternalEncrypt from '../../../src/encrypt/internal-encrypt.js'
import initializePsychicApp from '../../../test-app/src/cli/helpers/initializePsychicApp.js'

describe('InternalEncrypt', () => {
  describe('#encryptColumn, #decryptColumn', () => {
    let originalEncryptionKey: string

    beforeEach(async () => {
      originalEncryptionKey = process.env.APP_ENCRYPTION_KEY!
      await initializePsychicApp()
    })

    afterEach(async () => {
      process.env.APP_ENCRYPTION_KEY = originalEncryptionKey
      await initializePsychicApp()
    })

    context('when current encryption key is valid', () => {
      it('uses the current encryption key to parse the data', () => {
        const val = InternalEncrypt.encryptCookie('howyadoin')
        const decrypted = InternalEncrypt.decryptCookie(val)
        expect(decrypted).toEqual('howyadoin')
      })

      it('when the value was encrypted using the legacy encryption key', () => {
        const val = Encrypt.encrypt('howyadoin', {
          algorithm: 'aes-256-gcm',
          key: process.env.LEGACY_APP_ENCRYPTION_KEY!,
        })
        const decrypted = InternalEncrypt.decryptCookie(val)
        expect(decrypted).toEqual('howyadoin')
      })
    })
  })
})
