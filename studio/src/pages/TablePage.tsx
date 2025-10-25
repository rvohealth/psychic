import Axios from 'axios'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import TableRow from '../components/table/TableRow'
import type { TableData, TableSchema } from '../types/table'

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
