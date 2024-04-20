import { camelize, snakeify } from '@rvohealth/dream'
import {
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
  PsychicParamsPrimitiveLiterals,
} from '../controller'
import { isObject } from '../helpers/typechecks'
import { isArray } from 'node:util'

export default class Params {
  public static restrict<T extends typeof Params>(
    this: T,
    params: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowed: string[]
  ) {
    return new this().restrict(params, allowed)
  }

  /**
   * ### .validated
   *
   * Returns the param requested if it passes validation
   * for the type specified. If the param is not of the type
   * specified, an error is raised.
   *
   * ```ts
   *
   * // from within your controller...
   *
   * // raise error if not string
   * Params.validated(this.params.id, 'string')
   *
   * // raise error if not number
   * Params.validated(this.params.amount, 'number')
   *
   * // raise error if not array of integers
   * Params.validated(this.params.amounts, 'integer[]')
   *
   * // raise error if not 'chalupas' or 'other'
   * Params.validated(this.params.stuff, { enum: ['chalupas', 'other'] })
   * ```
   */
  public static validated<
    T extends typeof Params,
    const EnumType extends readonly string[],
    OptsValue extends undefined | { allowNull?: boolean; match?: RegExp },
    OptsType extends {
      allowNull?: boolean
      match?: RegExp
      enum?: EnumType
    },
    ExpectedType extends
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp
      | OptsType,
    ReturnType extends ExpectedType extends RegExp
      ? string
      : ExpectedType extends 'string'
        ? string
        : ExpectedType extends 'number'
          ? number
          : ExpectedType extends 'integer'
            ? number
            : ExpectedType extends 'boolean'
              ? boolean
              : ExpectedType extends 'null'
                ? null
                : ExpectedType extends 'string[]'
                  ? string[]
                  : ExpectedType extends 'number[]'
                    ? number[]
                    : ExpectedType extends 'integer[]'
                      ? number[]
                      : ExpectedType extends 'boolean[]'
                        ? boolean
                        : ExpectedType extends 'null[]'
                          ? null
                          : ExpectedType extends { enum: infer EnumValue }
                            ? EnumValue
                            : never,
    AllowNullOrUndefined extends boolean = ExpectedType extends { allowNull: infer R }
      ? R extends true
        ? true
        : R extends false
          ? false
          : never
      : OptsValue extends { allowNull: infer RR }
        ? RR extends true
          ? true
          : RR extends false
            ? false
            : never
        : false,
  >(
    this: T,
    param: PsychicParamsPrimitive | PsychicParamsPrimitive[],
    expectedType: ExpectedType,
    opts?: OptsValue
  ): AllowNullOrUndefined extends true ? ReturnType | null | undefined : ReturnType {
    return new this().validated(param, expectedType, opts) as ReturnType
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

  public validated<
    EnumType extends readonly string[],
    OptsType extends {
      allowNull?: boolean
      match?: RegExp
      enum?: EnumType
    },
    OptsValue extends undefined | { allowNull?: boolean; match?: RegExp },
    ExpectedType extends
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp
      | OptsType,
    ReturnType extends ExpectedType extends RegExp
      ? string
      : ExpectedType extends 'string'
        ? string
        : ExpectedType extends 'number'
          ? number
          : ExpectedType extends 'integer'
            ? number
            : ExpectedType extends 'boolean'
              ? boolean
              : ExpectedType extends 'null'
                ? null
                : ExpectedType extends 'string[]'
                  ? string[]
                  : ExpectedType extends 'number[]'
                    ? number[]
                    : ExpectedType extends 'integer[]'
                      ? number[]
                      : ExpectedType extends 'boolean[]'
                        ? boolean
                        : ExpectedType extends 'null[]'
                          ? null
                          : ExpectedType extends { enum: infer EnumValue }
                            ? EnumValue
                            : never,
    AllowNullOrUndefined extends boolean = ExpectedType extends { allowNull: infer R }
      ? R extends true
        ? true
        : R extends false
          ? false
          : never
      : OptsValue extends { allowNull: infer RR }
        ? RR extends true
          ? true
          : RR extends false
            ? false
            : never
        : false,
  >(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    expectedType: ExpectedType,
    opts?: OptsValue
  ): AllowNullOrUndefined extends true ? ReturnType | null | undefined : ReturnType {
    const realOpts = this.getOpts(expectedType, opts)

    if (expectedType instanceof RegExp) {
      return this.matchRegexOrThrow(paramValue as string, expectedType, realOpts) as ReturnType
    }

    switch (
      expectedType as
        | (typeof PsychicParamsPrimitiveLiterals)[number]
        | (typeof PsychicParamsPrimitiveLiterals)[number][]
    ) {
      case 'string':
        if (typeof paramValue !== 'string') this.throwUnlessNull(paramValue, ['string'], realOpts)
        if (realOpts.match) {
          return this.matchRegexOrThrow(paramValue as string, realOpts.match, realOpts) as ReturnType
        } else {
          return paramValue as ReturnType
        }

      case 'number':
        if (typeof paramValue === 'number') return paramValue as ReturnType
        if (`${parseFloat(paramValue as string)}` !== `${paramValue as string}`)
          this.throwUnlessNull(paramValue, ['integer'], realOpts)
        if (Number.isNaN(parseFloat(paramValue as string)))
          this.throwUnlessNull(paramValue, ['number'], realOpts)
        return parseFloat(paramValue as string) as ReturnType

      case 'integer':
        if (Number.isInteger(paramValue)) return paramValue as ReturnType
        if (Number.isNaN(parseInt(paramValue as string, 10)))
          this.throwUnlessNull(paramValue, ['integer'], realOpts)
        if (`${parseInt(paramValue as string, 10)}` !== `${paramValue as string}`)
          this.throwUnlessNull(paramValue, ['integer'], realOpts)
        return parseInt(paramValue as string, 10) as ReturnType

      case 'boolean':
        if (paramValue === 'true') return true as ReturnType
        if (paramValue === 'false') return false as ReturnType
        if (typeof paramValue !== 'boolean') this.throwUnlessNull(paramValue, ['boolean'], realOpts)
        return paramValue as ReturnType

      case 'null':
        if (paramValue !== null) this.throw(paramValue, ['null'])
        return null as ReturnType

      case 'string[]':
        if (!isArray(paramValue)) this.throwUnlessNull(paramValue, ['string[]'], realOpts)
        if ((paramValue as string[]).length === 0) return [] as ReturnType
        if ((paramValue as string[]).filter(v => typeof v !== 'string').length > 0)
          this.throwUnlessNull(paramValue, ['string[]'], realOpts)
        if (realOpts.match) {
          ;(paramValue as string[]).forEach(v => this.matchRegexOrThrow(v, realOpts.match!, realOpts))
        }
        return paramValue as ReturnType

      case 'number[]':
        if (!isArray(paramValue)) this.throwUnlessNull(paramValue, ['number[]'], realOpts)
        if ((paramValue as number[]).length === 0) return [] as ReturnType
        if ((paramValue as number[]).filter(v => typeof v !== 'number').length > 0)
          this.throwUnlessNull(paramValue, ['number[]'], realOpts)
        return paramValue as ReturnType

      case 'integer[]':
        if (!isArray(paramValue)) this.throwUnlessNull(paramValue, ['integer[]'], realOpts)
        if ((paramValue as number[]).length === 0) return [] as ReturnType
        if ((paramValue as number[]).find(v => !Number.isInteger(v)))
          this.throwUnlessNull(paramValue, ['integer[]'], realOpts)
        return paramValue as ReturnType

      case 'boolean[]':
        if (!isArray(paramValue)) this.throwUnlessNull(paramValue, ['boolean[]'], realOpts)
        if ((paramValue as number[]).length === 0) return [] as ReturnType
        if ((paramValue as number[]).filter(v => typeof v !== 'boolean').length > 0)
          this.throwUnlessNull(paramValue, ['boolean[]'], realOpts)
        return paramValue as ReturnType

      case 'null[]':
        if (!isArray(paramValue)) this.throwUnlessNull(paramValue, ['null[]'], realOpts)
        if ((paramValue as number[]).length === 0) return [] as ReturnType
        if ((paramValue as number[]).filter(v => v !== null).length > 0)
          this.throwUnlessNull(paramValue, ['null[]'], realOpts)
        return paramValue as ReturnType

      default:
        if (realOpts.enum?.length) {
          if (realOpts.enum.includes(paramValue as string)) return paramValue as ReturnType
          this.throwUnlessNull(paramValue, realOpts.enum as string[])
          return paramValue as ReturnType
        } else {
          // TODO: serialize/sanitize before printing, handle array types
          throw new Error(
            `Unexpected point reached in code. need to handle type for ${expectedType as string}`
          )
        }
    }
  }

  public restrict(
    param: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowed: string[]
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

  private matchRegexOrThrow(
    paramValue: string,
    expectedType: RegExp,
    opts: {
      allowNull?: boolean
      match?: RegExp
    }
  ): string | null {
    if (typeof paramValue !== 'string') this.throwUnlessNull(paramValue, ['string'])
    if (paramValue.length > 1000)
      throw new Error('We do not accept strings over 1000 chars when matching using Params.demand')
    if (expectedType.test(paramValue)) return paramValue
    this.throwUnlessNull(paramValue, ['string'], opts)
    return null
  }

  private throwUnlessNull(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowedValues: string[],
    { allowNull = false }: { allowNull?: boolean } = {}
  ) {
    const isNullOrUndefined = [null, undefined].includes(paramValue as null | undefined)
    if (allowNull && isNullOrUndefined) return
    this.throw(paramValue, allowedValues)
  }

  private throw(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowedValues: string[]
  ) {
    throw new ParamValidationError(paramValue, allowedValues)
  }

  private getOpts<
    EnumType extends readonly string[],
    Opts extends {
      allowNull?: boolean
      match?: RegExp
      enum?: EnumType
    },
  >(
    expectedType:
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp
      | Opts,
    opts?: Opts
  ): Opts {
    if (typeof expectedType === 'string') return opts ?? ({ allowNull: false } as Opts)
    return expectedType as Opts
  }
}

export class ParamValidationError extends Error {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private paramValue: any,
    private permittedValues: string[]
  ) {
    super()
  }

  public get message() {
    return `
Param validation error occured:

expected ${JSON.stringify(this.paramValue)} to to have the following type:
  ${this.permittedValues.join(',\n  ')}
`
  }
}
