import {
  BeforeCreate,
  BeforeUpdate,
  DreamColumn,
  HasMany,
  HasOne,
  Validates,
  Virtual,
} from '@rvohealth/dream'
import Hash from '../../../src/encryption/hash'
import UserSerializer, {
  UserExtraSerializer,
  UserSummarySerializer,
  UserWithPostsSerializer,
  UserWithRecentPostSerializer,
} from '../serializers/UserSerializer'
import ApplicationModel from './ApplicationModel'
import Pet from './Pet'
import Post from './Post'
export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers() {
    return {
      default: UserSerializer,
      summary: UserSummarySerializer,
      extra: UserExtraSerializer,
      withPosts: UserWithPostsSerializer,
      withRecentPost: UserWithRecentPostSerializer,
    }
  }

  public id: DreamColumn<User, 'id'>
  public name: DreamColumn<User, 'name'>
  public nicknames: DreamColumn<User, 'nicknames'>
  public requiredNicknames: DreamColumn<User, 'requiredNicknames'>
  public birthdate: DreamColumn<User, 'birthdate'>

  // begin: favorite records (used for checking type validation in Params.for)
  public favoriteCitext: DreamColumn<User, 'favoriteCitext'>
  public requiredFavoriteCitext: DreamColumn<User, 'requiredFavoriteCitext'>
  public favoriteCitexts: DreamColumn<User, 'favoriteCitexts'>
  public requiredFavoriteCitexts: DreamColumn<User, 'requiredFavoriteCitexts'>
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
  public favoriteBigint: DreamColumn<User, 'favoriteBigint'>
  public requiredFavoriteBigint: DreamColumn<User, 'requiredFavoriteBigint'>
  public favoriteBigints: DreamColumn<User, 'favoriteBigints'>
  public requiredFavoriteBigints: DreamColumn<User, 'requiredFavoriteBigints'>
  public favoriteIntegers: DreamColumn<User, 'favoriteIntegers'>
  public requiredFavoriteIntegers: DreamColumn<User, 'requiredFavoriteIntegers'>
  // end: favorite records

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

  @Virtual({ type: 'string', nullable: true })
  public openapiVirtualSpecTest?: string | null

  @Virtual('string[]')
  public openapiVirtualSpecTest2?: string | null

  @HasMany(() => Pet)
  public pets: Pet[]

  @HasMany(() => Post)
  public posts: Post[]

  @HasOne(() => Post, { order: { id: 'desc' } })
  public recentPost: Post | null

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
