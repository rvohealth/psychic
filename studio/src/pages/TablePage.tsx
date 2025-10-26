import Axios from 'axios'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router'
import TableRow from '../components/table/TableRow'
import type { TableData, TableSchema } from '../types/table'
import columnWidth from '../helpers/columnWidth'
import fillTableDefaultValues from '../helpers/fillTableDefaultValues'

export default function TablePage() {
  const params = useParams()
  const [rowsFetched, setRowsFetched] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [rows, setRows] = useState<object[]>([])
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [editColumn, setEditColumn] = useState<string | null>(null)
  const [editPrimaryKey, setEditPrimaryKey] = useState<string | null>(null)
  const [newRecordEditIndex, setNewRecordEditIndex] = useState<number | null>(null)
  const [changes, setChanges] = useState<Record<string, unknown>>({})
  const [newRecords, setNewRecords] = useState<Record<string, unknown>[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const resizingColumn = useRef<string | null>(null)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  const hasChanges = !!Object.keys(changes).length || !!newRecords.length

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn.current) {
        const diff = e.clientX - startX.current
        const newWidth = Math.max(50, startWidth.current + diff)
        setColumnWidths(prev => ({
          ...prev,
          [resizingColumn.current!]: newWidth,
        }))
      }
    }

    const handleMouseUp = () => {
      resizingColumn.current = null
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  if (!tableData) return <div>loading...</div>

  const nonPrimaryKeys = Object.keys(tableData.schema.columns).filter(
    columnName => columnName !== tableData.primaryKey,
  )

  const handleResizeStart = (columnName: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizingColumn.current = columnName
    startX.current = e.clientX
    const currentWidth = columnWidths[columnName] || 150
    startWidth.current = currentWidth
  }

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

              for (const newRecord of newRecords) {
                await Axios.post(`http://localhost:7777/studio/tables/${tableName}`, newRecord)
              }

              await fetchTableRows()
              setEditColumn(null)
              setChanges({})
              setNewRecords([])
            }}
          >
            save
          </button>
        ) : null}

        <h3 style={{ display: 'inline-block' }}>{tableName}</h3>

        <button
          onClick={() => {
            setNewRecords([...newRecords, fillTableDefaultValues({ tableData })])
          }}
        >
          +
        </button>
      </div>

      <div className="table-container">
        <table style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th
                style={{
                  position: 'relative',
                  width: columnWidths[tableData.primaryKey] || 150,
                  minWidth: 50,
                }}
              >
                {tableData.primaryKey}
                <div
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: 0,
                    bottom: 0,
                    width: '8px',
                    cursor: 'col-resize',
                    userSelect: 'none',
                    background: 'transparent',
                    zIndex: 10,
                  }}
                  onMouseDown={e => handleResizeStart(tableData.primaryKey, e)}
                  onMouseEnter={e => {
                    ;(e.target as HTMLElement).style.background = 'rgba(0, 0, 255, 0.2)'
                  }}
                  onMouseLeave={e => {
                    ;(e.target as HTMLElement).style.background = 'transparent'
                  }}
                />
              </th>
              {nonPrimaryKeys.map(columnName => (
                <th
                  key={columnName}
                  style={{
                    position: 'relative',
                    width: columnWidths[columnName] || columnWidth(columnName),
                    minWidth: 50,
                  }}
                >
                  {columnName}
                  <div
                    style={{
                      position: 'absolute',
                      right: -2,
                      top: 0,
                      bottom: 0,
                      width: '8px',
                      cursor: 'col-resize',
                      userSelect: 'none',
                      background: 'transparent',
                      zIndex: 10,
                    }}
                    onMouseDown={e => handleResizeStart(columnName, e)}
                    onMouseEnter={e => {
                      ;(e.target as HTMLElement).style.background = 'rgba(0, 0, 255, 0.2)'
                    }}
                    onMouseLeave={e => {
                      ;(e.target as HTMLElement).style.background = 'transparent'
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const primaryKeyValue = row[tableData.primaryKey as keyof typeof row]

              return (
                <TableRow
                  key={index}
                  row={row}
                  tableData={tableData!}
                  editColumn={primaryKeyValue === editPrimaryKey ? editColumn : null}
                  onChangeEditColumn={column => {
                    setEditColumn(column)
                    setEditPrimaryKey(primaryKeyValue)
                    setNewRecordEditIndex(null)
                  }}
                  onChange={changes => {
                    setChanges({
                      ...changes,
                    })
                  }}
                  changes={changes}
                  columnWidths={columnWidths}
                />
              )
            })}

            {newRecords.map((record, index) => (
              <TableRow
                key={`new-record-${index}`}
                row={record}
                tableData={tableData!}
                editColumn={newRecordEditIndex === index ? editColumn : null}
                onChangeEditColumn={column => {
                  setEditColumn(column)
                  setNewRecordEditIndex(index)
                  setEditPrimaryKey(null)
                }}
                onChange={changes => {
                  setNewRecords(newRecords.map((r, i) => (i === index ? { ...r, ...changes } : r)))
                }}
                changes={changes}
                columnWidths={columnWidths}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
