import jwt from 'jsonwebtoken'
import InvalidAppEncryptionKey from '../error/encrypt/invalid-app-encryption-key'
import PsychicApplication from '../psychic-application'

export default class Encrypt {
  public static sign(data: string) {
    try {
      const psychicApp = PsychicApplication.getOrFail()
      return jwt.sign(data, psychicApp.encryptionKey)
    } catch (_) {
      const err = new InvalidAppEncryptionKey()
      // intentionally doing a manual PsychicApplication.log here to ensure that
      // this shows up in circleci, since this error is otherwise fairly hard to track down
      PsychicApplication.log(err.message)

      throw err
    }
  }

  public static decode(encrypted: string): string | jwt.JwtPayload | null {
    try {
      const psychicApp = PsychicApplication.getOrFail()
      const payload = jwt.verify(encrypted, psychicApp.encryptionKey)
      return payload
    } catch (err) {
      return null
    }
  }
}
