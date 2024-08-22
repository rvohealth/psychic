import { testEnv } from '@rvohealth/dream'
import bcrypt from 'bcrypt'
import PsychicApplication from '../psychic-application'

export default class Hash {
  public static get saltRounds() {
    const psychicApp = PsychicApplication.getOrFail()
    return psychicApp.saltRounds || (testEnv() ? 4 : 11)
  }

  static async gen(plaintext: string) {
    return await bcrypt.hash(plaintext, this.saltRounds)
  }

  static async check(plaintext: string, hash: string) {
    if (!plaintext) return false
    return await bcrypt.compare(plaintext, hash)
  }
}
