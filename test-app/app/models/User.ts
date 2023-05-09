import { Dream, BeforeCreate, BeforeUpdate, Validates, Virtual } from 'dream'
import Hash from '../../../src/encryption/hash'
export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public id: number
  public name: string
  public created_at: Date
  public updated_at: Date

  @Validates('contains', '@')
  @Validates('presence')
  public email: string

  @Virtual()
  public password?: string | null
  public password_digest: string

  public static backgroundTest() {}

  @BeforeCreate()
  @BeforeUpdate()
  public async hashPass() {
    if (this.password) this.password_digest = await Hash.gen(this.password)
    this.password = undefined
  }

  public async checkPassword(password: string) {
    if (!this.password_digest) return false
    return await Hash.check(password, this.password_digest)
  }
}
