export interface TableData {
  schema: TableSchema
  primaryKey: string
}

export interface TableSchema {
  columns: Record<string, TableColumnSchema>
}

export interface TableColumnSchema {
  allowNull: boolean
  isArray: boolean
  dbType: string
  enumValues: string[]
}
