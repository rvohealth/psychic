import type { TableColumnSchema, TableData } from '../types/table'
import nonArrayColumnType from './nonArrayColumnType'

export default function fillTableDefaultValues({ tableData }: { tableData: TableData }) {
  return Object.keys(tableData.schema.columns).reduce(
    (agg, key) => {
      agg[key as keyof typeof agg] = defaultValueForColumn(tableData.schema.columns[key]!)
      return agg
    },
    {} as Record<string, unknown>,
  )
}

function defaultValueForColumn(columnData: TableColumnSchema) {
  if (columnData.allowNull) return null
  const defaultVal = defaultValueForNonArrayColumn(columnData)
  return columnData.isArray ? [defaultVal] : defaultVal
}

function defaultValueForNonArrayColumn(columnData: TableColumnSchema) {
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
