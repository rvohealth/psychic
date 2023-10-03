import { camelize, snakeify } from '@rvohealth/dream'

export default class Params {
  public static restrict<T extends typeof Params>(
    this: T,
    params: { [key: string]: any },
    allowed: string[]
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

  public restrict(params: { [key: string]: any }, allowed: string[]) {
    const permitted: { [key: string]: any } = {}
    if (!params) return permitted

    allowed.forEach(field => {
      let transformedParams = { ...params }
      switch (this._casing) {
        case 'snake':
          transformedParams = snakeify(params)
          break

        case 'camel':
          transformedParams = camelize(params)
          break
      }

      if (transformedParams[field] !== undefined) permitted[field] = transformedParams[field]
    })
    return permitted
  }
}
