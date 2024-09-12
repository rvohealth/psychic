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

    const res = this.doEncryption(data, encryptOpts.current, encryptOpts.legacy)
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
    legacyEncryptionOpts?: EncryptOptions,
  ) {
    let res: string | null = null
    try {
      res = Encrypt.encrypt(data, encryptionOpts)
    } catch {
      // noop
    }

    if (res) return res

    if (legacyEncryptionOpts) {
      try {
        res = Encrypt.encrypt(data, legacyEncryptionOpts)
      } catch {
        // noop
      }
    }

    return res
  }

  private static doDecryption(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
    encryptionOpts: EncryptOptions,
    legacyEncryptionOpts?: EncryptOptions,
  ) {
    let res: string | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      res = Encrypt.decrypt(data, encryptionOpts)
    } catch {
      // noop
    }

    if (res) return res

    if (legacyEncryptionOpts) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        res = Encrypt.decrypt(data, legacyEncryptionOpts)
      } catch {
        // noop
      }
    }

    return res
  }
}
