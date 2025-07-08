import {
  Dream,
  OpenapiSchemaBody,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream'
import OpenapiSegmentExpander from '../body-segment.js'
import primitiveOpenapiStatementToOpenapi from './primitiveOpenapiStatementToOpenapi.js'

export interface VirtualAttributeStatement {
  property: string
  type: OpenapiShorthandPrimitiveTypes | OpenapiSchemaBodyShorthand | undefined
}

export default function dreamColumnToOpenapiType(
  dreamClass: typeof Dream,
  columnName: string,
): Record<string, OpenapiSchemaBody> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const schema = dreamClass.prototype.schema

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const columns = schema[dreamClass.prototype.table]?.columns as object

  const columnMetadata = columns[columnName as keyof typeof columns] as {
    dbType: string
    allowNull: boolean
    isArray: boolean
    enumValues: unknown[] | null
  }

  const nullableColumn = columnMetadata?.allowNull

  switch (columnMetadata?.dbType) {
    case 'boolean':
    case 'boolean[]':
    case 'date':
    case 'date[]':
    case 'integer':
    case 'integer[]':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi(columnMetadata.dbType, nullableColumn),
      }

    case 'character varying':
    case 'citext':
    case 'text':
    case 'uuid':
    case 'bigint':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi('string', nullableColumn),
      }

    case 'character varying[]':
    case 'citext[]':
    case 'text[]':
    case 'uuid[]':
    case 'bigint[]':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi('string[]', nullableColumn),
      }

    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi('date-time', nullableColumn),
      }

    case 'timestamp[]':
    case 'timestamp with time zone[]':
    case 'timestamp without time zone[]':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi('date-time[]', nullableColumn),
      }

    case 'json':
    case 'jsonb':
      return {
        [columnName]: {
          type: nullableColumn ? ['object', 'null'] : 'object',
        },
      }

    case 'json[]':
    case 'jsonb[]':
      return {
        [columnName]: {
          type: nullableColumn ? ['array', 'null'] : 'array',
          items: {
            type: 'object',
          },
        },
      }

    case 'numeric':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi('number', nullableColumn),
      }

    case 'numeric[]':
      return {
        [columnName]: primitiveOpenapiStatementToOpenapi('number[]', nullableColumn),
      }

    default:
      if (dreamClass.isVirtualColumn(columnName)) {
        const metadata = (dreamClass['virtualAttributes'] as VirtualAttributeStatement[]).find(
          statement => statement.property === columnName,
        )
        if (metadata?.type) {
          return {
            [columnName]: new OpenapiSegmentExpander(metadata.type, {
              renderOpts: {
                casing: 'camel',
                suppressResponseEnums: false,
              },
              target: 'request',
            }).render().openapi,
          }
        } else {
          return {
            [columnName]: {
              anyOf: [
                { type: ['string', 'null'] },
                { type: ['number', 'null'] },
                { type: ['object', 'null'] },
              ],
            },
          }
        }
      } else if (columnMetadata?.enumValues) {
        if (columnMetadata.isArray) {
          return {
            [columnName]: {
              type: nullableColumn ? ['array', 'null'] : 'array',
              items: {
                type: 'string',
                enum: [...columnMetadata.enumValues, ...(nullableColumn ? [null] : [])],
              },
            } as OpenapiSchemaBody,
          }
        } else {
          return {
            [columnName]: {
              type: nullableColumn ? ['string', 'null'] : 'string',
              enum: [...columnMetadata.enumValues, ...(nullableColumn ? [null] : [])],
            } as OpenapiSchemaBody,
          }
        }
      }

      return {}
  }
}
