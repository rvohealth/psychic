import { Dream, BeforeCreate, BeforeUpdate, Validates, Virtual, BelongsTo, HasMany } from 'dream'
import Hash from '../../../src/encryption/hash'
import Pet from './Pet'
import UserSerializer from '../serializers/UserSerializer'
export default class User extends Dream {
  public get table() {
    return 'users' as const
  }

  public get serializer() {
    return UserSerializer
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

  @HasMany(() => Pet)
  public pets: Pet[]

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
