import { Encrypt, EncryptOptions } from '@rvoh/dream'
import MissingCookieEncryptionOpts from '../error/encrypt/missing-cookie-encryption-options.js.js'
import PsychicApplication from '../psychic-application/index.js.js'

export default class InternalEncrypt {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static encryptCookie(data: any) {
    const psychicApp = PsychicApplication.getOrFail()
    const encryptOpts = psychicApp.encryption?.cookies
    if (!encryptOpts) throw new MissingCookieEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doEncryption(data, encryptOpts.current)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static decryptCookie(data: any) {
    const psychicApp = PsychicApplication.getOrFail()
    const encryptOpts = psychicApp.encryption?.cookies
    if (!encryptOpts) throw new MissingCookieEncryptionOpts()

    if (data === null || data === undefined) return null

    return this.doDecryption(data, encryptOpts.current, encryptOpts.legacy)
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    let decrypted = Encrypt.decrypt<RetType>(data, encryptionOpts)
    if (decrypted === null && legacyEncryptionOpts)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      decrypted = Encrypt.decrypt<RetType>(data, legacyEncryptionOpts)
    return decrypted
  }
}
