import columnWidth from '../../helpers/columnWidth'
import type { TableColumnSchema, TableData } from '../../types/table'
import TableColumn from './TableColumn'

export default function TableRow({
  row,
  tableData,
  editColumn,
  onChangeEditColumn,
  onChange,
  changes,
  columnWidths,
  onClick,
  nested,
}: {
  row: object
  tableData: TableData
  editColumn: string | null
  onChangeEditColumn: (columnName: string | null) => void
  onChange: (val: Record<string, unknown>) => void
  changes: Record<string, unknown>
  columnWidths: Record<string, number>
  nested?: boolean
  onClick?: (row: object) => void
}) {
  const nonPrimaryKeys = Object.keys(tableData.schema.columns).filter(
    columnName => columnName !== tableData.primaryKey,
  )
  const primaryKeyValue = row[tableData.primaryKey as keyof typeof row] || null
  const isNewRecord = !primaryKeyValue
  const isDisabled = isNewRecord || !!nested
  const columnChanges = changes[primaryKeyValue] || {}

  return (
    <tr>
      <td
        className="primary-key"
        style={{
          width: columnWidths[tableData.primaryKey] || 100,
          minWidth: 50,
          maxWidth: columnWidths[tableData.primaryKey] || 100,
        }}
      >
        <button className={isDisabled ? 'disabled' : ''} disabled={isDisabled} onClick={() => onClick?.(row)}>
          {primaryKeyValue || 'NULL'}
        </button>
      </td>

      {nonPrimaryKeys.map(columnName => {
        const originalValue = row[columnName as keyof typeof row]
        const changedValue = columnChanges[columnName as keyof typeof columnChanges]
        const columnData = tableData.schema.columns[columnName] as TableColumnSchema
        const minWidth = columnWidth(columnName)

        return (
          <TableColumn
            key={columnName}
            columnValue={changedValue !== undefined ? changedValue : originalValue}
            changed={changedValue !== undefined && changedValue !== originalValue}
            columnData={columnData}
            editMode={columnName === editColumn}
            onChange={val => {
              if (primaryKeyValue) {
                onChange({
                  ...changes,
                  [primaryKeyValue]: {
                    ...(changes[primaryKeyValue] || {}),
                    [columnName]: val,
                  },
                })
              } else {
                onChange({
                  [columnName]: val,
                })
              }
            }}
            onChangeEdit={() => onChangeEditColumn(columnName === editColumn ? null : columnName)}
            width={columnWidths[columnName] || minWidth}
          />
        )
      })}
    </tr>
  )
}
