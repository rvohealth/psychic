import { testEnv } from '@rvohealth/dream'
import bcrypt from 'bcrypt'
import { getCachedPsyconfOrFail } from '../psyconf/cache'

export default class Hash {
  public static get saltRounds() {
    const psyconf = getCachedPsyconfOrFail()
    return psyconf.saltRounds || (testEnv() ? 4 : 11)
  }

  static async gen(plaintext: string) {
    return await bcrypt.hash(plaintext, this.saltRounds)
  }

  static async check(plaintext: string, hash: string) {
    if (!plaintext) return false
    return await bcrypt.compare(plaintext, hash)
  }
}
