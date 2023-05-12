import bcrypt from 'bcrypt'

export default class Hash {
  static SALT_ROUNDS = 11

  static async gen(plaintext: string) {
    return await bcrypt.hash(plaintext, this.SALT_ROUNDS)
  }

  static async check(plaintext: string, hash: string) {
    if (!plaintext) return false
    return await bcrypt.compare(plaintext, hash)
  }
}
