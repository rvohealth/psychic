import jwt from 'jsonwebtoken'
import InvalidAppEncryptionKey from '../error/encrypt/invalid-app-encryption-key'
import envValue from '../helpers/envValue'

export default class Encrypt {
  public static sign(data: string) {
    try {
      return jwt.sign(data, envValue('APP_ENCRYPTION_KEY'))
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
      const payload = jwt.verify(encrypted, envValue('APP_ENCRYPTION_KEY'))
      return payload
    } catch (err) {
      return null
    }
  }
}
