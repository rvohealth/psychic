import { CalendarDate, DateTime, Dream } from '@rvoh/dream'
import {
  OpenapiSchemaArray,
  OpenapiSchemaBody,
  OpenapiSchemaInteger,
  OpenapiSchemaNumber,
  OpenapiSchemaObjectBase,
  OpenapiSchemaPrimitiveGeneric,
  OpenapiSchemaPropertiesShorthand,
  OpenapiSchemaString,
} from '@rvoh/dream/openapi'
import { DreamAttributes, DreamParamSafeAttributes, DreamParamSafeColumnNames } from '@rvoh/dream/types'
import { camelize, compact, snakeify } from '@rvoh/dream/utils'
import {
  PsychicParamsDictionary,
  PsychicParamsPrimitive,
  PsychicParamsPrimitiveLiteral,
} from '../controller/index.js'
import ParamValidationError from '../error/controller/ParamValidationError.js'
import ParamValidationErrors from '../error/controller/ParamValidationErrors.js'
import alternateParamName from '../helpers/alternateParamName.js'
import isArrayParamName from '../helpers/isArrayParamName.js'
import isObject from '../helpers/isObject.js'
import isUuid from '../helpers/isUuid.js'
import { validateObject } from '../helpers/validateOpenApiSchema.js'
import { Inc } from '../i18n/conf/types.js'
import paramNamesForDreamClass from './helpers/paramNamesForDreamClass.js'

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
    ParamSafeAttrs extends DreamParamSafeAttributes<InstanceType<T>>,
    ReturnPartialType extends ForOpts['only'] extends readonly (keyof DreamParamSafeAttributes<
      InstanceType<T>
    >)[]
      ? Partial<{
          [K in ForOpts['only'][number] & keyof ParamSafeAttrs]: ParamSafeAttrs[K & keyof ParamSafeAttrs]
        }>
      : Partial<{
          [K in ParamSafeColumns[number & keyof ParamSafeColumns] &
            string &
            keyof ParamSafeAttrs]: ParamSafeAttrs[K & keyof ParamSafeAttrs]
        }>,
    ReturnPayload extends ForOpts['array'] extends true ? ReturnPartialType[] : ReturnPartialType,
  >(params: object, dreamClass: T, forOpts: ForOpts = {} as ForOpts): ReturnPayload {
    const { array = false } = forOpts

    if (!dreamClass?.isDream) throw new Error(`Params.for must receive a dream class as it's second argument`)
    if (array) {
      if (!Array.isArray(params))
        throw new Error(`Params.for was expecting a top-level array. got ${typeof params}`)

      return params.map(param =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.for(param as object, dreamClass, { ...forOpts, array: undefined } as any),
      ) as unknown as ReturnPayload
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const schema = dreamClass.prototype.schema

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const columns = schema[dreamClass.prototype.table]?.columns as object

    const returnObj: Partial<DreamAttributes<InstanceType<T>>> = {}
    const errors: { [key: string]: string[] } = {}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paramSafeColumns: string[] = paramNamesForDreamClass(dreamClass, forOpts as any)

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
              params,
              columnName.toString(),
              columnMetadata.dbType,
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'character varying':
          case 'citext':
          case 'text':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'string',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'character varying[]':
          case 'citext[]':
          case 'text[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
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
              params,
              columnName.toString(),
              'datetime',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'timestamp[]':
          case 'timestamp with time zone[]':
          case 'timestamp without time zone[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'datetime[]',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'jsonb':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'json',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'jsonb[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'json[]',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'numeric':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'number',
              { allowNull: columnMetadata.allowNull },
            )
            break

          case 'numeric[]':
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'number[]',
              { allowNull: columnMetadata.allowNull },
            )
            break

          default:
            if (dreamClass.isVirtualColumn(columnName))
              returnObj[columnName as keyof typeof returnObj] = params[columnName as keyof typeof params]

            if (columnMetadata?.enumValues) {
              const paramValue = params[columnName as keyof typeof params]

              if (columnMetadata.isArray) {
                if (!Array.isArray(paramValue))
                  returnObj[columnName as keyof typeof returnObj] = ['expected an array of enum values']

                returnObj[columnName as keyof typeof returnObj] = (paramValue as string[]).map(p => {
                  return new this(params).cast(
                    columnName.toString(),
                    p,

                    // casting to allow enum handling at lower level
                    'string',

                    {
                      allowNull: columnMetadata.allowNull,
                      enum: columnMetadata.enumValues as readonly string[],
                    },
                  )
                })
              } else {
                returnObj[columnName as keyof typeof returnObj] = this.cast(
                  params,
                  columnName.toString(),

                  // casting to allow enum handling at lower level
                  'string',

                  {
                    allowNull: columnMetadata.allowNull,
                    enum: columnMetadata.enumValues as readonly string[],
                  },
                )
              }
            }
        }
      } catch (err) {
        if (err instanceof ParamValidationError) {
          errors[err.paramName] = err.errorMessages
        } else {
          throw err
        }
      }
    }

    if (Object.keys(errors).length) {
      throw new ParamValidationErrors(errors)
    }

    return returnObj as ReturnPayload
  }

  public static restrict<T extends typeof Params>(
    this: T,
    params: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    allowed: string[],
  ) {
    if (params === null || params === undefined) return {}
    if (Array.isArray(params)) return {}
    if (typeof params !== 'object') return {}
    return new this(params).restrict(allowed)
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
    ExpectedType extends PsychicParamsPrimitiveLiteral | RegExp | OpenapiSchemaBody,
    ValidatedType extends ValidatedReturnType<ExpectedType, OptsType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    FinalReturnType extends AllowNullOrUndefined extends true
      ? ValidatedType | null | undefined
      : ValidatedType,
  >(_params: object, paramName: string, expectedType: ExpectedType, opts?: OptsType): FinalReturnType {
    const params = _params as Record<string, PsychicParamsPrimitive>
    let param = params[paramName]
    if (param === undefined && isArrayParamName(expectedType)) {
      param = params[alternateParamName(paramName)]
    }

    return new this(params).cast(
      paramName,
      typeof param === 'string' ? param.trim() : param,
      expectedType,
      opts,
    ) as FinalReturnType
  }

  public static casing<T extends typeof Params>(this: T, params: object, casing: 'snake' | 'camel') {
    return new this(params).casing(casing)
  }

  private _casing: 'snake' | 'camel' | null = null
  constructor(private $params: object) {}

  public casing(casing: 'snake' | 'camel') {
    this._casing = casing
    return this
  }

  public cast<
    EnumType extends readonly string[],
    OptsType extends ParamsCastOptions<EnumType>,
    ExpectedType extends PsychicParamsPrimitiveLiteral | RegExp | OpenapiSchemaBody,
    ValidatedType extends ValidatedReturnType<ExpectedType, OptsType>,
    AllowNullOrUndefined extends ValidatedAllowsNull<ExpectedType, OptsType>,
    ReturnType extends AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType,
  >(
    paramName: string,
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    expectedType: ExpectedType,
    opts?: OptsType,
  ): AllowNullOrUndefined extends true ? ValidatedType | null | undefined : ValidatedType {
    if (expectedType instanceof RegExp) {
      return this.matchRegexOrThrow(paramName, paramValue as string, expectedType) as ReturnType
    }

    if (paramValue === null || paramValue === undefined) {
      if (expectedType === 'null') return null as ReturnType
      if (!this.shouldUseOpenapiValidation(expectedType)) {
        this.throwUnlessAllowNull(
          paramName,
          paramValue,
          typeToError(expectedType as PsychicParamsPrimitiveLiteral),
          opts,
        )
      }

      return paramValue as ReturnType
    }

    let dateClass: typeof DateTime | typeof CalendarDate
    const integerRegexp = /^-?\d+$/
    switch (expectedType) {
      case 'string':
        if (typeof paramValue !== 'string')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])

        if (opts?.enum && !opts.enum.includes(paramValue))
          throw new ParamValidationError(paramName, ['did not match expected enum values'])
        if (opts?.match) return this.matchRegexOrThrow(paramName, paramValue, opts.match) as ReturnType
        return paramValue as ReturnType

      case 'bigint':
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        if (!integerRegexp.test(paramValue?.toString()))
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        return paramValue.toString() as ReturnType

      case 'boolean':
        if ([true, 'true', 1, '1'].includes(paramValue as string)) return true as ReturnType
        if ([false, 'false', 0, '0'].includes(paramValue as string)) return false as ReturnType
        throw new ParamValidationError(paramName, [typeToError(expectedType)])

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

        if (paramValue instanceof DateTime || paramValue instanceof CalendarDate)
          return paramValue as ReturnType

        if (typeof paramValue === 'string') {
          try {
            return dateClass.fromISO(paramValue, { zone: 'UTC' }) as ReturnType
          } catch {
            throw new ParamValidationError(paramName, [typeToError(expectedType)])
          }
        }

        throw new ParamValidationError(paramName, [typeToError(expectedType)])

      case 'integer':
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        if (!integerRegexp.test(paramValue?.toString()))
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        return parseInt(paramValue as string, 10) as ReturnType

      case 'json':
        if (typeof paramValue !== 'object')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        return paramValue as ReturnType

      case 'number':
        if (typeof paramValue === 'number') return paramValue as ReturnType
        if (typeof paramValue === 'string') {
          if (paramValue.length === 0 || Number.isNaN(Number(paramValue)))
            throw new ParamValidationError(paramName, [typeToError(expectedType)])
          return Number(paramValue) as ReturnType
        }
        throw new ParamValidationError(paramName, [typeToError(expectedType)])

      case 'null':
        if (paramValue !== null) throw new ParamValidationError(paramName, [typeToError(expectedType)])
        return null as ReturnType

      case 'uuid':
        if (isUuid(paramValue)) return paramValue as ReturnType
        throw new ParamValidationError(paramName, [typeToError(expectedType)])

      case 'bigint[]':
      case 'boolean[]':
      case 'datetime[]':
      case 'date[]':
      case 'integer[]':
      case 'json[]':
      case 'number[]':
      case 'string[]':
      case 'uuid[]':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!Array.isArray(paramValue)) paramValue = [paramValue as any]

        return compact(
          paramValue.map(param =>
            this.cast(paramName, param, arrayTypeToNonArrayType(expectedType), { ...opts, allowNull: true }),
          ),
        ) as ReturnType

      case 'null[]':
        if (!Array.isArray(paramValue)) throw new ParamValidationError(paramName, [typeToError(expectedType)])
        return paramValue.map(param =>
          this.cast(paramName, param, arrayTypeToNonArrayType(expectedType), { ...opts, allowNull: true }),
        ) as ReturnType

      default:
        if (this.shouldUseOpenapiValidation(expectedType)) {
          const res = validateObject(paramValue, expectedType, { coerceTypes: true })
          if (res.isValid) {
            return res.data as ReturnType
          } else {
            throw new ParamValidationError(
              paramName,
              res.errors?.map(err => err.message) || ['openapi validation failed'],
            )
          }
        }

        // TODO: serialize/sanitize before printing, handle array types
        throw new Error(
          `Unexpected point reached in code. need to handle type for ${expectedType as unknown as string}`,
        )
    }
  }

  private shouldUseOpenapiValidation<
    ExpectedType extends PsychicParamsPrimitiveLiteral | RegExp | OpenapiSchemaBody,
  >(expectedType: ExpectedType): boolean {
    return isObject(expectedType)
  }

  public restrict(allowed: string[]) {
    const params = this.$params
    const permitted: PsychicParamsDictionary = {}
    if (params === null || params === undefined) return permitted

    if (!isObject(params))
      throw new Error(`Params.restrict expects object or null, received: ${JSON.stringify(params)}`)

    const objectParam = params as PsychicParamsDictionary
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

  private matchRegexOrThrow(paramName: string, paramValue: string, expectedType: RegExp): string {
    if (typeof paramValue !== 'string') throw new ParamValidationError(paramName, [typeToError(expectedType)])
    if (paramValue.length > 1000) throw new Error('We do not accept strings over 1000 chars')
    if (expectedType.test(paramValue)) return paramValue
    throw new ParamValidationError(paramName, [typeToError(expectedType)])
  }

  private throwUnlessAllowNull(
    paramName: string,
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    message: string,
    { allowNull = false }: ParamsCastOptions<readonly string[]> = {},
  ) {
    const isNullOrUndefined = [null, undefined].includes(paramValue as null | undefined)
    if (allowNull && isNullOrUndefined) return
    throw new ParamValidationError(paramName, [message])
  }
}

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
                                        : OpenapiShapeToInterface<ExpectedType, 0>

