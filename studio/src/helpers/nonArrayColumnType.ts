import type { TableColumnSchema } from '../types/table'

export default function nonArrayColumnType(columnData: TableColumnSchema) {
  return columnData.dbType.replace(/\[\]/, '')
}
