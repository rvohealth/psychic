import { camelize, snakeify } from '@rvohealth/dream'
import { PsychicParamsDictionary, PsychicParamsPrimitive } from '../controller'
import { isObject } from '../helpers/typechecks'

export default class Params {
  public static restrict<T extends typeof Params>(
    this: T,
    params: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowed: string[],
  ) {
    return new this().restrict(params, allowed)
  }

  public static casing<T extends typeof Params>(this: T, casing: 'snake' | 'camel') {
    return new this().casing(casing)
  }

  private _casing: 'snake' | 'camel' | null = null
  constructor() {}

  public casing(casing: 'snake' | 'camel') {
    this._casing = casing
    return this
  }

  public restrict(
    param: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowed: string[],
  ) {
    const permitted: PsychicParamsDictionary = {}
    if (param === null || param === undefined) return permitted

    if (!isObject(param))
      throw new Error(`Params.restrict expects object or null, received: ${JSON.stringify(param)}`)

    const objectParam = param as PsychicParamsDictionary

    allowed.forEach(field => {
      let transformedParams = { ...objectParam }
      switch (this._casing) {
        case 'snake':
          transformedParams = snakeify(objectParam)
          break

        case 'camel':
          transformedParams = camelize(objectParam)
          break
      }

      if (transformedParams[field] !== undefined) permitted[field] = transformedParams[field]
    })
    return permitted
  }
}
