import { Dream } from '@rvoh/dream'
import {
  OpenapiDescription,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiSchemaString,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream/openapi'
import { DbTypes } from '@rvoh/dream/types'
import { SerializingPlainPropertyWithoutOpenapiShape } from '../../error/openapi/SerializingPlainPropertyWithoutOpenapiShape.js'
import UnrecognizedDbTypeFoundWhileComputingOpenapiAttribute from '../../error/openapi/UnrecognizedDbTypeFoundWhileComputingOpenapiAttribute.js'
import OpenapiSegmentExpander from '../body-segment.js'
import OpenapiEnumCollector from './OpenapiEnumCollector.js'
import openapiShorthandToOpenapi from './openapiShorthandToOpenapi.js'

export interface VirtualAttributeStatement {
  property: string
  type: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined
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
    const openapiObject = openapiShorthandToOpenapi((openapi ?? {}) as any)

    const metadata = (dreamClass['virtualAttributes'] as VirtualAttributeStatement[]).find(
      statement => statement.property === column,
    )

    if (metadata?.type) {
      return {
        ...new OpenapiSegmentExpander(metadata.type, {
          renderOpts: {
            casing: 'camel',
            suppressResponseEnums: false,
            legacyImplicitRequestBodyParams: false,
            // a nested `for:` sentinel inside a virtual attribute's `type`
            // reaches enum-backed columns through this hand-built expander,
            // so the collector must ride along here as well
            enumCollector,
          },
          target: 'request',
        }).render().openapi,
        ...openapiObject,
      }
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
    if (openapi) return openapiShorthandToOpenapi(openapi as any)
    throw new SerializingPlainPropertyWithoutOpenapiShape(dreamClass, column)
  }

  if (!allowGenericJson) {
    switch (baseDbType(dreamColumnInfo)) {
      case 'json':
      case 'jsonb':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        if (openapi) return openapiShorthandToOpenapi(openapi as any)
        throw new UseCustomOpenapiForJson(dreamClass, column)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const openapiObject = openapiShorthandToOpenapi((openapi ?? {}) as any)

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

function baseDbType(dreamColumnInfo: DreamColumnInfo) {
  return dreamColumnInfo.dbType.replace('[]', '')
}

/**
 * @internal
 *
 * Returns the enum values the rendered spec actually exposes for an
 * enum-backed column:
 *
 * - array columns: a serializer override carries its enum at `items.enum`,
 *   and the override's whole `items` object replaces the model-derived
 *   `items` via the trailing spread in `dreamColumnOpenapiShape` — so the
 *   spec-visible set is the override's `items.enum` when present, else the
 *   column's full enum values
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
  if (dreamColumnInfo.isArray) {
    const itemsEnum = (openapiObject as { items?: { enum?: (string | null)[] } }).items?.enum
    return itemsEnum ?? dreamColumnInfo.enumValues ?? []
  }

  const topLevelEnum = (openapiObject as OpenapiSchemaString).enum
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
    return `Use custom OpenAPI declaration (OpenapiSchemaBodyShorthand) to define shape of json and jsonb fields:
Dream model: ${this.dreamClass.sanitizedName}
Attribute: ${this.field}

For example:

export const MySerializer = (data: MyModel) =>
  DreamSerializer(MyModel, data)
    .jsonAttribute('myJson', {
      openapi: {
        type: 'object', properties: { hello: 'string' },
      },
    })`
  }
}
