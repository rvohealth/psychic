import {
  DbTypes,
  Dream,
  OpenapiDescription,
  OpenapiSchemaBodyShorthand,
  OpenapiShorthandPrimitiveTypes,
} from '@rvoh/dream'
import openapiShorthandToOpenapi from './openapiShorthandToOpenapi.js'

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
  dreamClass: DreamClass,
  column: DreamClassColumnNames<DreamClass>,
  openapi:
    | OpenapiDescription
    | OpenapiSchemaBodyShorthand
    | OpenapiShorthandPrimitiveTypes
    | undefined = undefined,
  { suppressResponseEnums = false }: { suppressResponseEnums?: boolean } = {},
) {
  const dream = dreamClass.prototype

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
  const dreamColumnInfo: DreamColumnInfo = dream.schema[dream.table]?.columns[column]
  if (!dreamColumnInfo) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
    if (openapi) return openapiShorthandToOpenapi(openapi as any)
    throw new UseCustomOpenapiForVirtualAttributes(dreamClass, column)
  }

  switch (baseDbType(dreamColumnInfo)) {
    case 'json':
    case 'jsonb':
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
      if (openapi) return openapiShorthandToOpenapi(openapi as any)
      throw new UseCustomOpenapiForJson(dreamClass, column)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  const openapiObject = openapiShorthandToOpenapi((openapi ?? {}) as any)
  const singleType = singularAttributeOpenapiShape(dreamColumnInfo, suppressResponseEnums)

  if (dreamColumnInfo.isArray) {
    return {
      type: dreamColumnInfo.allowNull ? ['array', 'null'] : 'array',
      items: singleType,
      ...openapiObject,
    }
  } else {
    const existingType = singleType.type

    return {
      ...singleType,
      type: dreamColumnInfo.allowNull && !Array.isArray(existingType) ? [existingType, 'null'] : existingType,
      ...openapiObject,
    }
  }
}

function baseDbType(dreamColumnInfo: DreamColumnInfo) {
  return dreamColumnInfo.dbType.replace('[]', '')
}

function singularAttributeOpenapiShape(dreamColumnInfo: DreamColumnInfo, suppressResponseEnums: boolean) {
  if (dreamColumnInfo.enumValues) {
    if (suppressResponseEnums) {
      return {
        type: 'string',
        description: `The following values will be allowed:\n  ${dreamColumnInfo.enumValues.join(',\n  ')}`,
      } as const
    } else {
      return { type: 'string', enum: dreamColumnInfo.enumValues } as const
    }
  }

  switch (baseDbType(dreamColumnInfo)) {
    case 'boolean':
      return { type: 'boolean' } as const

    case 'bigint':
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

    case 'numeric':
    case 'decimal':
      return { type: 'number', format: 'decimal' } as const

    case 'double':
    case 'real':
      return { type: 'number' } as const

    case 'datetime':
    case 'time':
    case 'time with time zone':
    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return { type: 'string', format: 'date-time' } as const

    case 'date':
      return { type: 'string', format: 'date' } as const

    default:
      throw new Error(
        `Unrecognized dbType used in serializer OpenAPI type declaration: ${dreamColumnInfo.dbType}`,
      )
  }
}

export class UseCustomOpenapiForVirtualAttributes extends Error {
  constructor(
    private dreamClass: typeof Dream,
    private field: string,
  ) {
    super()
  }

  public override get message() {
    return `Use custom OpenAPI declaration (OpenapiSchemaBodyShorthand) to define shape of virtual fields:
Dream model: ${this.dreamClass.sanitizedName}
Attribute: ${this.field}`
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
