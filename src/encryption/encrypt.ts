import * as jwt from 'jsonwebtoken'

export default class Encrypt {
  public static sign(data: any) {
    return jwt.sign(data, process.env.APP_ENCRYPTION_KEY as string)
  }

  public static decode(encrypted: string): any {
    try {
      const payload = jwt.verify(encrypted, process.env.APP_ENCRYPTION_KEY as string)
      return payload
    } catch (err) {
      return null
    }
  }
}
