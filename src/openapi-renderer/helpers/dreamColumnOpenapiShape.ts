import { Dream, DreamApp } from '@rvoh/dream'
import {
  OpenapiDescription,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaString,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import { DbTypes } from '@rvoh/dream/types'
import SerializerOpenapiShapeOnJSONColumn from '../../error/openapi/SerializerOpenapiShapeOnJSONColumn.js'
import { SerializingPlainPropertyWithoutOpenapiShape } from '../../error/openapi/SerializingPlainPropertyWithoutOpenapiShape.js'
import UnrecognizedDbTypeFoundWhileComputingOpenapiAttribute from '../../error/openapi/UnrecognizedDbTypeFoundWhileComputingOpenapiAttribute.js'
import isObject from '../../helpers/isObject.js'
import OpenapiEnumCollector from './OpenapiEnumCollector.js'

/**
 * @internal
 *
 * The shape `@deco.JSON` declares for a json/jsonb column (for a json[]/jsonb[]
 * column, the shape of each element), as Dream reports it, or `undefined` when
 * the column has no `@deco.JSON` declaration.
 */
export function declaredJSONColumnShape(
  dreamClass: typeof Dream,
  column: string,
): OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined {
  const declaration = DreamApp.system.modelDeclaredShape(dreamClass, column)
  return declaration?.decorator === '@deco.JSON' ? declaration.shape : undefined
}

interface DreamColumnInfo {
  enumValues: string[] | null
  dbType: DbTypes
  allowNull: boolean
  isArray: boolean
}

type DreamClassColumnNames<
  DreamClass extends typeof Dream,
  DreamInstance extends InstanceType<DreamClass> = InstanceType<DreamClass>,
  DB = DreamInstance['DB'],
  TableName extends keyof DB = DreamInstance['table'] & keyof DB,
  Table extends DB[keyof DB] = DB[TableName],
> = keyof Table & string

export function dreamColumnOpenapiShape<DreamClass extends typeof Dream>(
  // this is the global name of the serializer or controller calling down
  // to get this information. If an unrecognized db type is provided, the
  // source will be rendered in the exception that is returned, enabling
  // the dev to identify the source of the issue and fix it
  source: string,
  dreamClass: DreamClass,
  column: DreamClassColumnNames<DreamClass>,
  openapi:
    | OpenapiDescription
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined = undefined,
  {
    suppressResponseEnums = false,
    allowGenericJson = false,
    enumCollector = undefined,
  }: {
    suppressResponseEnums?: boolean
    allowGenericJson?: boolean
    enumCollector?: OpenapiEnumCollector | undefined
  } = {},
): OpenapiSchemaBody {
  if (dreamClass.isVirtualColumn(column)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    const openapiObject = DreamApp.system.openapiShorthandToOpenapi((openapi ?? {}) as any)

    // the `@deco.Virtual` or `@deco.Encrypted` declaration, as Dream checks
    // it: an `@deco.Encrypted` attribute takes its nullability from its
    // backing column
    const declaredShape = modelDeclaredShapeSchema(dreamClass, column)

    if (declaredShape) {
      // a serializer openapi that carries a shape replaces the declared shape
      // whole, as a same-key `combining` entry replaces a request-body
      // property, so none of the declared shape's keywords (a `required`, a
      // `null`) leak into the override
      if (openapiCarriesShape(openapi)) return openapiObject

      // a description-only serializer openapi is layered over the virtual
      // attribute's declared type, as the column branches below layer it over
      // the column's shape. TypeScript spreads every pairing of the two unions
      // (a `type` beside an `anyOf`, say), so the merge is asserted to be a
      // schema, as it is in those branches
      return {
        ...declaredShape,
        ...openapiObject,
      } as OpenapiSchemaBody
    } else if (openapi) {
      return openapiObject
    } else {
      throw new SerializingPlainPropertyWithoutOpenapiShape(dreamClass, column)
    }
  }

  const dream = dreamClass.prototype

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const dreamColumnInfo: DreamColumnInfo = dream.schema[dream.table]?.columns[column]
  if (!dreamColumnInfo) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    if (openapi) return DreamApp.system.openapiShorthandToOpenapi(openapi as any)
    throw new SerializingPlainPropertyWithoutOpenapiShape(dreamClass, column)
  }

  if (declaredJSONColumnShape(dreamClass, column) !== undefined) {
    // the model's `@deco.JSON` declaration is the single source of the
    // column's shape, so a serializer may describe the column but not reshape
    // it. Dream's types refuse a shape here; this refuses one that got past
    // them, when the OpenAPI is rendered at boot
    if (openapi !== undefined && !openapiIsDescriptionOnly(openapi))
      throw new SerializerOpenapiShapeOnJSONColumn(source, dreamClass, column)

    // the declaration describes the non-null value (for an array column, each
    // element); the column itself says whether it may be null. Dream wraps the
    // declaration by its column, the schema it checks the column's value with
    const columnShape = modelDeclaredShapeSchema(dreamClass, column)!

    return { ...columnShape, ...(openapi as OpenapiDescription | undefined) } as OpenapiSchemaBody
  }

  if (!allowGenericJson) {
    switch (baseDbType(dreamColumnInfo)) {
      case 'json':
      case 'jsonb':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        if (openapi) return DreamApp.system.openapiShorthandToOpenapi(openapi as any)
        throw new UseCustomOpenapiForJson(dreamClass, column)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const openapiObject = DreamApp.system.openapiShorthandToOpenapi((openapi ?? {}) as any)

  // collect the spec-visible enum values for this column. Collection is
  // upstream of `suppressResponseEnums` (suppressed specs still collect
  // their real values) and downstream of serializer `enum:` overrides
  // (values hidden by an override are never collected). The recorded set is
  // never the rendered `null`-augmented array.
  if (dreamColumnInfo.enumValues && enumCollector) {
    enumCollector.collect(dreamColumnInfo.dbType, specVisibleEnumValues(dreamColumnInfo, openapiObject))
  }

  const singleType = singularAttributeOpenapiShape(
    source,
    column,
    dreamColumnInfo,
    suppressResponseEnums,
    openapiObject,
  )

  if (dreamColumnInfo.isArray) {
    return {
      type: dreamColumnInfo.allowNull ? ['array', 'null'] : 'array',
      items: singleType,
      ...openapiObject,
    } as OpenapiSchemaBody
  } else {
    const existingType = dreamColumnInfo.allowNull
      ? ([singleType.type, 'null'] as ['string', 'null'])
      : (singleType.type as 'string')

    const returnObj = {
      ...singleType,
      type: existingType,
      ...openapiObject,
    } as OpenapiSchemaString

    if (suppressResponseEnums) delete returnObj['enum']
    return returnObj
  }
}

/**
 * The full OpenAPI schema of the shape the model declares for a property
 * (`@deco.JSON`, `@deco.Virtual`, `@deco.Encrypted`), read from Dream, which
 * checks the property's value against this same schema: expanded from
 * shorthand and, for a `@deco.JSON` column or an `@deco.Encrypted` attribute,
 * wrapped by its column's array-ness and nullability. `undefined` when the
 * property declares no shape.
 *
 * Dream builds the schema once and shares it, so a render gets its own copy,
 * which nothing later in the render can change for Dream's check.
 */
function modelDeclaredShapeSchema(dreamClass: typeof Dream, property: string): OpenapiSchemaBody | undefined {
  const schema = DreamApp.system.declaredShapeSchema(dreamClass, property)
  return schema === undefined ? undefined : structuredClone(schema)
}

const SHAPE_KEYWORDS = ['type', 'anyOf', 'oneOf', 'allOf', '$ref', '$schema', '$serializer', '$serializable']

/**
 * @internal
 *
 * Whether a serializer attribute's `openapi` carries a shape (a primitive
 * shorthand, or an object with a `type`, a composition or a reference) rather
 * than only describing the value.
 */
export function openapiCarriesShape(
  openapi: OpenapiDescription | OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes | undefined,
): boolean {
  if (openapi === undefined) return false
  if (!isObject(openapi)) return true
  return SHAPE_KEYWORDS.some(keyword => (openapi as Record<string, unknown>)[keyword] !== undefined)
}

/**
 * Whether a serializer attribute's `openapi` is an `OpenapiDescription`: an
 * object carrying nothing but a `description`.
 */
function openapiIsDescriptionOnly(
  openapi: OpenapiDescription | OpenapiSchemaBodyShorthand | OpenapiShorthandPrimitiveTypes,
): boolean {
  return isObject(openapi) && Object.keys(openapi).every(key => key === 'description')
}

function baseDbType(dreamColumnInfo: DreamColumnInfo) {
  return dreamColumnInfo.dbType.replace('[]', '')
}

/**
 * @internal
 *
 * Returns the enum values the rendered spec actually exposes for an
 * enum-backed column:
 *
 * - array columns with an `items:` override: the override's whole `items`
 *   object replaces the model-derived, enum-bearing `items` via the trailing
 *   spread in `dreamColumnOpenapiShape` — so the spec-visible set is the
 *   override's `items.enum` when present, else the top-level `enum:`
 *   override (which the spread still exposes), else nothing at all
 * - array columns without an `items:` override: a top-level `enum:` override
 *   is fed into the rendered `items.enum` by
 *   `singularAttributeOpenapiShape`, so it wins, else the column's full enum
 *   values
 * - scalar columns: the explicit top-level `enum:` override wins via the
 *   trailing spread, else the column's full enum values
 *
 * Presence semantics intentionally mirror the rendered output's spread
 * behavior (an explicitly-provided override replaces the model-derived set,
 * even when empty).
 */
function specVisibleEnumValues(
  dreamColumnInfo: DreamColumnInfo,
  openapiObject: OpenapiSchemaBody,
): readonly (string | null)[] {
  const topLevelEnum = (openapiObject as OpenapiSchemaString).enum

  if (dreamColumnInfo.isArray) {
    const itemsOverride = (openapiObject as { items?: { enum?: (string | null)[] } }).items
    if (itemsOverride) return itemsOverride.enum ?? topLevelEnum ?? []
    return topLevelEnum ?? dreamColumnInfo.enumValues ?? []
  }

  return topLevelEnum ?? dreamColumnInfo.enumValues ?? []
}

function singularAttributeOpenapiShape(
  // this is the global name of the serializer or controller calling down
  // to get this information. If an unrecognized db type is provided, the
  // source will be rendered in the exception that is returned, enabling
  // the dev to identify the source of the issue and fix it
  source: string,
  column: string,
  dreamColumnInfo: DreamColumnInfo,
  suppressResponseEnums: boolean,
  openapiSchema: OpenapiSchemaBody,
) {
  if (dreamColumnInfo.enumValues) {
    const enumOverrides = (openapiSchema as OpenapiSchemaString).enum || dreamColumnInfo.enumValues

    if (suppressResponseEnums) {
      return {
        type: 'string',
        description: `The following values will be allowed:\n  ${enumOverrides.join(',\n  ')}`,
      } as const
    } else {
      return {
        type: 'string',
        enum: [...enumOverrides, ...(dreamColumnInfo.allowNull && !dreamColumnInfo.isArray ? [null] : [])],
      } as const
    }
  }

  switch (baseDbType(dreamColumnInfo)) {
    case 'boolean':
      return { type: 'boolean' } as const

    case 'bigserial':
    case 'bytea':
    case 'char':
    case 'character varying':
    case 'character':
    case 'cidr':
    case 'citext':
    case 'inet':
    case 'macaddr':
    case 'money':
    case 'path':
    case 'text':
    case 'time':
    case 'time without time zone':
    case 'timetz':
    case 'time with time zone':
    case 'uuid':
    case 'varbit':
    case 'varchar':
    case 'xml':
      return { type: 'string' } as const

    case 'integer':
    case 'serial':
    case 'smallint':
    case 'smallserial':
      return { type: 'integer' } as const

    case 'bigint':
      return { type: 'string', format: 'bigint' } as const

    case 'numeric':
    case 'decimal':
      return { type: 'number', format: 'decimal' } as const

    case 'double':
    case 'real':
      return { type: 'number' } as const

    case 'datetime':
    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return { type: 'string', format: 'date-time' } as const

    case 'date':
      return { type: 'string', format: 'date' } as const

    case 'json':
    case 'jsonb':
      return { type: 'object' } as const

    default:
      throw new UnrecognizedDbTypeFoundWhileComputingOpenapiAttribute(source, column, dreamColumnInfo.dbType)
  }
}

export class UseCustomOpenapiForJson extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private field: string,
  ) {
    super()
  }

  public override get message() {
    const modelName = this.dreamClass.sanitizedName
    return `The OpenAPI shape of a json/jsonb column cannot be inferred from the database:
Dream model: ${modelName}
Attribute: ${this.field}

Declare the column's shape once on the model with @deco.JSON. Serializer
attributes, request bodies and Params.for all read that declaration:

export default class ${modelName} extends ApplicationModel {
  @deco.JSON({ type: 'object', properties: { hello: 'string' } })
  public ${this.field}: DreamColumn<${modelName}, '${this.field}'>
}

Or, for a column without @deco.JSON, pass the shape to this serializer's attribute:

export const MySerializer = (data: ${modelName}) =>
  DreamSerializer(${modelName}, data)
    .attribute('${this.field}', {
      openapi: {
        type: 'object', properties: { hello: 'string' },
      },
    })`
  }
}
