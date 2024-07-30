import jwt from 'jsonwebtoken'
import InvalidAppEncryptionKey from '../error/encrypt/invalid-app-encryption-key'
import { getCachedPsyconfOrFail } from '../psyconf/cache'

export default class Encrypt {
  public static sign(data: string) {
    try {
      const psyconf = getCachedPsyconfOrFail()
      return jwt.sign(data, psyconf.encryptionKey)
    } catch (_) {
      const err = new InvalidAppEncryptionKey()
      // intentionally doing a manual console.log here to ensure that
      // this shows up in circleci, since this error is otherwise fairly hard to track down
      console.log(err.message)

      throw err
    }
  }

  public static decode(encrypted: string): string | jwt.JwtPayload | null {
    try {
      const psyconf = getCachedPsyconfOrFail()
      const payload = jwt.verify(encrypted, psyconf.encryptionKey)
      return payload
    } catch (err) {
      return null
    }
  }
}
