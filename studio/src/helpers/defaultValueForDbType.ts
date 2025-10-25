import type { TableColumnSchema } from '../types/table'
import nonArrayColumnType from './nonArrayColumnType'

export default function defaultValueForDbType(columnData: TableColumnSchema) {
  switch (nonArrayColumnType(columnData)) {
    case 'boolean':
      return 'true'

    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
      return '0'

    default:
      return 'untitled'
  }
}
