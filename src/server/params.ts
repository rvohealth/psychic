import { CalendarDate, ClockTime, ClockTimeTz, DateTime, Dream, DreamApp } from '@rvoh/dream'
import {
  OpenapiSchemaArray,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaInteger,
  OpenapiSchemaNumber,
  OpenapiSchemaObjectBase,
  OpenapiSchemaPrimitiveGeneric,
  OpenapiSchemaPropertiesShorthand,
  OpenapiSchemaString,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import {
  DreamAttributes,
  DreamParamSafeAttributes,
  DreamParamSafeColumnNames,
  StrictInterface,
} from '@rvoh/dream/types'
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
import {
  declaredJSONColumnShape,
  type VirtualAttributeStatement,
} from '../openapi-renderer/helpers/dreamColumnOpenapiShape.js'
import paramNamesForDreamClass from './helpers/paramNamesForDreamClass.js'

export type ExtractedDreamParamSafeAttributes<
  ParamSafeAttrs,
  ParamNames extends keyof ParamSafeAttrs,
> = Partial<{
  [K in ParamNames]: Exclude<ParamSafeAttrs[K], undefined>
}>

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
   *
   * With `array: true`, `params` must be an array of objects and an array is
   * returned. Anything else, including `null`, `undefined`, and an array
   * containing `null`, a primitive, or an array, raises
   * `ParamValidationErrors`, which the router answers with a 400. A single
   * value is never wrapped into an array. (`paramsFor` and `extractParams`
   * read a missing or null `key` as `[]` before calling this.)
   *
   * Likewise, a bare value given for an array column or an array-typed
   * `@deco.Virtual`/`@deco.Encrypted` attribute is rejected, never wrapped.
   *
   * A value for a column or attribute whose shape the model declares
   * (`@deco.JSON`, `@deco.Virtual`, `@deco.Encrypted`) must match that
   * declaration, whatever the endpoint's OpenAPI says and whether or not
   * request validation is on. A `@deco.JSON` value, and a
   * `@deco.Virtual`/`@deco.Encrypted` value whose shape is an object, an array
   * of objects or a composition, is checked as submitted with Dream's check,
   * the same one every save runs, and is returned as submitted. A primitive
   * `@deco.Virtual`/`@deco.Encrypted` shape (or an array of primitives) is cast
   * as any column's is and then checked only against the declared enum; its
   * other constraints (`maxLength`, `pattern`, `minimum` and the like) are not
   * checked here. A shorthand is cast the same whether it is declared as a
   * string or as an object's `type`: `'date'` and `{ type: 'date' }` both
   * return a `CalendarDate`, and `'decimal'` and `{ type: 'decimal' }` both
   * accept `'5.5'`. A `@deco.JSON` column, or an `@deco.Encrypted` attribute,
   * accepts `null` when its column allows null (or its shape does). A
   * `@deco.JSON` column never accepts a string (nor a string element of a
   * json[]/jsonb[] column), which Dream would store as raw JSON text.
   */
  public static for<
    T extends typeof Dream,
    I extends InstanceType<T>,
    const OnlyArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
    ForOpts extends StrictInterface<ForOpts, ParamsForOpts<OnlyArray>>,
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
      ? ExtractedDreamParamSafeAttributes<ParamSafeAttrs, ForOpts['only'][number] & keyof ParamSafeAttrs>
      : ExtractedDreamParamSafeAttributes<
          ParamSafeAttrs,
          ParamSafeColumns[number & keyof ParamSafeColumns] & string & keyof ParamSafeAttrs
        >,
    ReturnPayload extends ForOpts['array'] extends true ? ReturnPartialType[] : ReturnPartialType,
  >(params: object, dreamClass: T, forOpts: ForOpts = {} as ForOpts): ReturnPayload {
    const { array = false } = forOpts

    if (!dreamClass?.isDream) throw new Error(`Params.for must receive a dream class as it's second argument`)
    if (array) {
      // A value that is not an array of objects (a single object, a string,
      // an object with numeric keys, an element that is null, a primitive or
      // an array) is a client error. A single value is never wrapped into an
      // array: single-value query arrays are conformed to arrays upstream in
      // conformQueryArrayParamsToOpenapiShape, so this is not the place to
      // coerce.
      if (!Array.isArray(params) || !params.every(isObject))
        throw new ParamValidationErrors({
          [forOpts.key || 'params']: ['expected an array of objects'],
        })

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
      const paramValue = params[columnName as keyof typeof params] as
        | PsychicParamsPrimitive
        | PsychicParamsDictionary
        | PsychicParamsDictionary[]
        | undefined
      if (paramValue === undefined) continue

      const columnMetadata = columns[columnName as keyof typeof columns] as {
        dbType: string
        allowNull: boolean
        isArray: boolean
        enumValues: unknown[] | null
      }

      try {
        const castType = DB_TYPE_TO_CAST_TYPE[columnMetadata?.dbType]

        if (columnMetadata && declaredJSONColumnShape(dreamClass, columnName) !== undefined) {
          // the `@deco.JSON` declaration (with the column's nullability and,
          // for an array column, applied to each element) stands in for the
          // object-only json cast, so a scalar or array the declaration
          // allows passes. A string never does, whatever the declaration
          // says: Dream stores it as raw JSON text rather than as a JSON
          // string (and refuses a declaration that admits one at boot).
          throwIfStringForJSONColumn(columnName, paramValue, columnMetadata.isArray)
          returnObj[columnName as keyof typeof returnObj] = validateAgainstDeclaredShape(
            dreamClass,
            columnName,
            paramValue,
          ) as never
        } else if (castType) {
          throwIfBareValueForArrayCast(columnName, paramValue, castType)
          returnObj[columnName as keyof typeof returnObj] = this.cast(
            params,
            columnName.toString(),
            castType,
            { allowNull: columnMetadata.allowNull },
          )
        } else if (dreamClass.isVirtualColumn(columnName)) {
          returnObj[columnName as keyof typeof returnObj] = this.castVirtualAttribute(
            params,
            dreamClass,
            columnName,
            paramValue,
          ) as never
        } else if (columnMetadata?.enumValues) {
          if (columnMetadata.isArray && paramValue === null && columnMetadata.allowNull) {
            // A nullable enum[] column is rendered `['array', 'null']` in
            // OpenAPI, so `null` clears it, as it does for every other
            // nullable column.
            returnObj[columnName as keyof typeof returnObj] = null
          } else if (columnMetadata.isArray) {
            // Any other non-array is a real error rather than something to
            // coerce: single-value query arrays are conformed to arrays
            // upstream in conformQueryArrayParamsToOpenapiShape, and `null`
            // is accepted above only when the column allows null.
            if (!Array.isArray(paramValue))
              throw new ParamValidationError(columnName.toString(), ['expected an array of enum values'])

            returnObj[columnName as keyof typeof returnObj] = (paramValue as string[]).map(p => {
              // An element is never nullable (the OpenAPI items schema is a
              // non-nullable enum), whether or not the column allows null.
              return new this(params).cast(columnName.toString(), p, 'string', {
                allowNull: false,
                enum: columnMetadata.enumValues as readonly string[],
              })
            })
          } else {
            returnObj[columnName as keyof typeof returnObj] = this.cast(
              params,
              columnName.toString(),
              'string',
              {
                allowNull: columnMetadata.allowNull,
                enum: columnMetadata.enumValues as readonly string[],
              },
            )
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

  /**
   * Casts and checks a `@deco.Virtual`/`@deco.Encrypted` attribute against its
   * declared shape. A primitive (or an array of primitives) is cast as today,
   * so `'true'` and `"5"` arriving from a query string still pass, and is then
   * checked against the declared enum; any other shape (an object, an array of
   * objects, a composition) is validated as submitted, without coercion. The
   * cast is read from the declaration as Dream expands it, so a shorthand
   * declared in object form (`{ type: 'date' }`) is cast as its string form
   * (`'date'`) is. An
   * `@deco.Encrypted` attribute whose backing column allows null accepts
   * `null`, as Dream's shape for it does.
   */
  private static castVirtualAttribute(
    params: object,
    dreamClass: typeof Dream,
    columnName: string,
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
  ): unknown {
    const declaredShape = (dreamClass['virtualAttributes'] as VirtualAttributeStatement[]).find(
      statement => statement.property === columnName,
    )?.type

    if (!declaredShape) throw new Error(`Unable to infer params cast type for virtual column: ${columnName}`)

    // cast from the declaration as Dream expands it, so a shorthand declared
    // in object form (`{ type: 'decimal' }`) is cast as its string form
    // (`'decimal'`) is
    const primitiveCast =
      primitiveCastFromOpenapi(DreamApp.system.expandOpenapiShorthand(declaredShape)) ??
      castOfNonShorthandDeclaration(declaredShape)
    if (!primitiveCast) return validateAgainstDeclaredShape(dreamClass, columnName, paramValue)

    throwIfBareValueForArrayCast(columnName, paramValue, primitiveCast.expectedType)

    // the declared shape as Dream checks it and Psychic renders it: for an
    // `@deco.Encrypted` attribute, with `null` added when its backing column
    // allows null. `null` passes when the declaration's own type admits it, as
    // before, or when that shape accepts it
    const declaredSchema = DreamApp.system.declaredShapeSchema(dreamClass, columnName)!

    const castValue: unknown = this.cast(params, columnName, primitiveCast.expectedType, {
      allowNull: primitiveCast.allowNull || DreamApp.system.openapiSchemaAcceptsNull(declaredSchema),
    })

    const allowedValues = declaredEnumValues(declaredSchema)
    if (allowedValues && castValue !== null && castValue !== undefined) {
      // A date or date-time is checked as the JSON string it arrives as, as
      // the OpenAPI enum checks it: the cast hydrates it into a CalendarDate
      // or DateTime, which never equals a string. Every other primitive is
      // checked after the cast, so a query-string number or boolean still
      // matches a numeric or boolean enum.
      const comparedValue = HYDRATED_DATE_CAST_TYPES.includes(primitiveCast.expectedType)
        ? jsonPrimitiveForEnumCheck(paramValue)
        : castValue
      const comparedValues = (Array.isArray(comparedValue) ? comparedValue : [comparedValue]).filter(
        value => value !== null && value !== undefined,
      )
      if (!comparedValues.every(value => allowedValues.includes(value)))
        throw new ParamValidationError(columnName, ['did not match expected enum values'])
    }

    return castValue
  }

  /**
   * ### .extract
   *
   * Typed + runtime-enforced allowlist extraction. Equivalent to
   * {@link Params.for} with `only` moved to a required positional argument.
   * Use from a controller via {@link PsychicController.extractParams}.
   *
   * The `allowed` array is constrained to `DreamParamSafeColumnNames<I>` at
   * the type level, so protected columns (primary key, timestamps, belongs-to
   * foreign keys, polymorphic type fields, STI `type` column, and any column
   * in `explicitUnsafeParamColumns`) are TypeScript compile errors. At
   * runtime, the existing intersection in `paramNamesForDreamClass` strips
   * any column not also in the model's `paramSafeColumnsOrFallback()` set,
   * so TS-bypass attempts still fail closed.
   */
  public static extract<
    T extends typeof Dream,
    I extends InstanceType<T>,
    const AllowedArray extends readonly (keyof DreamParamSafeAttributes<I>)[],
    OptsType extends StrictInterface<OptsType, ExtractParamsOpts>,
    ParamSafeAttrs extends DreamParamSafeAttributes<I>,
    ReturnPartial extends ExtractedDreamParamSafeAttributes<
      ParamSafeAttrs,
      AllowedArray[number] & keyof ParamSafeAttrs
    >,
    ReturnPayload extends OptsType['array'] extends true ? ReturnPartial[] : ReturnPartial,
  >(params: object, dreamClass: T, allowed: AllowedArray, opts?: OptsType): ReturnPayload {
    const forOpts = { ...(opts ?? {}), only: allowed }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Params.for(params, dreamClass, forOpts as any) as unknown as ReturnPayload
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
    OptsType extends StrictInterface<OptsType, ParamsCastOptions<EnumType>>,
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
    OptsType extends StrictInterface<OptsType, ParamsCastOptions<EnumType>>,
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
    if (typeof paramValue === 'string') paramValue = paramValue.trim()

    if (expectedType instanceof RegExp) {
      if (paramValue === null || paramValue === undefined) {
        this.throwUnlessAllowNull(paramName, paramValue, typeToError(expectedType), opts)
        return paramValue as ReturnType
      }

      return this.matchRegexOrThrow(paramName, paramValue as string, expectedType) as ReturnType
    }

    if (paramValue === null || paramValue === undefined) {
      if (expectedType === 'null') return null as ReturnType
      if (this.shouldUseOpenapiValidation(expectedType)) {
        return this.validateOpenapiOrThrow(paramName, paramValue, expectedType) as ReturnType
      }

      this.throwUnlessAllowNull(
        paramName,
        paramValue,
        typeToError(expectedType as PsychicParamsPrimitiveLiteral),
        opts,
      )

      return paramValue as ReturnType
    }

    const integerRegexp = /^-?\d+$/
    // Plain decimal numeric string: optional sign, digits with an optional
    // fractional part (or a bare fractional part), and an optional decimal
    // exponent. Deliberately excludes hex/octal/binary literals and the
    // "Infinity"/"NaN" keywords that `Number()` would otherwise accept.
    const decimalNumberRegexp = /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/
    switch (expectedType) {
      case 'string':
        if (typeof paramValue !== 'string')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])

        this.throwUnlessWithinLength(paramName, paramValue, opts)
        if (opts?.enum && !opts.enum.includes(paramValue))
          throw new ParamValidationError(paramName, ['did not match expected enum values'])
        if (opts?.match) return this.matchRegexOrThrow(paramName, paramValue, opts.match) as ReturnType
        return paramValue as ReturnType

      case 'bigint':
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        if (!integerRegexp.test(paramValue?.toString()))
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        this.throwUnlessWithinRange(paramName, BigInt(paramValue.toString()), opts)
        return paramValue.toString() as ReturnType

      case 'boolean':
        if ([true, 'true', 1, '1'].includes(paramValue as string)) return true as ReturnType
        if ([false, 'false', 0, '0'].includes(paramValue as string)) return false as ReturnType
        throw new ParamValidationError(paramName, [typeToError(expectedType)])

      case 'datetime':
      case 'date': {
        let dateClass: typeof DateTime | typeof CalendarDate

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
      }

      case 'time':
      case 'timetz': {
        let timeClass: typeof ClockTime | typeof ClockTimeTz

        switch (expectedType) {
          case 'time':
            timeClass = ClockTime
            break
          case 'timetz':
            timeClass = ClockTimeTz
            break
          default:
            if (typeof expectedType === 'string') throw Error(`${expectedType} must be "time" or "timetz"`)
            else throw Error(`expectedType is not a string`)
        }

        if (paramValue instanceof ClockTime || paramValue instanceof ClockTimeTz)
          return paramValue as ReturnType

        if (typeof paramValue === 'string') {
          try {
            return timeClass.fromISO(paramValue) as ReturnType
          } catch {
            throw new ParamValidationError(paramName, [typeToError(expectedType)])
          }
        }

        throw new ParamValidationError(paramName, [typeToError(expectedType)])
      }

      case 'integer': {
        if (typeof paramValue !== 'string' && typeof paramValue !== 'number')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        if (!integerRegexp.test(paramValue?.toString()))
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        const integerValue = parseInt(paramValue as string, 10)
        // Reject values outside the safe-integer range: a long digit string
        // (e.g. a 40-digit number) would otherwise be silently rounded to a
        // nearby float by parseInt. Genuinely large integers should be cast as
        // `bigint`, which preserves the exact value as a string.
        if (!Number.isSafeInteger(integerValue))
          throw new ParamValidationError(paramName, [
            'expected an integer within the safe integer range (use bigint for larger values)',
          ])
        this.throwUnlessWithinRange(paramName, integerValue, opts)
        return integerValue as ReturnType
      }

      case 'json':
        if (typeof paramValue !== 'object')
          throw new ParamValidationError(paramName, [typeToError(expectedType)])
        return paramValue as ReturnType

      case 'number': {
        if (typeof paramValue === 'number') {
          if (!Number.isFinite(paramValue))
            throw new ParamValidationError(paramName, [typeToError(expectedType)])
          this.throwUnlessWithinRange(paramName, paramValue, opts)
          return paramValue as ReturnType
        }
        if (typeof paramValue === 'string') {
          // Require a plain decimal numeric string and a finite result. This
          // rejects hex/octal/binary forms ("0x10"), the literals "Infinity"/
          // "NaN", and magnitudes that overflow to Infinity ("1e999"), all of
          // which `Number()` would otherwise silently coerce.
          const numberValue = Number(paramValue)
          if (!decimalNumberRegexp.test(paramValue) || !Number.isFinite(numberValue))
            throw new ParamValidationError(paramName, [typeToError(expectedType)])
          this.throwUnlessWithinRange(paramName, numberValue, opts)
          return numberValue as ReturnType
        }
        throw new ParamValidationError(paramName, [typeToError(expectedType)])
      }

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
      case 'time[]':
      case 'timetz[]':
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
          return this.validateOpenapiOrThrow(paramName, paramValue, expectedType) as ReturnType
        }

        // TODO: serialize/sanitize before printing, handle array types
        throw new Error(
          `Unexpected point reached in code. need to handle type for ${expectedType as unknown as string}`,
        )
    }
  }

  private shouldUseOpenapiValidation<
    ExpectedType extends PsychicParamsPrimitiveLiteral | RegExp | OpenapiSchemaBody,
  >(expectedType: ExpectedType): expectedType is ExpectedType & OpenapiSchemaBody {
    return isObject(expectedType)
  }

  private validateOpenapiOrThrow(
    paramName: string,
    paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
    expectedType: OpenapiSchemaBody,
  ) {
    const res = validateObject(paramValue, expectedType, { coerceTypes: true })
    if (res.isValid) return res.data

    throw new ParamValidationError(
      paramName,
      res.errors?.map(err => err.message) || ['openapi validation failed'],
    )
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

  /**
   * Enforces `minLength`/`maxLength` (inclusive) against an already-coerced
   * string value, throwing {@link ParamValidationError} on violation. Mirrors
   * JSON-schema / OpenAPI string-length constraints.
   */
  private throwUnlessWithinLength(
    paramName: string,
    paramValue: string,
    opts?: ParamsCastOptions<readonly string[]>,
  ) {
    if (opts?.minLength !== undefined && paramValue.length < opts.minLength)
      throw new ParamValidationError(paramName, [
        `expected string with length no less than ${opts.minLength}`,
      ])
    if (opts?.maxLength !== undefined && paramValue.length > opts.maxLength)
      throw new ParamValidationError(paramName, [
        `expected string with length no greater than ${opts.maxLength}`,
      ])
  }

  /**
   * Enforces `minimum`/`maximum` (inclusive) against an already-coerced numeric
   * value, throwing {@link ParamValidationError} on violation. Accepts a
   * `bigint` so `bigint` casts are checked without precision loss; the bounds
   * themselves are compared as `bigint` when they are integers and otherwise
   * fall back to floating-point comparison. Mirrors JSON-schema / OpenAPI
   * numeric-range constraints.
   */
  private throwUnlessWithinRange(
    paramName: string,
    paramValue: number | bigint,
    opts?: ParamsCastOptions<readonly string[]>,
  ) {
    if (opts?.minimum !== undefined && this.isBelowNumericBound(paramValue, opts.minimum))
      throw new ParamValidationError(paramName, [`expected a value no less than ${opts.minimum}`])
    if (opts?.maximum !== undefined && this.isAboveNumericBound(paramValue, opts.maximum))
      throw new ParamValidationError(paramName, [`expected a value no greater than ${opts.maximum}`])
  }

  private isBelowNumericBound(value: number | bigint, bound: number): boolean {
    if (typeof value === 'bigint')
      return Number.isInteger(bound) ? value < BigInt(bound) : Number(value) < bound
    return value < bound
  }

  private isAboveNumericBound(value: number | bigint, bound: number): boolean {
    if (typeof value === 'bigint')
      return Number.isInteger(bound) ? value > BigInt(bound) : Number(value) > bound
    return value > bound
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
          : ExpectedType extends 'time'
            ? ClockTime
            : ExpectedType extends 'timetz'
              ? ClockTimeTz
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
                              : ExpectedType extends 'time[]'
                                ? ClockTime[]
                                : ExpectedType extends 'timetz[]'
                                  ? ClockTimeTz[]
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

  /**
   * Maximum permitted string length (inclusive). Enforced after coercion for
   * `string` casts (and element-wise for `string[]`). Mirrors JSON-schema /
   * OpenAPI `maxLength`.
   */
  maxLength?: number

  /**
   * Minimum permitted string length (inclusive). Enforced after coercion for
   * `string` casts (and element-wise for `string[]`). Mirrors JSON-schema /
   * OpenAPI `minLength`.
   */
  minLength?: number

  /**
   * Minimum permitted numeric value (inclusive). Enforced after coercion for
   * `number`/`integer`/`bigint` casts (and element-wise for their array
   * variants). Mirrors JSON-schema / OpenAPI `minimum`.
   */
  minimum?: number

  /**
   * Maximum permitted numeric value (inclusive). Enforced after coercion for
   * `number`/`integer`/`bigint` casts (and element-wise for their array
   * variants). Mirrors JSON-schema / OpenAPI `maximum`.
   */
  maximum?: number
}

interface ParamsForOptsBase<OnlyArray> {
  array?: boolean
  only?: OnlyArray
}

export interface ParamsForOpts<OnlyArray> extends ParamsForOptsBase<OnlyArray> {
  key?: string
}

/**
 * Options for {@link Params.extract} and the corresponding controller method.
 * Mirrors {@link ParamsForOpts} minus `only` — the explicit allowlist moved
 * to a required positional argument on `extractParams`.
 */
export interface ExtractParamsOpts {
  array?: boolean
  key?: string
}

export interface OpenAPIDreamModelRequestBodyModifications<OnlyArray, IncludingArray>
  extends ParamsForOptsBase<OnlyArray> {
  params?: OnlyArray
  combining?: OpenapiSchemaPropertiesShorthand
  including?: IncludingArray
}

/**
 * Maps PostgreSQL database column types to Psychic cast types.
 * Used by Params.for() to determine how to validate and cast each column value.
 */
const DB_TYPE_TO_CAST_TYPE: Record<string, PsychicParamsPrimitiveLiteral> = {
  // identity mappings (db type matches cast type)
  bigint: 'bigint',
  'bigint[]': 'bigint[]',
  boolean: 'boolean',
  'boolean[]': 'boolean[]',
  date: 'date',
  'date[]': 'date[]',
  integer: 'integer',
  'integer[]': 'integer[]',
  uuid: 'uuid',
  'uuid[]': 'uuid[]',
  json: 'json',
  'json[]': 'json[]',

  // text variants → string
  'character varying': 'string',
  citext: 'string',
  text: 'string',
  'character varying[]': 'string[]',
  'citext[]': 'string[]',
  'text[]': 'string[]',

  // timestamp variants → datetime
  timestamp: 'datetime',
  'timestamp with time zone': 'datetime',
  'timestamp without time zone': 'datetime',
  'timestamp[]': 'datetime[]',
  'timestamp with time zone[]': 'datetime[]',
  'timestamp without time zone[]': 'datetime[]',

  // time variants
  time: 'time',
  'time without time zone': 'time',
  'time[]': 'time[]',
  'time without time zone[]': 'time[]',
  timetz: 'timetz',
  'time with time zone': 'timetz',
  'timetz[]': 'timetz[]',
  'time with time zone[]': 'timetz[]',

  // jsonb → json
  jsonb: 'json',
  'jsonb[]': 'json[]',

  // numeric → number
  numeric: 'number',
  'numeric[]': 'number[]',
}

/**
 * Validates a value against the shape the model declares for a column or
 * attribute, with Dream's declared-shape check (no coercion and no defaults:
 * the value must already match, and is validated and returned exactly as
 * submitted), returning the value as submitted, or throwing the
 * `ParamValidationError` the router answers with a 400.
 */
function validateAgainstDeclaredShape(
  dreamClass: typeof Dream,
  columnName: string,
  paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
): unknown {
  const check = DreamApp.system.validateDeclaredShape(dreamClass, columnName, paramValue)
  if (check.isValid) return paramValue

  throw new ParamValidationError(
    columnName,
    check.errors.map(error =>
      error.instancePath ? `${error.instancePath} ${error.message}` : (error.message ?? 'is invalid'),
    ),
  )
}

/**
 * A string for a `@deco.JSON` column (or, for a json[]/jsonb[] column, as an
 * element) is a client error: Dream's json setter takes a string as
 * already-encoded JSON text, so `'{"admin":true}'` would be stored as an object
 * the declared shape never saw, and any other string fails at INSERT. Dream
 * refuses a declaration that admits a string at boot; this keeps a value from
 * reaching the setter as text even when a declaration gets past that.
 */
function throwIfStringForJSONColumn(
  columnName: string,
  paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
  isArrayColumn: boolean,
) {
  const message = 'must not be a string (send the JSON value itself, not JSON text)'
  if (typeof paramValue === 'string') throw new ParamValidationError(columnName, [message])
  if (!isArrayColumn || !Array.isArray(paramValue)) return

  const stringIndex = (paramValue as unknown[]).findIndex(element => typeof element === 'string')
  if (stringIndex !== -1) throw new ParamValidationError(columnName, [`/${stringIndex} ${message}`])
}

/**
 * The enum a declared primitive (or each element of a declared array of
 * primitives) is limited to, if it declares one.
 */
function declaredEnumValues(schema: OpenapiSchemaBody): readonly unknown[] | null {
  const schemaRecord = schema as { enum?: unknown; items?: { enum?: unknown } }
  if (Array.isArray(schemaRecord.enum)) return schemaRecord.enum as unknown[]
  if (Array.isArray(schemaRecord.items?.enum)) return schemaRecord.items.enum as unknown[]
  return null
}

const HYDRATED_DATE_CAST_TYPES: PsychicParamsPrimitiveLiteral[] = ['date', 'date[]', 'datetime', 'datetime[]']

/**
 * A submitted date or date-time (or array of them) as the JSON primitive an
 * enum lists: a string trimmed as the cast trims it, or the JSON form of a
 * CalendarDate or DateTime passed in directly.
 */
function jsonPrimitiveForEnumCheck(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(jsonPrimitiveForEnumCheck)
  if (typeof value === 'string') return value.trim()
  if (value instanceof CalendarDate || value instanceof DateTime) return value.toJSON()
  return value
}

/**
 * `Params.for` never wraps a bare value into an array: a request body can tell
 * a single value from a one-element array, and single-value query arrays are
 * conformed to arrays upstream (`conformQueryArrayParamsToOpenapiShape`), so a
 * bare value here is a client error. `null` is left to the cast, which accepts
 * it only when the column or attribute allows null. (`Params.cast` and
 * `castParam`, which name an array type explicitly, still wrap.)
 */
function throwIfBareValueForArrayCast(
  columnName: string,
  paramValue: PsychicParamsPrimitive | PsychicParamsDictionary | PsychicParamsDictionary[],
  castType: PsychicParamsPrimitiveLiteral,
) {
  if (!castType.endsWith('[]')) return
  if (paramValue === null || Array.isArray(paramValue)) return
  throw new ParamValidationError(columnName, [typeToError(castType)])
}

/**
 * The cast for a declared primitive (or array of primitives), or `null` for
 * any other shape (an object, an array of objects, a composition), which
 * `Params.for` validates against the declaration instead. Takes the expanded
 * declaration (`DreamApp.system.expandOpenapiShorthand`), so a shorthand
 * written as a string (`'decimal'`) or as an object's `type`
 * (`{ type: 'decimal' }`) is read from the same schema.
 */
function primitiveCastFromOpenapi(
  openapi: OpenapiSchemaBody,
): { expectedType: PsychicParamsPrimitiveLiteral; allowNull: boolean } | null {
  if (!('type' in openapi)) return null

  const openapiType = openapi.type
  const allowNull = Array.isArray(openapiType) && openapiType.includes('null')
  const nonNullType = Array.isArray(openapiType) ? openapiType.find(type => type !== 'null') : openapiType

  if (nonNullType === 'array') {
    if (!('items' in openapi)) return null
    const item = openapi.items
    const itemType = item && 'type' in item ? item.type : undefined
    const itemFormat = item && 'format' in item ? item.format : undefined
    if (Array.isArray(itemType)) return null
    const itemCastType = openapiTypeToCastType(itemType, itemFormat)
    if (!itemCastType) return null
    return { expectedType: `${itemCastType}[]` as PsychicParamsPrimitiveLiteral, allowNull }
  }

  const expectedType = openapiTypeToCastType(nonNullType, 'format' in openapi ? openapi.format : undefined)
  return expectedType ? { expectedType, allowNull } : null
}

/**
 * The cast for a declaration naming a cast type that is not a Dream shorthand
 * (`'bigint'`, `'uuid'`, `'time'`, `'datetime'`, alone or with `'null'`),
 * which only an untyped declaration can name. Dream expands such a string to
 * `{ type: 'object' }`, which accepts any object, so it is cast as it always
 * has been, which refuses an object.
 */
function castOfNonShorthandDeclaration(
  declaration: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand,
): { expectedType: PsychicParamsPrimitiveLiteral; allowNull: boolean } | null {
  if (Array.isArray(declaration)) {
    const nonNullDeclaration = declaration.find(type => type !== 'null')
    const cast = castOfNonShorthandDeclaration(
      nonNullDeclaration as OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand,
    )
    return cast ? { ...cast, allowNull: true } : null
  }

  return typeof declaration === 'string' && NON_SHORTHAND_CAST_TYPES.includes(declaration)
    ? { expectedType: declaration as PsychicParamsPrimitiveLiteral, allowNull: false }
    : null
}

function openapiTypeToCastType(
  openapiType: string | undefined,
  format: string | undefined,
): PsychicParamsPrimitiveLiteral | null {
  switch (openapiType) {
    case 'boolean':
      return 'boolean'
    case 'integer':
      return 'integer'
    case 'number':
      return 'number'
    case 'null':
      return 'null'
    case 'string':
      switch (format) {
        case 'date':
          return 'date'
        case 'date-time':
          return 'datetime'
        case 'uuid':
          return 'uuid'
        default:
          return 'string'
      }
    default:
      return null
  }
}

// the cast types a declaration can name that are not Dream shorthands; every
// Dream shorthand is cast from its expansion
const NON_SHORTHAND_CAST_TYPES: string[] = [
  'bigint',
  'bigint[]',
  'datetime',
  'datetime[]',
  'null[]',
  'time',
  'time[]',
  'timetz',
  'timetz[]',
  'uuid',
  'uuid[]',
] satisfies PsychicParamsPrimitiveLiteral[]

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
  time: 'expected ISO time string',
  timetz: 'expected ISO timetz string',
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
  'time[]': 'expected ISO time string array',
  'timetz[]': 'expected ISO timetz string array',
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
  'time[]': 'time',
  'timetz[]': 'timetz',
  'uuid[]': 'uuid',
} as const

function arrayTypeToNonArrayType(
  param: keyof typeof arrayTypeToNonArrayTypeMap,
): PsychicParamsPrimitiveLiteral {
  return arrayTypeToNonArrayTypeMap[param]
}