type OpenapiShapeToInterface<T, Depth extends number> = Depth extends 30
  ? never
  : T extends OpenapiSchemaObjectBase
    ? {
        -readonly [K in keyof T['properties']]: OpenapiShapeToInterface<T['properties'][K], Inc<Depth>>
      }
    : T extends OpenapiSchemaArray
      ? T['items'] extends { oneOf: infer R extends readonly [unknown, ...unknown[]] }
        ? TransformOneOfToArrayUnion<R, Inc<Depth>>
        : OpenapiShapeToInterface<T['items'], Inc<Depth>>[]
      : T extends { anyOf: infer R extends unknown[] }
        ? OpenapiShapeToInterface<R[number], Inc<Depth>>
        : T extends { oneOf: infer R extends [unknown, ...unknown[]] }
          ? OpenapiShapeToInterface<R[number], Inc<Depth>>
          : T extends { allOf: infer R extends readonly unknown[] }
            ? MergeAllOfSchemas<R, Inc<Depth>>
            : T extends OpenapiSchemaString
              ? string
              : T extends OpenapiSchemaNumber
                ? number
                : T extends OpenapiSchemaInteger
                  ? number
                  : T extends OpenapiSchemaPrimitiveGeneric
                    ? OpenapiGenericToType<T['type']>
                    : never

