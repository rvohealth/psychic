import { Encrypt, EncryptOptions } from '@rvohealth/dream'
import FailedToDecryptCookie from '../error/encrypt/failed-to-decrypt-cookie'
import FailedToEncryptCookie from '../error/encrypt/failed-to-encrypt-cookie'
import MissingCookieEncryptionOpts from '../error/encrypt/missing-cookie-encryption-options'
import PsychicApplication from '../psychic-application'

export default class InternalEncrypt {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static encryptCookie(data: any) {
    const psychicApp = PsychicApplication.getOrFail()
    const encryptOpts = psychicApp.encryption?.cookies
    if (!encryptOpts) throw new MissingCookieEncryptionOpts()

    const res = this.doEncryption(data, encryptOpts.current)
    if (!res) throw new FailedToEncryptCookie()

    return res
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static decryptCookie(data: any) {
    const psychicApp = PsychicApplication.getOrFail()
    const encryptOpts = psychicApp.encryption?.cookies
    if (!encryptOpts) throw new MissingCookieEncryptionOpts()

    const res = this.doDecryption(data, encryptOpts.current, encryptOpts.legacy)
    if (!res) throw new FailedToDecryptCookie()

    return res
  }

  private static doEncryption(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    encryptionOpts: EncryptOptions,
  ) {
    return Encrypt.encrypt(data, encryptionOpts)
  }

  private static doDecryption<RetType>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    encryptionOpts: EncryptOptions,
    legacyEncryptionOpts?: EncryptOptions,
  ): RetType | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return Encrypt.decrypt<RetType>(data, encryptionOpts)
    } catch (error) {
      if (legacyEncryptionOpts) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return Encrypt.decrypt<RetType>(data, legacyEncryptionOpts)
      } else {
        throw error
      }
    }
  }
}
