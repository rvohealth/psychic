import { Dream, BeforeCreate, BeforeUpdate, Validates, Virtual, BelongsTo, HasMany } from '@rvohealth/dream'
import Hash from '../../../src/encryption/hash'
import Pet from './Pet'
import UserSerializer from '../serializers/UserSerializer'
import ApplicationModel from './ApplicationModel'
export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializer() {
    return UserSerializer
  }

  public id: number
  public name: string
  public createdAt: Date
  public updatedAt: Date

  @Validates('contains', '@')
  @Validates('presence')
  public email: string

  @Virtual()
  public password?: string | null
  public passwordDigest: string

  @HasMany(() => Pet)
  public pets: Pet[]

  public static backgroundTest() {}

  @BeforeCreate()
  @BeforeUpdate()
  public async hashPass() {
    if (this.password) this.passwordDigest = await Hash.gen(this.password)
    this.password = undefined
  }

  public async checkPassword(password: string) {
    if (!this.passwordDigest) return false
    return await Hash.check(password, this.passwordDigest)
  }

  public async testBackground(arg: string) {
    return await this._testBackground(this.id, arg)
  }

  public async _testBackground(userId: any, arg: string) {}
}
