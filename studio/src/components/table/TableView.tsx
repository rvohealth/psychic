import Axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router'
import columnWidth from '../../helpers/columnWidth'
import fillTableDefaultValues from '../../helpers/fillTableDefaultValues'
import type { TableFilter } from '../../types/filter'
import type { TableData, TableSchema } from '../../types/table'
import Filters from '../filter/Filters'
import Scopes from '../filter/Scopes'
import TableRow from './TableRow'
import TableRowDetailSidePane from './TableRowDetailSidePane'

export interface SummarizedAssociationMetadata {
  associationName: string
  polymorphic: boolean
  foreignKey: string
  foreignKeyTypeField: string | null
  associationGlobalName: string
  type: 'HasOne' | 'HasMany' | 'BelongsTo'
}

export default function TableView({
  mode,
  tableOrModelName,
  nested,
  defaultFilters = [],
}: {
  mode: 'table' | 'model'
  tableOrModelName: string
  nested?: boolean
  defaultFilters?: TableFilter[]
}) {
  const [rowsFetched, setRowsFetched] = useState<boolean>(false)
  const [page, setPage] = useState<number>(1)
  const [rows, setRows] = useState<object[]>([])
  const [selectedRow, setSelectedRow] = useState<object | null>(null)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [editColumn, setEditColumn] = useState<string | null>(null)
  const [editPrimaryKey, setEditPrimaryKey] = useState<string | null>(null)
  const [newRecordEditIndex, setNewRecordEditIndex] = useState<number | null>(null)
  const [changes, setChanges] = useState<Record<string, unknown>>({})
  const [newRecords, setNewRecords] = useState<Record<string, unknown>[]>([])
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [orderColumn, setOrderColumn] = useState<string | null>('createdAt')
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('asc')
  const [currentFilters, setCurrentFilters] = useState<TableFilter[]>(defaultFilters)
  const [scopes, setScopes] = useState<string[]>([])
  const [currentScope, setCurrentScope] = useState<string | null>(null)
  const [associationNames, setAssociationNames] = useState<string[]>([])
  const [associationMetadata, setAssociationMetadata] = useState<SummarizedAssociationMetadata[]>([])
  const resizingColumn = useRef<string | null>(null)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  const resource = mode === 'model' ? 'models' : 'tables'

  const hasChanges = !!Object.keys(changes).length || !!newRecords.length

  const fetchTableRows = async () => {
    const params: Record<string, unknown> = {
      page,
      orderColumn,
      orderDir,
    }

    if (currentFilters.length) {
      params.filters = currentFilters
    }

    if (mode === 'model') {
      params.scope = currentScope
    }

    const res = await Axios.post(`http://localhost:7777/studio/${resource}/${tableOrModelName}`, params)
    console.log(res.data)

    setRows(res.data.results as object[])
    setTableData({ schema: res.data.tableSchema as TableSchema, primaryKey: res.data.primaryKey as string })

    if (mode === 'model') {
      setScopes(res.data.namedScopes || [])
      setAssociationNames(res.data.associationNames || [])
      setAssociationMetadata(res.data.associationMetadata || [])
    }
  }

  const resetEditMode = () => {
    setEditColumn(null)
    setEditPrimaryKey(null)
    setNewRecordEditIndex(null)
  }

  const maybeResetEditMode = (target: Element) => {
    const parent = document.querySelector('.column-input')
    if ((parent && editPrimaryKey) || newRecordEditIndex) {
      if (!parent?.contains(target) && parent !== target) {
        resetEditMode()
      }
    }
  }

  useEffect(() => {
    if (rowsFetched) return
    setRowsFetched(true)

    void fetchTableRows()
  }, [rowsFetched, rows])

  useEffect(() => {
    void fetchTableRows()
  }, [page, orderDir, orderColumn, currentFilters, currentScope])

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
    <div
      className={`table-page${nested ? ' nested' : ''}`}
      onClick={e => {
        maybeResetEditMode(e.target as Element)
      }}
    >
      <div>
        <div className="left" style={{ width: 200, display: 'inline-block' }}>
          {hasChanges ? (
            <button
              style={{ marginRight: 10 }}
              onClick={async () => {
                for (const primaryKeyValue of Object.keys(changes)) {
                  await Axios.patch(`http://localhost:7777/studio/${resource}/${tableOrModelName}`, {
                    ...changes[primaryKeyValue]!,
                    [tableData.primaryKey]: primaryKeyValue,
                  })
                }

                for (const newRecord of newRecords) {
                  await Axios.post(
                    `http://localhost:7777/studio/${resource}/${tableOrModelName}/create`,
                    newRecord,
                  )
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
        </div>

        <div style={{ textAlign: 'right', display: 'inline-block', width: 'calc(100% - 200px - 30px)' }}>
          {!nested && (
            <NavLink to={`/${mode}s`} style={{ marginRight: 10 }}>
              &lt;
            </NavLink>
          )}

          <h3 style={{ display: 'inline-block' }}>{tableOrModelName}</h3>

          <button
            onClick={() => {
              setNewRecords([...newRecords, fillTableDefaultValues({ tableData })])
            }}
          >
            +
          </button>
        </div>
      </div>

      <Filters
        tableData={tableData!}
        currentFilters={currentFilters}
        onChange={newFilters => setCurrentFilters(newFilters)}
      />

      {scopes.length ? (
        <Scopes
          scopes={scopes}
          currentScope={currentScope}
          onChange={newScope => {
            setCurrentScope(newScope)
          }}
        />
      ) : null}

      <div
        className="table-container"
        onClick={e => {
          maybeResetEditMode(e.target as Element)
        }}
      >
        <table style={{ tableLayout: 'fixed', width: '100%' }}>
          <thead>
            <tr>
              <th
                style={{
                  position: 'relative',
                  width: columnWidths[tableData.primaryKey] || 150,
                  minWidth: 50,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
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
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span
                    onClick={() => {
                      setOrderDir(orderDir === 'asc' && orderColumn === columnName ? 'desc' : 'asc')
                      setOrderColumn(columnName)
                    }}
                  >
                    <span style={{ marginRight: 10 }}>
                      {orderColumn === columnName ? (orderDir === 'asc' ? '↑' : '↓') : null}
                    </span>
                    {columnName}
                  </span>

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
                  onClick={row => setSelectedRow(row)}
                  nested={nested}
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
                nested={nested}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TableRowDetailSidePane
        open={!!selectedRow}
        row={selectedRow!}
        tableData={tableData}
        associationMetadata={associationMetadata}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  )
}
