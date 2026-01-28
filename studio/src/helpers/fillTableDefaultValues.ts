import type { TableColumnSchema, TableData } from '../types/table'
import defaultValueForDbType from './defaultValueForDbType'

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
  const defaultVal = defaultValueForDbType(columnData)
  return columnData.isArray ? [defaultVal] : defaultVal
}
