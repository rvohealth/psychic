import type { TableColumnSchema } from '../types/table'
import nonArrayColumnType from './nonArrayColumnType'

export function columnType(columnData: TableColumnSchema) {
  switch (nonArrayColumnType(columnData)) {
    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
    case 'numeric':
      return 'number'

    case 'boolean':
      return 'boolean'

    case 'uuid':
      return 'uuid'

    case 'json':
    case 'jsonb':
      return 'json'

    case 'date':
      return 'date'

    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return 'datetime'

    default:
      return 'text'
  }
}
