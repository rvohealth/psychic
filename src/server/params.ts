import { DateTime } from 'luxon'
import {
  Dream,
  DreamAttributes,
  camelize,
  snakeify,
  DreamParamSafeAttributes,
  CalendarDate,
  compact,
} from '@rvohealth/dream'
import {
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
  PsychicParamsPrimitiveLiterals,
} from '../controller'
import { isObject } from '../helpers/typechecks'
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
    ForOpts extends ParamsForOpts<OnlyArray>,
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
  >(params: object, dreamClass: T, forOpts: ForOpts = {} as ForOpts): ReturnPayload {
    const { array = false, only } = forOpts

    if (!dreamClass?.isDream) throw new Error(`Params.for must receive a dream class as it's first argument`)
    if (array) {
      if (!Array.isArray(params))
        throw new Error(`Params.for was expecting a top-level array. got ${typeof params}`)

      return params.map(param =>
        this.for(param as object, dreamClass, { ...forOpts, array: undefined }),
      ) as unknown as ReturnPayload
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = dreamClass.prototype.dreamconf.schema

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const columns = schema[dreamClass.prototype.table]?.columns as object

    const returnObj: Partial<DreamAttributes<InstanceType<T>>> = {}
    const errors: { [key: string]: string[] } = {}
    const paramSafeColumns: (keyof ReturnPartialType)[] = only
      ? ([...dreamClass.paramSafeColumns()].filter(column =>
          only.includes(column),
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
          case 'date':
          case 'date[]':
          case 'integer':
          case 'integer[]':
          case 'uuid':
          case 'uuid[]':
          case 'json':
          case 'json[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              columnMetadata.dbType,
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'character varying':
          case 'citext':
          case 'text':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'string',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'character varying[]':
          case 'citext[]':
          case 'text[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'string[]',
              {
                allowNull: columnMetadata.allowNull,
              },
            )
            break

          case 'timestamp':
          case 'timestamp with time zone':
          case 'timestamp without time zone':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'datetime',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'timestamp[]':
          case 'timestamp with time zone[]':
          case 'timestamp without time zone[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'datetime[]',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'jsonb':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'json',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'jsonb[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'json[]',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'numeric':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'number',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'numeric[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params[columnName as keyof typeof params],
              'number[]',
              { allowNull: columnMetadata.allowNull },
            )
            break

          default:
            if (dreamClass.isVirtualColumn(columnName as string))
              returnObj[columnName as keyof typeof returnObj] = params[columnName as keyof typeof params]

            if (columnMetadata?.enumValues) {
              const paramValue = params[columnName as keyof typeof params]
              if (columnMetadata.isArray) {
                if (!Array.isArray(paramValue))
                  returnObj[columnName as keyof typeof returnObj] = ['expected an array of enum values']

                returnObj[columnName as keyof typeof returnObj] = (paramValue as string[]).map(p =>
                  this.cast(
                    p,

                    // casting to allow enum handling at lower level
                    'string',

                    {
                      allowNull: columnMetadata.allowNull,
                      enum: columnMetadata.enumValues as readonly string[],
                    },
                  ),
                )
              } else {
                returnObj[columnName as keyof typeof returnObj] = this.cast(
                  paramValue,

                  // casting to allow enum handling at lower level
                  'string',
                  // columnMetadata.dbType as (typeof PsychicParamsPrimitiveLiterals)[number],

                  {
                    allowNull: columnMetadata.allowNull,
                    enum: columnMetadata.enumValues as readonly string[],
                  },
                )
              }
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
    allowed: string[],
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
   * Params.cast(this.params.stuff, 'string', { enum: ['chalupas', 'other'] })
   * ```
   */
  public static cast<
    T extends typeof Params,
    const EnumType extends readonly string[],
    OptsType extends ParamsCastOptions<EnumType>,
    ExpectedType extends
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp,
    ValidatedType extends ValidatedReturnType<ExpectedType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    FinalReturnType extends AllowNullOrUndefined extends true
      ? ValidatedType | null | undefined
      : ValidatedType,
  >(this: T, param: PsychicParamsPrimitive, expectedType: ExpectedType, opts?: OptsType): FinalReturnType {
    return new this().cast(param, expectedType, opts) as FinalReturnType
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
    OptsType extends ParamsCastOptions<EnumType>,
    ExpectedType extends
      | (typeof PsychicParamsPrimitiveLiterals)[number]
      | (typeof PsychicParamsPrimitiveLiterals)[number][]
      | RegExp,
    ValidatedType extends ValidatedReturnType<ExpectedType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    ReturnType extends AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType,
  >(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    expectedType: ExpectedType,
    opts?: OptsType,
  ): AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType {
    if (expectedType instanceof RegExp) {
      return this.matchRegexOrThrow(paramValue as string, expectedType, opts) as ReturnType
    }

    let errorMessage: string
    let baseType: (typeof PsychicParamsPrimitiveLiterals)[number]
    let dateClass: typeof DateTime | typeof CalendarDate
    let compactedValue: unknown

    switch (expectedType) {
      case 'string':
        if (typeof paramValue !== 'string') this.throwUnlessAllowNull(paramValue, 'expected string', opts)

        if (opts?.enum && !opts.enum.includes(paramValue as string))
          this.throwUnlessAllowNull(paramValue, 'did not match expected enum values')

        if (opts?.match) {
          return this.matchRegexOrThrow(paramValue as string, opts.match, opts) as ReturnType
        } else {
          return paramValue as ReturnType
        }

      case 'bigint':
        if (
          !Number.isInteger(parseInt(paramValue as string)) ||
          `${parseInt(paramValue as string)}` !== `${paramValue as string}`
        )
          this.throwUnlessAllowNull(paramValue, 'expected bigint', opts)
        return (paramValue ? `${paramValue as number}` : null) as ReturnType

      case 'boolean':
        if (paramValue === 'true') return true as ReturnType
        if (paramValue === 'false') return false as ReturnType
        if ([1, '1'].includes(paramValue as string)) return true as ReturnType
        if ([0, '0'].includes(paramValue as string)) return false as ReturnType
        if (typeof paramValue !== 'boolean') this.throwUnlessAllowNull(paramValue, 'expected boolean', opts)
        return paramValue as ReturnType

      case 'datetime':
      case 'date':
        switch (expectedType) {
          case 'datetime':
            dateClass = DateTime
            break
          case 'date':
            dateClass = CalendarDate
            break
          default:
            if (typeof expectedType === 'string') throw Error(`${expectedType} must be "datetime" or "date"`)
            else throw Error(`expectedType is not a string`)
        }

        errorMessage = 'expecting ISO string or millis since epoch'
        if ((paramValue instanceof DateTime || paramValue instanceof CalendarDate) && paramValue.isValid)
          return paramValue as ReturnType

        if (typeof paramValue === 'string') {
          const dateTime = dateClass.fromISO(paramValue)
          if (dateTime.isValid) return dateTime as ReturnType
          throw new ParamValidationError(errorMessage)
        } else if (Number.isInteger(paramValue as number)) {
          const dateTime = DateTime.fromMillis(paramValue as number)
          if (dateTime.isValid) return dateTime as ReturnType
          throw new ParamValidationError(errorMessage)
        } else {
          if (paramValue === null && opts?.allowNull) {
            return null as ReturnType
          }
          throw new ParamValidationError(errorMessage)
        }

      case 'integer':
        errorMessage = 'expected integer or string integer'
        if (Number.isInteger(paramValue)) return parseInt(paramValue as string) as ReturnType
        if (Number.isNaN(parseInt(paramValue as string, 10)))
          this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        if (`${parseInt(paramValue as string, 10)}` !== `${paramValue as string}`)
          this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        return (paramValue === null ? null : parseInt(paramValue as string, 10)) as ReturnType

      case 'json':
        errorMessage = 'expected an object'
        if (typeof paramValue !== 'object') throw new ParamValidationError(errorMessage)
        if (paramValue === null) this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        return (paramValue === null ? null : paramValue) as ReturnType

      case 'number':
        errorMessage = 'expected number or string number'
        if (typeof paramValue === 'number') return paramValue as ReturnType
        if (`${parseFloat(paramValue as string)}` !== `${paramValue as string}`)
          this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        if (Number.isNaN(parseFloat(paramValue as string)))
          this.throwUnlessAllowNull(paramValue, errorMessage, opts)
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
        if (paramValue === null) this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        if (paramValue !== null && !isUuid(paramValue)) throw new ParamValidationError(errorMessage)
        return paramValue as ReturnType

      case 'bigint[]':
      case 'boolean[]':
      case 'datetime[]':
      case 'date[]':
      case 'integer[]':
      case 'json[]':
      case 'number[]':
      case 'string[]':
      case 'uuid[]':
        baseType = (expectedType as string).replace(
          /\[\]$/,
          '',
        ) as (typeof PsychicParamsPrimitiveLiterals)[number]
        errorMessage = `expected ${baseType}[]`
        if ([undefined, null].includes(paramValue as null))
          this.throwUnlessAllowNull(paramValue, errorMessage, opts)

        if (![undefined, null].includes(paramValue as null) && !Array.isArray(paramValue))
          throw new ParamValidationError(errorMessage)

        compactedValue = [undefined, null].includes(paramValue as unknown as null)
          ? paramValue
          : compact(paramValue as string[])

        return (
          // casting as string[] here because this will actually cause
          // build failures once it is brought into other apps
          (
            [undefined, null].includes(paramValue as null)
              ? paramValue
              : (compactedValue as string[]).map(val => this.cast(val, baseType, opts))
          ) as ReturnType
        )

      case 'null[]':
        errorMessage = 'expected null array'
        if (!Array.isArray(paramValue)) this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        if ((paramValue as number[]).length === 0) return [] as ReturnType
        if ((paramValue as number[]).filter(v => v !== null).length > 0)
          this.throwUnlessAllowNull(paramValue, errorMessage, opts)
        return paramValue as ReturnType

      default:
        // TODO: serialize/sanitize before printing, handle array types
        throw new Error(
          `Unexpected point reached in code. need to handle type for ${expectedType as unknown as string}`,
        )
    }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let transformedParams: any

    switch (this._casing) {
      case 'snake':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        transformedParams = snakeify(objectParam)
        break
      default:
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        transformedParams = camelize(objectParam)
    }

    allowed.forEach(field => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      if (transformedParams?.[field] !== undefined) permitted[field] = transformedParams[field]
    })

    return permitted
  }

  private matchRegexOrThrow(
    paramValue: string,
    expectedType: RegExp,
    opts?: ParamsCastOptions<readonly string[]>,
  ): string | null {
    const errorMessage = 'did not match expected pattern'
    if (typeof paramValue !== 'string') this.throwUnlessAllowNull(paramValue, errorMessage)
    if (paramValue.length > 1000) throw new Error('We do not accept strings over 1000 chars')
    if (expectedType.test(paramValue)) return paramValue
    this.throwUnlessAllowNull(paramValue, errorMessage, opts)
    return null
  }

  private throwUnlessAllowNull(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    message: string,
    { allowNull = false }: ParamsCastOptions<readonly string[]> = {},
  ) {
    const isNullOrUndefined = [null, undefined].includes(paramValue as null | undefined)
    if (allowNull && isNullOrUndefined) return
    this.throw(message)
  }

  private throw(message: string) {
    throw new ParamValidationError(message)
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
        : ExpectedType extends 'date'
          ? CalendarDate
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
                        : ExpectedType extends 'date[]'
                          ? CalendarDate[]
                          : ExpectedType extends 'string[]'
                            ? string[]
                            : ExpectedType extends 'bigint[]'
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

export type ParamsCastOptions<EnumType> = {
  allowNull?: boolean
  match?: RegExp
  enum?: EnumType
}

export interface ParamsForOpts<OnlyArray> {
  array?: boolean
  only?: OnlyArray
}
