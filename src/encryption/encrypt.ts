import jwt from 'jsonwebtoken'
import InvalidAppEncryptionKey from '../error/encrypt/invalid-app-encryption-key'

export default class Encrypt {
  public static sign(data: string) {
    try {
      return jwt.sign(data, process.env.APP_ENCRYPTION_KEY as string)
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
      const payload = jwt.verify(encrypted, process.env.APP_ENCRYPTION_KEY as string)
      return payload
    } catch (err) {
      return null
    }
  }
}
