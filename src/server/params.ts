import { DateTime } from 'luxon'
import { Dream, DreamAttributes, camelize, snakeify, DreamParamSafeAttributes } from '@rvohealth/dream'
import {
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
  PsychicParamsPrimitiveLiterals,
} from '../controller'
import { isObject } from '../helpers/typechecks'
import { isArray } from 'node:util'
import isUuid from '../helpers/isUuid'

export default class Params {
  /**
   * ### .for
   *
   * given an object with key value pairs, it will validate
   * each field based on the underlying schema of the passed dream model class
   *
   * ```ts
   *
   * // from within your controller...
   *
   * // raise error if not matching attributes for User model
   * const params = Params.for(this.params.user, User)
   * ```
   */
  public static for<
    T extends typeof Dream,
    const OnlyArray extends readonly (keyof DreamParamSafeAttributes<InstanceType<T>>)[],
    ForOpts extends {
      array?: boolean
      only?: OnlyArray
    },
    ReturnPartialType extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<
      InstanceType<T>
    >)[]
      ? Partial<{
          [K in Extract<
            keyof DreamParamSafeAttributes<InstanceType<T>>,
            ForOpts['only'][number & keyof ForOpts['only']]
          >]: DreamParamSafeAttributes<InstanceType<T>>[K]
        }>
      : Partial<DreamParamSafeAttributes<InstanceType<T>>>,
    ReturnPayload extends ForOpts['array'] extends true ? ReturnPartialType[] : ReturnPartialType,
  >(params: object, dreamClass: T, { array = false, only }: ForOpts = {} as ForOpts): ReturnPayload {
    if (!dreamClass?.isDream) throw new Error(`Params.for must receive a dream class as it's first argument`)
    if (array) {
      if (!Array.isArray(params))
        throw new Error(`Params.for was expecting a top-level array. got ${typeof params}`)

      return params.map(param => this.for(param as object, dreamClass)) as unknown as ReturnPayload
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = dreamClass.prototype.dreamconf.schema

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const columns = schema[dreamClass.prototype.table]?.columns as object

    const returnObj: Partial<DreamAttributes<InstanceType<T>>> = {}
    const errors: { [key: string]: string[] } = {}
    const paramSafeColumns: (keyof ReturnPartialType)[] = only
      ? ([...dreamClass.paramSafeColumns()].filter(column =>
          only.includes(column)
        ) as unknown as (keyof ReturnPartialType)[])
      : ([...dreamClass.paramSafeColumns()] as (keyof ReturnPartialType)[])

    for (const columnName of paramSafeColumns) {
      if (params[columnName as keyof typeof params] === undefined) continue

      const columnMetadata = columns[columnName as keyof typeof columns] as {
        dbType: string
        allowNull: boolean
        isArray: boolean
        enumValues: unknown[] | null
      }

      try {
        switch (columnMetadata?.dbType) {
          case 'bigint':
          case 'bigint[]':
          case 'boolean':
          case 'boolean[]':
          case 'integer':
          case 'integer[]':
          case 'uuid':
          case 'uuid[]':
          case 'json':
          case 'json[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              columnMetadata.dbType,
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'character varying':
          case 'text':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'string',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'character varying[]':
          case 'text[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'string[]',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'date':
          case 'timestamp':
          case 'timestamp with time zone':
          case 'timestamp without time zone':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'datetime',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'date[]':
          case 'timestamp[]':
          case 'timestamp with time zone[]':
          case 'timestamp without time zone[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'datetime[]',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'jsonb':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'json',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'jsonb[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'json[]',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'numeric':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'number',
              { allowNull: columnMetadata.allowNull }
            )
            break

          case 'numeric[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'number[]',
              { allowNull: columnMetadata.allowNull }
            )
            break

          default:
            if (dreamClass.isVirtualColumn(columnName as string))
              returnObj[columnName as keyof typeof returnObj] = params[columnName as keyof typeof params]

            if (columnMetadata?.enumValues) {
              returnObj[columnName as keyof typeof returnObj] = this.cast(
                params[columnName as keyof typeof params],

                // casting to allow enum handling at lower level
                columnMetadata.dbType as (typeof PsychicParamsPrimitiveLiterals)[number],

                { allowNull: columnMetadata.allowNull, enum: columnMetadata.enumValues }
              )
            }
        }
      } catch (err) {
        if (err instanceof Error) {
          errors[columnName as string] = [err.message]
        } else {
          throw err
        }
      }
    }

    if (Object.keys(errors).length) {
      throw new ParamValidationError(JSON.stringify(errors, null, 2))
    }

    return returnObj as ReturnPayload
  }

  public static restrict<T extends typeof Params>(
    this: T,
    params: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowed: string[]
  ) {
    return new this().restrict(params, allowed)
  }

  /**
   * ### .cast
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
   * Params.cast(this.params.id, 'string')
   *
   * // raise error if not number
   * Params.cast(this.params.amount, 'number')
   *
   * // raise error if not array of integers
   * Params.cast(this.params.amounts, 'integer[]')
   *
   * // raise error if not 'chalupas' or 'other'
   * Params.cast(this.params.stuff, { enum: ['chalupas', 'other'] })
   * ```
   */
  public static cast<
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
    ReturnType extends ValidatedReturnType<ExpectedType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsValue>,
  >(
    this: T,
    param: PsychicParamsPrimitive | PsychicParamsPrimitive[],
    expectedType: ExpectedType,
    opts?: OptsValue
  ): AllowNullOrUndefined extends true ? ReturnType | null | undefined : ReturnType {
    return new this().cast(param, expectedType, opts) as ReturnType
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

  public cast<
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
    ReturnType extends ValidatedReturnType<ExpectedType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsValue>,
  >(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    expectedType: ExpectedType,
    opts?: OptsValue
  ): AllowNullOrUndefined extends true ? ReturnType | null | undefined : ReturnType {
    const realOpts = this.getOpts(expectedType, opts)

    if (expectedType instanceof RegExp) {
      return this.matchRegexOrThrow(paramValue as string, expectedType, realOpts) as ReturnType
    }

    let errorMessage: string
    let baseType: (typeof PsychicParamsPrimitiveLiterals)[number]
    switch (
      expectedType as
        | (typeof PsychicParamsPrimitiveLiterals)[number]
        | (typeof PsychicParamsPrimitiveLiterals)[number][]
    ) {
      case 'string':
        if (typeof paramValue !== 'string') this.throwUnlessNull(paramValue, 'expected string', realOpts)
        if (realOpts.match) {
          return this.matchRegexOrThrow(paramValue as string, realOpts.match, realOpts) as ReturnType
        } else {
          return paramValue as ReturnType
        }

      case 'bigint':
        if (
          !Number.isInteger(parseInt(paramValue as string)) ||
          `${parseInt(paramValue as string)}` !== `${paramValue as string}`
        )
          this.throwUnlessNull(paramValue, 'expected bigint', realOpts)
        return (paramValue ? `${paramValue as number}` : null) as ReturnType

      case 'boolean':
        if (paramValue === 'true') return true as ReturnType
        if (paramValue === 'false') return false as ReturnType
        if ([1, '1'].includes(paramValue as string)) return true as ReturnType
        if ([0, '0'].includes(paramValue as string)) return false as ReturnType
        if (typeof paramValue !== 'boolean') this.throwUnlessNull(paramValue, 'expected boolean', realOpts)
        return paramValue as ReturnType

      case 'datetime':
        errorMessage = 'expecting ISO string or millis since epoch'
        if ((paramValue as unknown as DateTime)?.isValid) return paramValue as ReturnType
        if (typeof paramValue === 'string') {
          const dateTime = DateTime.fromISO(paramValue)
          if (dateTime.isValid) return dateTime as ReturnType
          throw new ParamValidationError(errorMessage)
        } else if (Number.isInteger(paramValue as number)) {
          const dateTime = DateTime.fromMillis(paramValue as number)
          if (dateTime.isValid) return dateTime as ReturnType
          throw new ParamValidationError(errorMessage)
        } else {
          if (paramValue === null && realOpts.allowNull) {
            return null as ReturnType
          }
          throw new ParamValidationError(errorMessage)
        }

      case 'integer':
        errorMessage = 'expected integer or string integer'
        if (Number.isInteger(paramValue)) return parseInt(paramValue as string) as ReturnType
        if (Number.isNaN(parseInt(paramValue as string, 10)))
          this.throwUnlessNull(paramValue, errorMessage, realOpts)
        if (`${parseInt(paramValue as string, 10)}` !== `${paramValue as string}`)
          this.throwUnlessNull(paramValue, errorMessage, realOpts)
        return (paramValue === null ? null : parseInt(paramValue as string, 10)) as ReturnType

      case 'json':
        errorMessage = 'expected an object'
        if (typeof paramValue !== 'object') throw new ParamValidationError(errorMessage)
        if (paramValue === null) this.throwUnlessNull(paramValue, errorMessage, realOpts)
        return (paramValue === null ? null : paramValue) as ReturnType

      case 'number':
        errorMessage = 'expected number or string number'
        if (typeof paramValue === 'number') return paramValue as ReturnType
        if (`${parseFloat(paramValue as string)}` !== `${paramValue as string}`)
          this.throwUnlessNull(paramValue, errorMessage, realOpts)
        if (Number.isNaN(parseFloat(paramValue as string)))
          this.throwUnlessNull(paramValue, errorMessage, realOpts)
        if (paramValue === null) return null as ReturnType
        if (['number', 'string'].includes(typeof paramValue)) {
          return parseFloat((paramValue as unknown as number).toString()) as ReturnType
        }
        return null as ReturnType

      case 'null':
        if (paramValue !== null) this.throw('expecting null')
        return null as ReturnType

      case 'uuid':
        errorMessage = 'expected uuid'
        if (paramValue === null) this.throwUnlessNull(paramValue, errorMessage, realOpts)
        if (paramValue !== null && !isUuid(paramValue)) throw new ParamValidationError(errorMessage)
        return paramValue as ReturnType

      case 'bigint[]':
      case 'boolean[]':
      case 'datetime[]':
      case 'integer[]':
      case 'json[]':
      case 'number[]':
      case 'string[]':
      case 'uuid[]':
        baseType = (expectedType as string).replace(
          /\[\]$/,
          ''
        ) as (typeof PsychicParamsPrimitiveLiterals)[number]
        errorMessage = `expected ${baseType}[]`
        if (paramValue === null) this.throwUnlessNull(paramValue, errorMessage, realOpts)
        if (paramValue !== null && !Array.isArray(paramValue)) throw new ParamValidationError(errorMessage)
        return (
          paramValue === null ? null : paramValue.map(val => this.cast(val, baseType, opts))
        ) as ReturnType

      case 'null[]':
        errorMessage = 'expected null array'
        if (!isArray(paramValue)) this.throwUnlessNull(paramValue, errorMessage, realOpts)
        if ((paramValue as number[]).length === 0) return [] as ReturnType
        if ((paramValue as number[]).filter(v => v !== null).length > 0)
          this.throwUnlessNull(paramValue, errorMessage, realOpts)
        return paramValue as ReturnType

      default:
        if (realOpts.enum?.length) {
          if (realOpts.enum.includes(paramValue as string)) return paramValue as ReturnType
          this.throwUnlessNull(paramValue, 'did not match expected enum values')
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
    const errorMessage = 'did not match expected pattern'
    if (typeof paramValue !== 'string') this.throwUnlessNull(paramValue, errorMessage)
    if (paramValue.length > 1000) throw new Error('We do not accept strings over 1000 chars')
    if (expectedType.test(paramValue)) return paramValue
    this.throwUnlessNull(paramValue, errorMessage, opts)
    return null
  }

  private throwUnlessNull(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    message: string,
    { allowNull = false }: { allowNull?: boolean } = {}
  ) {
    const isNullOrUndefined = [null, undefined].includes(paramValue as null | undefined)
    if (allowNull && isNullOrUndefined) return
    this.throw(message)
  }

  private throw(message: string) {
    throw new ParamValidationError(message)
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

export class ParamValidationError extends Error {}

type ValidatedReturnType<ExpectedType> = ExpectedType extends RegExp
  ? string
  : ExpectedType extends 'string'
    ? string
    : ExpectedType extends 'number'
      ? number
      : ExpectedType extends 'datetime'
        ? DateTime
        : ExpectedType extends 'bigint'
          ? string
          : ExpectedType extends 'integer'
            ? number
            : ExpectedType extends 'json'
              ? object
              : ExpectedType extends 'boolean'
                ? boolean
                : ExpectedType extends 'null'
                  ? null
                  : ExpectedType extends 'uuid'
                    ? string
                    : ExpectedType extends 'datetime[]'
                      ? DateTime[]
                      : ExpectedType extends 'string[]'
                        ? string[]
                        : ExpectedType extends 'number[]'
                          ? number[]
                          : ExpectedType extends 'integer[]'
                            ? number[]
                            : ExpectedType extends 'boolean[]'
                              ? boolean
                              : ExpectedType extends 'null[]'
                                ? null[]
                                : ExpectedType extends 'uuid[]'
                                  ? string[]
                                  : ExpectedType extends { enum: infer EnumValue }
                                    ? EnumValue
                                    : never

type ValidatedAllowsNull<ExpectedType, OptsValue> = ExpectedType extends { allowNull: infer R }
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
    : false
