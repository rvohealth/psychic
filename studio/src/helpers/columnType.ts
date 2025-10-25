import type { TableColumnSchema } from '../types/table'
import nonArrayColumnType from './nonArrayColumnType'

export function columnType(columnData: TableColumnSchema) {
  switch (nonArrayColumnType(columnData)) {
    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
      return 'number'

    case 'boolean':
      return 'boolean'

    default:
      return 'text'
  }
}
