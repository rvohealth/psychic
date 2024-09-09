import crypto from 'crypto'
import MissingEncryptionKey from '../error/encrypt/missing-encryption-key'
import PsychicApplication from '../psychic-application'
//
export default class Encrypt {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static encrypt(data: any): string {
    const psychicApp = PsychicApplication.getOrFail()
    if (!psychicApp.encryptionKey) throw new MissingEncryptionKey()

    const key = psychicApp.encryptionKey
    const iv = this.generateKey(12)

    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'))

    let ciphertext = cipher.update(JSON.stringify(data), 'utf8', 'base64')
    ciphertext += cipher.final('base64')

    const tag = cipher.getAuthTag().toString('base64')

    return Buffer.from(JSON.stringify({ ciphertext, iv, tag })).toString('base64')
  }

  public static decrypt<RetType>(encrypted: string): RetType | null {
    const psychicApp = PsychicApplication.getOrFail()
    if (!psychicApp.encryptionKey) throw new MissingEncryptionKey()

    if ([null, undefined].includes(encrypted as unknown as null)) return null

    const key = psychicApp.encryptionKey
    const { ciphertext, tag, iv } = this.unpackPayloadOrFail(encrypted)

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(key, 'base64'),
      Buffer.from(iv, 'base64'),
    )

    decipher.setAuthTag(Buffer.from(tag, 'base64'))

    let plaintext = decipher.update(ciphertext, 'base64', 'utf8')
    plaintext += decipher.final('utf8')

    return JSON.parse(plaintext) as RetType
  }

  public static generateKey(length: number = 32) {
    return crypto.randomBytes(length).toString('base64')
  }

  public static validateKey(base64EncodedKey: string) {
    const res = Buffer.from(base64EncodedKey, 'base64')
    return res.length === 32
  }

  private static unpackPayloadOrFail(payload: string | object): PsychicEncryptionPayload {
    const unpackedPayload = (
      typeof payload === 'string' ? JSON.parse(Buffer.from(payload, 'base64').toString()) : payload
    ) as PsychicEncryptionPayload

    if (typeof unpackedPayload !== 'object') {
      throw new Error(
        'Failed to unpack encrypted object. Must be an object with a ciphertext and tag property',
      )
    }

    const { ciphertext, tag, iv } = unpackedPayload
    if (!ciphertext) throw new Error('invalid ciphertext found')
    if (!tag) throw new Error('invalid tag found')
    if (!iv) throw new Error('missing iv')

    return { ciphertext, tag, iv }
  }
}

export interface PsychicEncryptionPayload {
  ciphertext: string
  tag: string
  iv: string
}
