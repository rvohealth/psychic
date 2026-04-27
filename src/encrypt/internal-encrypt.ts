import { Encrypt } from '@rvoh/dream/utils'
import MissingCookieEncryptionOpts from '../error/encrypt/missing-cookie-encryption-options.js'
import PsychicApp from '../psychic-app/index.js'

export default class InternalEncrypt {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static encryptCookie(data: any) {
    const psychicApp = PsychicApp.getOrFail()
    const encryptOpts = psychicApp.encryption?.cookies
    if (!encryptOpts) throw new MissingCookieEncryptionOpts()

    if (data === null || data === undefined) return null

    return Encrypt.encrypt(data, encryptOpts.current)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static decryptCookie<RetType>(data: any): RetType | null {
    const psychicApp = PsychicApp.getOrFail()
    const encryptOpts = psychicApp.encryption?.cookies
    if (!encryptOpts) throw new MissingCookieEncryptionOpts()

    if (data === null || data === undefined) return null

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return Encrypt.decrypt<RetType>(data, encryptOpts.current, encryptOpts.legacy)
  }
}
