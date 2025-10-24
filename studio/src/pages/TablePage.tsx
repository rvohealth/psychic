import Axios from 'axios'
import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router'

export default function TablePage() {
  const params = useParams()
  const [rowsFetched, setRowsFetched] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [rows, setRows] = useState<object[]>([])
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [editColumn, setEditColumn] = useState<string | null>(null)

  const tableName = params.tableName as string

  useEffect(() => {
    const fetchTableRows = async () => {
      if (rowsFetched) return

      setRowsFetched(true)
      const res = await Axios.get(`http://localhost:7777/studio/tables/${tableName}?page=${page}`)
      setRows(res.data.results as object[])
      setTableData({ schema: res.data.tableSchema as TableSchema, primaryKey: res.data.primaryKey as string })
    }
    void fetchTableRows()
  }, [rowsFetched, rows, page])

  if (!tableData) return <div>loading...</div>

  const nonPrimaryKeys = Object.keys(tableData.schema.columns).filter(
    columnName => columnName !== tableData.primaryKey,
  )

  return (
    <>
      <h3>{tableName}</h3>
      <div className="table-container">
        <table>
          <thead>
            <td>{tableData.primaryKey}</td>
            {nonPrimaryKeys.map(columnName => (
              <td key={columnName}>{columnName}</td>
            ))}
            <td>(for saving)</td>
          </thead>
          <tbody>
            {rows.map(row => (
              <TableRow
                row={row}
                tableData={tableData!}
                tableName={tableName}
                editColumn={editColumn}
                onChangeEditColumn={column => setEditColumn(column)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function TableRow({
  row,
  tableData,
  tableName,
  editColumn,
  onChangeEditColumn,
}: {
  row: object
  tableData: TableData
  tableName: string
  editColumn: string | null
  onChangeEditColumn: (columnName: string | null) => void
}) {
  const [changes, setChanges] = useState<Record<string, unknown>>({})

  const nonPrimaryKeys = Object.keys(tableData.schema.columns).filter(
    columnName => columnName !== tableData.primaryKey,
  )
  const primaryKeyValue = row[tableData.primaryKey as keyof typeof row]

  const hasChanges = !!Object.keys(changes).length

  return (
    <tr>
      <td className="primary-key">{primaryKeyValue}</td>

      {nonPrimaryKeys.map(columnName => {
        const originalValue = row[columnName as keyof typeof row]
        const changedValue = changes[columnName]
        const columnData = tableData.schema.columns[columnName] as TableColumnSchema

        return (
          <TableColumn
            columnValue={changedValue !== undefined ? changedValue : originalValue}
            changed={changedValue !== undefined && changedValue !== originalValue}
            columnData={columnData}
            editMode={columnName === editColumn}
            onChange={val => {
              setChanges({
                ...changes,
                [columnName]: val,
              })
            }}
            onChangeEdit={() => onChangeEditColumn(columnName === editColumn ? null : columnName)}
          />
        )
      })}
      <td>
        {hasChanges ? (
          <button
            onClick={async () => {
              await Axios.patch(`http://localhost:7777/studio/tables/${tableName}`, {
                ...changes,
                [tableData.primaryKey]: primaryKeyValue,
              })
            }}
          >
            save
          </button>
        ) : (
          ''
        )}
      </td>
    </tr>
  )
}

function TableColumn({
  columnValue,
  columnData,
  changed,
  editMode,
  onChange,
  onChangeEdit,
}: {
  columnValue: unknown
  columnData: TableColumnSchema
  changed: boolean
  editMode: boolean
  onChange: (val: string) => void
  onChangeEdit: (newEdit: boolean) => void
}) {
  if (columnData.isArray) {
    return (
      <td>
        <ArrayColumn columnValues={columnValue as unknown[]} />
      </td>
    )
  }

  switch (columnData.dbType) {
    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
      return (
        <td>
          <EditableColumn
            columnValue={columnValue as string}
            editMode={editMode}
            onChangeEdit={onChangeEdit}
            columnType="number"
            hasChanged={changed}
          >
            <input type="number" value={columnValue as string} onChange={e => onChange(e.target.value)} />
          </EditableColumn>
        </td>
      )
      break

    default:
      if (columnData.enumValues?.length) {
        // enums should always be editMode=true, so the select
        // box can always stay visible.
        return (
          <td>
            <EditableColumn
              columnValue={columnValue as string}
              editMode={true}
              onChangeEdit={onChangeEdit}
              columnType="enum"
              hasChanged={changed}
            >
              <select onChange={e => onChange(e.target.value)}>
                {columnData.enumValues.map(enumValue => (
                  <option selected={columnValue === enumValue} key={enumValue}>
                    {enumValue}
                  </option>
                ))}
              </select>
            </EditableColumn>
          </td>
        )
      } else {
        return (
          <td>
            <EditableColumn
              columnValue={columnValue as string}
              editMode={editMode}
              onChangeEdit={onChangeEdit}
              columnType="text"
              hasChanged={changed}
            >
              <input type="text" value={columnValue as string} onChange={e => onChange(e.target.value)} />
            </EditableColumn>
          </td>
        )
      }
  }
}

function EditableColumn({
  columnValue,
  editMode,
  onChangeEdit,
  children,
  columnType,
  hasChanged,
}: {
  columnValue: string
  editMode: boolean
  onChangeEdit: (newEdit: boolean) => void
  children: ReactNode
  columnType: string
  hasChanged: boolean
}) {
  return (
    <div
      className={`editable-column ${columnType} ${columnValue === null ? 'is-null' : ''} ${hasChanged ? 'changed' : ''}`}
    >
      {!editMode && (
        <div
          onClick={() => {
            onChangeEdit(!editMode)
          }}
        >
          {columnValue === null ? 'NULL' : columnValue}
        </div>
      )}
      {editMode && children}
    </div>
  )
}

function ArrayColumn({
  columnValues,
  onChange,
}: {
  columnValues: unknown[]
  onChange: (arr: unknown[]) => void
}) {
  return (
    <div className="editable-column">
      {(columnValues || []).map(value => (
        <div>
          <div>&times;</div>
          <div>{value as string}</div>
        </div>
      ))}
      <button>+</button>
    </div>
  )
}

interface TableData {
  schema: TableSchema
  primaryKey: string
}

interface TableSchema {
  columns: Record<string, TableColumnSchema>
}

interface TableColumnSchema {
  allowNull: boolean
  isArray: boolean
  dbType: string
  enumValues: string[]
}
