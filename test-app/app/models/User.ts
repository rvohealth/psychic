import { BeforeCreate, BeforeUpdate, Validates, Virtual, HasMany, DreamColumn } from '@rvohealth/dream'
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

  public id: DreamColumn<User, 'id'>
  public name: DreamColumn<User, 'name'>
  public nicknames: DreamColumn<User, 'nicknames'>
  public requiredNicknames: DreamColumn<User, 'requiredNicknames'>
  public birthdate: DreamColumn<User, 'birthdate'>
  public favoriteUuids: DreamColumn<User, 'favoriteUuids'>
  public requiredFavoriteUuids: DreamColumn<User, 'requiredFavoriteUuids'>
  public favoriteDates: DreamColumn<User, 'favoriteDates'>
  public requiredFavoriteDates: DreamColumn<User, 'requiredFavoriteDates'>
  public favoriteDatetimes: DreamColumn<User, 'favoriteDatetimes'>
  public requiredFavoriteDatetimes: DreamColumn<User, 'requiredFavoriteDatetimes'>
  public favoriteJsons: DreamColumn<User, 'favoriteJsons'>
  public requiredFavoriteJsons: DreamColumn<User, 'requiredFavoriteJsons'>
  public favoriteJsonbs: DreamColumn<User, 'favoriteJsonbs'>
  public requiredFavoriteJsonbs: DreamColumn<User, 'requiredFavoriteJsonbs'>
  public favoriteTexts: DreamColumn<User, 'favoriteTexts'>
  public requiredFavoriteTexts: DreamColumn<User, 'requiredFavoriteTexts'>
  public favoriteNumerics: DreamColumn<User, 'favoriteNumerics'>
  public requiredFavoriteNumerics: DreamColumn<User, 'requiredFavoriteNumerics'>
  public favoriteBooleans: DreamColumn<User, 'favoriteBooleans'>
  public requiredFavoriteBooleans: DreamColumn<User, 'requiredFavoriteBooleans'>
  public favoriteBigints: DreamColumn<User, 'favoriteBigints'>
  public requiredFavoriteBigints: DreamColumn<User, 'requiredFavoriteBigints'>
  public favoriteIntegers: DreamColumn<User, 'favoriteIntegers'>
  public requiredFavoriteIntegers: DreamColumn<User, 'requiredFavoriteIntegers'>
  public bio: DreamColumn<User, 'bio'>
  public notes: DreamColumn<User, 'notes'>
  public jsonData: DreamColumn<User, 'jsonData'>
  public requiredJsonData: DreamColumn<User, 'requiredJsonData'>
  public jsonbData: DreamColumn<User, 'jsonbData'>
  public requiredJsonbData: DreamColumn<User, 'requiredJsonbData'>
  public uuid: DreamColumn<User, 'uuid'>
  public optionalUuid: DreamColumn<User, 'optionalUuid'>
  public createdOn: DreamColumn<User, 'createdOn'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

  @Validates('contains', '@')
  @Validates('presence')
  public email: DreamColumn<User, 'email'>

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  public async _testBackground(userId: any, arg: string) {}
}
