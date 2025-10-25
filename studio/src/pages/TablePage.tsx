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
  const [changes, setChanges] = useState<Record<string, unknown>>({})

  const hasChanges = !!Object.keys(changes).length

  const tableName = params.tableName as string

  const fetchTableRows = async () => {
    const res = await Axios.get(`http://localhost:7777/studio/tables/${tableName}?page=${page}`)
    setRows(res.data.results as object[])
    setTableData({ schema: res.data.tableSchema as TableSchema, primaryKey: res.data.primaryKey as string })
  }

  useEffect(() => {
    if (rowsFetched) return
    setRowsFetched(true)

    void fetchTableRows()
  }, [rowsFetched, rows, page])

  if (!tableData) return <div>loading...</div>

  const nonPrimaryKeys = Object.keys(tableData.schema.columns).filter(
    columnName => columnName !== tableData.primaryKey,
  )

  return (
    <>
      <div style={{ textAlign: 'right' }}>
        {hasChanges ? (
          <button
            style={{ marginRight: 10 }}
            onClick={async () => {
              for (const primaryKeyValue of Object.keys(changes)) {
                await Axios.patch(`http://localhost:7777/studio/tables/${tableName}`, {
                  ...changes[primaryKeyValue]!,
                  [tableData.primaryKey]: primaryKeyValue,
                })
              }

              await fetchTableRows()
              setEditColumn(null)
              setChanges({})
            }}
          >
            save
          </button>
        ) : null}
        <h3 style={{ display: 'inline-block' }}>{tableName}</h3>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <td>{tableData.primaryKey}</td>
            {nonPrimaryKeys.map(columnName => (
              <td key={columnName}>{columnName}</td>
            ))}
          </thead>
          <tbody>
            {rows.map(row => (
              <TableRow
                row={row}
                tableData={tableData!}
                editColumn={editColumn}
                onChangeEditColumn={column => setEditColumn(column)}
                onChange={changes => {
                  setChanges({
                    ...changes,
                  })
                }}
                changes={changes}
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
  onChange: (val: string | unknown[]) => void
  onChangeEdit: (newEdit: boolean) => void
}) {
  if (columnData.isArray) {
    return (
      <td>
        <ArrayColumn
          columnValues={columnValue as unknown[]}
          onChangeEdit={onChangeEdit}
          onChange={onChange}
          changed={changed}
          editMode={editMode}
          columnType={columnType(columnData)}
          columnData={columnData}
        />
      </td>
    )
  }

  return (
    <td>
      <EditableColumn
        columnValue={columnValue as string}
        editMode={editMode}
        onChangeEdit={onChangeEdit}
        columnType={columnType(columnData)}
        hasChanged={changed}
      >
        <ColumnInput columnData={columnData} columnValue={columnValue} onChange={onChange} />
      </EditableColumn>
    </td>
  )
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
  onChangeEdit,
  changed,
  editMode,
  columnType,
  columnData,
}: {
  columnValues: unknown[] | null
  onChange: (arr: unknown[]) => void
  onChangeEdit: (newEdit: boolean) => void
  changed: boolean
  editMode: boolean
  columnType: string
  columnData: TableColumnSchema
}) {
  const [currentEditIndex, setCurrentEditIndex] = useState<number | null>(null)
  const defaultText = 'untitled'

  return (
    <div className={`editable-column ${columnType} ${changed ? 'changed' : ''}`}>
      {(columnValues || []).map((value, index) =>
        editMode && index === currentEditIndex ? (
          <ColumnInput
            key={index}
            columnData={columnData}
            columnValue={value}
            onChange={newVal =>
              onChange((columnValues || [])?.map((origVal, i) => (i === index ? newVal : origVal)))
            }
          />
        ) : (
          <div key={index}>
            <span onClick={() => onChange(columnValues!.filter((_, i) => i !== index))}>&times;</span>
            <span
              onClick={() => {
                onChangeEdit(true)
                setCurrentEditIndex(index)
              }}
            >
              {value as string}
            </span>
          </div>
        ),
      )}
      <button
        onClick={() => {
          setCurrentEditIndex((columnValues || []).length + 1)
          onChange([...(columnValues || []), defaultText])
          onChangeEdit(true)
        }}
      >
        +
      </button>
    </div>
  )
}

function ColumnInput({
  columnValue,
  columnData,
  onChange,
}: {
  columnValue: unknown
  columnData: TableColumnSchema
  onChange: (val: string | unknown[]) => void
}) {
  switch (columnData.dbType) {
    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
      return <input type="number" value={columnValue as string} onChange={e => onChange(e.target.value)} />

    default:
      if (columnData.enumValues?.length) {
        // enums should always be editMode=true, so the select
        // box can always stay visible.
        return (
          <select onChange={e => onChange(e.target.value)}>
            {columnData.enumValues.map(enumValue => (
              <option selected={columnValue === enumValue} key={enumValue}>
                {enumValue}
              </option>
            ))}
          </select>
        )
      } else {
        return <input type="text" value={columnValue as string} onChange={e => onChange(e.target.value)} />
      }
  }
}

function columnType(columnData: TableColumnSchema) {
  switch (columnData.dbType) {
    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
      return 'number'

    default:
      return 'text'
  }
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
