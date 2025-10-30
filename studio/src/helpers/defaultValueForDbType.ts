import type { TableColumnSchema } from '../types/table'
import nonArrayColumnType from './nonArrayColumnType'

export default function defaultValueForDbType(columnData: TableColumnSchema) {
  switch (nonArrayColumnType(columnData)) {
    case 'boolean':
      return true

    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
    case 'numeric':
      return 0

    case 'uuid':
      return generateUUID()

    case 'json':
    case 'jsonb':
      return {}

    case 'date':
      return new Date().toISOString().substring(0, 10)

    case 'timestamp':
    case 'timestamp with time zone':
    case 'timestamp without time zone':
      return new Date().toISOString()

    default:
      return 'untitled'
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
