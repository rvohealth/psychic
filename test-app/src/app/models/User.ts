import {
  BeforeCreate,
  BeforeUpdate,
  DreamColumn,
  DreamSerializers,
  Validates,
  Virtual,
} from '@rvohealth/dream'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import ApplicationModel from './ApplicationModel'
import Pet from './Pet'
import Post from './Post'
export default class User extends ApplicationModel {
  public get table() {
    return 'users' as const
  }

  public get serializers(): DreamSerializers<User> {
    return {
      default: 'UserSerializer',
      summary: 'UserSummarySerializer',
      extra: 'UserExtraSerializer',
      withPosts: 'UserWithPostsSerializer',
      withRecentPost: 'UserWithRecentPostSerializer',
      withFlattenedPost: 'UserWithFlattenedPostSerializer',
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

  @User.HasMany('Pet')
  public pets: Pet[]

  @User.HasMany('Post')
  public posts: Post[]

  @User.HasOne('Post')
  public recentPost: Post | null

  @BeforeCreate()
  @BeforeUpdate()
  public async hashPass() {
    if (this.password)
      this.passwordDigest = await insecurePasswordHashSinceBcryptBringsInTooMuchGarbage(this.password)
    this.password = undefined
  }

  public async checkPassword(password: string) {
    if (!this.passwordDigest) return false
    return await insecurePasswordCompareSinceBcryptBringsInTooMuchGarbage(password, this.passwordDigest)
  }
}

const keyLength = 64
/**
 * Has a password or a secret with a password hashing algorithm (scrypt)
 * @param {string} password
 * @returns {string} The salt+hash
 */
export const insecurePasswordHashSinceBcryptBringsInTooMuchGarbage = (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')

    scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err)
      resolve(`${salt}.${derivedKey.toString('hex')}`)
    })
  })
}

/**
 * Compare a plain text password with a salt+hash password
 * @param {string} password The plain text password
 * @param {string} hash The hash+salt to check against
 * @returns {boolean}
 */
export const insecurePasswordCompareSinceBcryptBringsInTooMuchGarbage = (
  password: string,
  hash: string,
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const [salt, hashKey] = hash.split('.')
    const hashKeyBuff = Buffer.from(hashKey, 'hex')

    scrypt(password, salt, keyLength, (err, derivedKey) => {
      if (err) reject(err)
      resolve(timingSafeEqual(hashKeyBuff, derivedKey))
    })
  })
}
