import { Decorators } from '@rvoh/dream'
import { DreamColumn, DreamSerializers } from '@rvoh/dream/types'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import ApplicationModel from './ApplicationModel.js'
import Balloon from './Balloon.js'
import Pet from './Pet.js'
import Post from './Post.js'

const deco = new Decorators<typeof User>()

export default class User extends ApplicationModel {
  public override get table() {
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
      withOptionalFlattenedPost: 'UserWithOptionalFlattenedPostSerializer',
    }
  }

  public id: DreamColumn<User, 'id'>
  public name: DreamColumn<User, 'name'>
  public nicknames: DreamColumn<User, 'nicknames'>
  public requiredNicknames: DreamColumn<User, 'requiredNicknames'>
  public birthdate: DreamColumn<User, 'birthdate'>
  public aDatetime: DreamColumn<User, 'aDatetime'>
  public volume: DreamColumn<User, 'volume'>

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

  public species: DreamColumn<User, 'species'>
  public favoriteTreats: DreamColumn<User, 'favoriteTreats'>
  public collarCount: DreamColumn<User, 'collarCount'>
  public collarCountInt: DreamColumn<User, 'collarCountInt'>
  public collarCountNumeric: DreamColumn<User, 'collarCountNumeric'>
  public requiredCollarCount: DreamColumn<User, 'requiredCollarCount'>
  public requiredCollarCountInt: DreamColumn<User, 'requiredCollarCountInt'>
  public likesWalks: DreamColumn<User, 'likesWalks'>
  public likesTreats: DreamColumn<User, 'likesTreats'>

  public createdOn: DreamColumn<User, 'createdOn'>
  public createdAt: DreamColumn<User, 'createdAt'>
  public updatedAt: DreamColumn<User, 'updatedAt'>

  @deco.Validates('contains', '@')
  @deco.Validates('presence')
  public email: DreamColumn<User, 'email'>

  @deco.Virtual(['string', 'null'])
  public password: string | null | undefined
  public passwordDigest: string

  @deco.Virtual({ type: ['string', 'null'] })
  public openapiVirtualSpecTest: string | null | undefined

  @deco.Virtual('string[]')
  public openapiVirtualSpecTest2: string | null | undefined

  public openapiVirtualSpecTest3: string | null | undefined

  @deco.HasMany('Balloon')
  public balloons: Balloon[]

  @deco.HasMany('Pet')
  public pets: Pet[]

  @deco.HasMany('Post')
  public posts: Post[]

  @deco.HasOne('Post')
  public recentPost: Post | null

  @deco.BeforeCreate()
  @deco.BeforeUpdate()
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
    const hashKeyBuff = Buffer.from(hashKey ?? '', 'hex')

    scrypt(password, salt ?? '', keyLength, (err, derivedKey) => {
      if (err) reject(err)
      resolve(timingSafeEqual(hashKeyBuff, derivedKey))
    })
  })
}
