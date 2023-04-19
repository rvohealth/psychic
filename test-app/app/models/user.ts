import { BeforeCreate, BeforeUpdate, Column, Validates, dream } from 'dream'
import Hash from '../../../src/encryption/hash'

const Dream = dream('users')
export default class User extends Dream {
  @Column('number')
  public id: number

  @Validates('contains', '@')
  @Validates('presence')
  @Column('string')
  public email: string

  @Column('string')
  public name: string

  @Validates('length', { min: 4, max: 18 })
  @Column('string')
  public password_digest: string
  public password?: string | null

  @Column('datetime')
  public created_at: Date

  @Column('datetime')
  public updated_at: Date

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
