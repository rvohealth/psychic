import bcrypt from 'bcrypt'

export default class Hash {
  public static get saltRounds() {
    return process.env.SALT_ROUNDS || (process.env.NODE_ENV === 'test' ? 4 : 11)
  }

  static async gen(plaintext: string) {
    return await bcrypt.hash(plaintext, this.saltRounds)
  }

  static async check(plaintext: string, hash: string) {
    if (!plaintext) return false
    return await bcrypt.compare(plaintext, hash)
  }
}
