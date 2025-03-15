import {
  CalendarDate,
  camelize,
  compact,
  DateTime,
  Dream,
  DreamAttributes,
  DreamParamSafeAttributes,
  DreamParamSafeColumnNames,
  snakeify,
} from '@rvoh/dream'
import {
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
  PsychicParamsPrimitiveLiterals,
} from '../controller/index.js'
import isUuid from '../helpers/isUuid.js'
import { isObject } from '../helpers/typechecks.js'

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
    I extends InstanceType<T>,
    const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
    ForOpts extends ParamsForOpts<OnlyArray>,
    ParamSafeColumnsOverride extends I['paramSafeColumns' & keyof I] extends never
      ? undefined
      : I['paramSafeColumns' & keyof I] & string[],
    ParamSafeColumns extends ParamSafeColumnsOverride extends string[] | Readonly<string[]>
      ? Extract<
          DreamParamSafeColumnNames<I>,
          ParamSafeColumnsOverride[number] & DreamParamSafeColumnNames<I>
        >[]
      : DreamParamSafeColumnNames<I>[],
    ReturnPartialType extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<
      InstanceType<T>
    >)[]
      ? Partial<{
          [K in Extract<
            ParamSafeColumns[number],
            ForOpts['only'][number & keyof ForOpts['only']]
          >]: DreamParamSafeAttributes<InstanceType<T>>[K]
        }>
      : Partial<{
          [K in ParamSafeColumns[number & keyof ParamSafeColumns] & string]: DreamParamSafeAttributes<
            InstanceType<T>
          >[K & keyof DreamParamSafeAttributes<InstanceType<T>>]
        }>,
    ReturnPayload extends ForOpts['array'] extends true ? ReturnPartialType[] : ReturnPartialType,
  >(params: object, dreamClass: T, forOpts: ForOpts = {} as ForOpts): ReturnPayload {
    const { array = false, only } = forOpts

    if (!dreamClass?.isDream) throw new Error(`Params.for must receive a dream class as it's second argument`)
    if (array) {
      if (!Array.isArray(params))
        throw new Error(`Params.for was expecting a top-level array. got ${typeof params}`)

      return params.map(param =>
        this.for(param as object, dreamClass, { ...forOpts, array: undefined }),
      ) as unknown as ReturnPayload
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = dreamClass.prototype.schema

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const columns = schema[dreamClass.prototype.table]?.columns as object

    const returnObj: Partial<DreamAttributes<InstanceType<T>>> = {}
    const errors: { [key: string]: string[] } = {}
    const paramSafeColumns: (keyof ReturnPartialType)[] = only
      ? ((dreamClass.paramSafeColumnsOrFallback() as string[]).filter(column =>
          only.includes(column as (typeof only)[number]),
        ) as unknown as (keyof ReturnPartialType)[])
      : (dreamClass.paramSafeColumnsOrFallback() as string[] as (keyof ReturnPartialType)[])

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
    const EnumType extends readonly string[],
    OptsType extends ParamsCastOptions<EnumType>,
    ExpectedType extends (typeof PsychicParamsPrimitiveLiterals)[number] | RegExp,
    ValidatedType extends ValidatedReturnType<ExpectedType, OptsType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    FinalReturnType extends AllowNullOrUndefined extends true
      ? ValidatedType | null | undefined
      : ValidatedType,
  >(param: PsychicParamsPrimitive, expectedType: ExpectedType, opts?: OptsType): FinalReturnType {
    return new this().cast(
      typeof param === 'string' ? param.trim() : param,
      expectedType,
      opts,
    ) as FinalReturnType
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
    ExpectedType extends (typeof PsychicParamsPrimitiveLiterals)[number] | RegExp,
    ValidatedType extends ValidatedReturnType<ExpectedType, OptsType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    ReturnType extends AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType,
  >(
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    expectedType: ExpectedType,
    opts?: OptsType,
  ): AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType {
    if (expectedType instanceof RegExp) {
      return this.matchRegexOrThrow(paramValue as string, expectedType) as ReturnType
    }

    if (paramValue === null || paramValue === undefined) {
      if (expectedType === 'null') return null as ReturnType
      this.throwUnlessAllowNull(paramValue, typeToError(expectedType), opts)
      return paramValue as ReturnType
    }

    let dateClass: typeof DateTime | typeof CalendarDate
    const integerRegexp = /^-?\d+$/
    switch (expectedType) {
      case 'string':
        if (typeof paramValue !== 'string') throw new ParamValidationError(typeToError(expectedType))
        if (opts?.enum && !opts.enum.includes(paramValue))
          throw new ParamValidationError('did not match expected enum values')
        if (opts?.match) return this.matchRegexOrThrow(paramValue, opts.match) as ReturnType
        return paramValue as ReturnType

      case 'bigint':
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number')
          throw new ParamValidationError(typeToError(expectedType))
        if (!integerRegexp.test(paramValue?.toString()))
          throw new ParamValidationError(typeToError(expectedType))
        return paramValue.toString() as ReturnType

      case 'boolean':
        if ([true, 'true', 1, '1'].includes(paramValue as string)) return true as ReturnType
        if ([false, 'false', 0, '0'].includes(paramValue as string)) return false as ReturnType
        throw new ParamValidationError(typeToError(expectedType))

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

        if ((paramValue instanceof DateTime || paramValue instanceof CalendarDate) && paramValue.isValid)
          return paramValue as ReturnType

        if (typeof paramValue === 'string') {
          const dateTime = dateClass.fromISO(paramValue, { zone: 'UTC' })
          if (dateTime.isValid) return dateTime as ReturnType
        }

        throw new ParamValidationError(typeToError(expectedType))

      case 'integer':
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number')
          throw new ParamValidationError(typeToError(expectedType))
        if (!integerRegexp.test(paramValue?.toString()))
          throw new ParamValidationError(typeToError(expectedType))
        return parseInt(paramValue as string, 10) as ReturnType

      case 'json':
        if (typeof paramValue !== 'object') throw new ParamValidationError(typeToError(expectedType))
        return paramValue as ReturnType

      case 'number':
        if (typeof paramValue === 'number') return paramValue as ReturnType
        if (typeof paramValue === 'string') {
          if (paramValue.length === 0 || Number.isNaN(Number(paramValue)))
            throw new ParamValidationError(typeToError(expectedType))
          return Number(paramValue) as ReturnType
        }
        throw new ParamValidationError(typeToError(expectedType))

      case 'null':
        if (paramValue !== null) throw new ParamValidationError(typeToError(expectedType))
        return null as ReturnType

      case 'uuid':
        if (isUuid(paramValue)) return paramValue as ReturnType
        throw new ParamValidationError(typeToError(expectedType))

      case 'bigint[]':
      case 'boolean[]':
      case 'datetime[]':
      case 'date[]':
      case 'integer[]':
      case 'json[]':
      case 'number[]':
      case 'string[]':
      case 'uuid[]':
        if (!Array.isArray(paramValue)) throw new ParamValidationError(typeToError(expectedType))
        return compact(
          paramValue.map(param =>
            this.cast(param, arrayTypeToNonArrayType(expectedType), { ...opts, allowNull: true }),
          ),
        ) as ReturnType

      case 'null[]':
        if (!Array.isArray(paramValue)) throw new ParamValidationError(typeToError(expectedType))
        return paramValue.map(param =>
          this.cast(param, arrayTypeToNonArrayType(expectedType), { ...opts, allowNull: true }),
        ) as ReturnType

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

  private matchRegexOrThrow(paramValue: string, expectedType: RegExp): string {
    if (typeof paramValue !== 'string') throw new ParamValidationError(typeToError(expectedType))
    if (paramValue.length > 1000) throw new Error('We do not accept strings over 1000 chars')
    if (expectedType.test(paramValue)) return paramValue
    throw new ParamValidationError(typeToError(expectedType))
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

export type ValidatedReturnType<ExpectedType, OptsType> = ExpectedType extends RegExp
  ? string
  : ExpectedType extends 'string'
    ? OptsType extends { enum: infer EnumValue }
      ? EnumValue extends readonly string[]
        ? EnumValue[number]
        : never
      : string
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
                            ? OptsType extends { enum: infer EnumValue }
                              ? EnumValue extends readonly string[]
                                ? EnumValue[number][]
                                : never
                              : string[]
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
                                        : never

export type ValidatedAllowsNull<ExpectedType, OptsValue> = ExpectedType extends { allowNull: infer R }
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

const typeToErrorMap: Record<(typeof PsychicParamsPrimitiveLiterals)[number], string> = {
  bigint: 'expected bigint',
  boolean: 'expected boolean',
  date: 'expecting ISO date string',
  datetime: 'expecting ISO datetime string',
  integer: 'expected integer or string integer',
  json: 'expected an object',
  null: 'expecting null',
  number: 'expected number or string number',
  string: 'expected string',
  uuid: 'expected uuid',

  'bigint[]': 'expected bigint array',
  'boolean[]': 'expected boolean array',
  'date[]': 'expecting ISO date string array',
  'datetime[]': 'expecting ISO datetime string array',
  'integer[]': 'expected integer or string integer array',
  'json[]': 'expected an object array',
  'null[]': 'expecting null array',
  'number[]': 'expected number or string number array',
  'string[]': 'expected string array',
  'uuid[]': 'expected uuid array',
} as const

function typeToError(param: (typeof PsychicParamsPrimitiveLiterals)[number] | RegExp) {
  if (param instanceof RegExp) return 'did not match expected pattern'
  const message = typeToErrorMap[param]
  return message ?? `expected ${param}`
}

const arrayTypeToNonArrayTypeMap = {
  'bigint[]': 'bigint',
  'boolean[]': 'boolean',
  'date[]': 'date',
  'datetime[]': 'datetime',
  'integer[]': 'integer',
  'json[]': 'json',
  'null[]': 'null',
  'number[]': 'number',
  'string[]': 'string',
  'uuid[]': 'uuid',
} as const

function arrayTypeToNonArrayType(
  param: keyof typeof arrayTypeToNonArrayTypeMap,
): (typeof PsychicParamsPrimitiveLiterals)[number] {
  return arrayTypeToNonArrayTypeMap[param]
}
