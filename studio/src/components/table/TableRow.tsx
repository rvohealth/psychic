import type { TableColumnSchema, TableData } from '../../types/table'
import TableColumn from './TableColumn'

export default function TableRow({
  row,
  tableData,
  editColumn,
  onChangeEditColumn,
  onChange,
  changes,
}: {
  row: object
  tableData: TableData
  editColumn: string | null
  onChangeEditColumn: (columnName: string | null) => void
  onChange: (val: Record<string, unknown>) => void
  changes: Record<string, unknown>
}) {
  const nonPrimaryKeys = Object.keys(tableData.schema.columns).filter(
    columnName => columnName !== tableData.primaryKey,
  )
  const primaryKeyValue = row[tableData.primaryKey as keyof typeof row]
  const columnChanges = changes[primaryKeyValue] || {}

  return (
    <tr>
      <td className="primary-key">{primaryKeyValue}</td>

      {nonPrimaryKeys.map(columnName => {
        const originalValue = row[columnName as keyof typeof row]
        const changedValue = columnChanges[columnName as keyof typeof columnChanges]
        const columnData = tableData.schema.columns[columnName] as TableColumnSchema

        return (
          <TableColumn
            columnValue={changedValue !== undefined ? changedValue : originalValue}
            changed={changedValue !== undefined && changedValue !== originalValue}
            columnData={columnData}
            editMode={columnName === editColumn}
            onChange={val => {
              onChange({
                ...changes,
                [primaryKeyValue]: {
                  ...(changes[primaryKeyValue] || {}),
                  [columnName]: val,
                },
              })
            }}
            onChangeEdit={() => onChangeEditColumn(columnName === editColumn ? null : columnName)}
          />
        )
      })}
    </tr>
  )
}