type TransformOneOfToArrayUnion<T extends readonly unknown[], Depth extends number> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? OpenapiShapeToInterface<First, Depth>[] | TransformOneOfToArrayUnion<Rest, Depth>
  : never

type MergeAllOfSchemas<T extends readonly unknown[], Depth extends number> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? Rest extends readonly unknown[]
    ? Rest['length'] extends 0
      ? OpenapiShapeToInterface<First, Depth>
      : OpenapiShapeToInterface<First, Depth> & MergeAllOfSchemas<Rest, Depth>
    : OpenapiShapeToInterface<First, Depth>
  : never

type OpenapiGenericToType<T> = T extends 'string'
  ? string
  : T extends 'boolean'
    ? boolean
    : T extends 'number'
      ? number
      : T extends 'integer'
        ? number
        : T extends 'date-time'
          ? DateTime
          : T extends 'date'
            ? CalendarDate
            : T extends 'null'
              ? null
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

export interface OpenAPIDreamModelRequestBodyModifications<OnlyArray, IncludingArray>
  extends ParamsForOpts<OnlyArray> {
  combining?: OpenapiSchemaPropertiesShorthand
  including?: IncludingArray
}

const typeToErrorMap: Record<PsychicParamsPrimitiveLiteral, string> = {
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

function typeToError(param: PsychicParamsPrimitiveLiteral | RegExp) {
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
): PsychicParamsPrimitiveLiteral {
  return arrayTypeToNonArrayTypeMap[param]
}
