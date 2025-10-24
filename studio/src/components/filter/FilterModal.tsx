import { useState } from 'react'
import { columnType } from '../../helpers/columnType'
import {
  FILTER_COMPARISON_OPERATORS,
  type FilterComparisonOperator,
  type TableFilter,
} from '../../types/filter'
import type { TableColumnSchema, TableData } from '../../types/table'
import EditableArrayColumn from '../table/EditableArrayColumn'
import EditableColumn from '../table/EditableColumn'

export default function FilterModal({
  open,
  tableData,
  onSubmit,
  startFilter,
  onClose,
}: {
  open: boolean
  tableData: TableData
  onSubmit: (filter: TableFilter) => void
  startFilter?: TableFilter
  onClose: () => void
}) {
  const columns: (keyof typeof tableData.schema.columns)[] = Object.keys(tableData.schema.columns)
  const [selectedColumn, setSelectedColumn] = useState<(typeof columns)[number]>(
    startFilter?.columnName || columns?.[0] || '',
  )
  const [selectedComparisonOperator, setSelectedComparisonOperator] = useState<FilterComparisonOperator>(
    startFilter?.comparisonOperator || '=',
  )
  const [value, setValue] = useState<unknown>(startFilter?.value || null)

  if (!open) return

  const selectedColumnData =
    tableData.schema.columns[selectedColumn as keyof typeof tableData.schema.columns] || null

  return (
    <div className="filter-modal app-modal">
      <div
        className="backdrop"
        onClick={() => {
          onClose()
        }}
      ></div>
      <div className="contents">
        <h2>Add filter</h2>

        <div style={{ textAlign: 'right' }}>
          <h3>COLUMN</h3>
          <select
            value={selectedColumn!}
            onChange={e => {
              setSelectedColumn(e.target.value)
            }}
          >
            {columns.map((columnName, index) => (
              <option key={index}>{columnName}</option>
            ))}
          </select>
        </div>

        <div style={{ textAlign: 'right' }}>
          <h3>OPERATOR</h3>
          <select
            onChange={e => {
              setSelectedComparisonOperator(e.target.value as FilterComparisonOperator)
            }}
          >
            {FILTER_COMPARISON_OPERATORS.map(op => (
              <option key={op}>{op}</option>
            ))}
          </select>
        </div>

        <div>
          {selectedColumn && (
            <>
              <h3 style={{ textAlign: 'right' }}>VALUE</h3>
              <div style={{ textAlign: 'right' }}>
                <FilterColumnInput
                  editMode
                  columnData={selectedColumnData!}
                  changed={false}
                  columnValue={value}
                  onChange={val => {
                    setValue(val)
                  }}
                  onChangeEdit={() => {
                    // noop, always in edit mode
                  }}
                />
              </div>
            </>
          )}
        </div>

        <div style={{ textAlign: 'right', paddingTop: 20 }}>
          <button
            onClick={() => {
              onSubmit({
                columnName: selectedColumn,
                comparisonOperator: selectedComparisonOperator,
                value,
              })
              setSelectedColumn(columns[0])
              setSelectedComparisonOperator('=')
              setValue(null)
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterColumnInput({
  columnData,
  columnValue,
  onChangeEdit,
  changed,
  onChange,
  editMode,
}: {
  columnValue: unknown
  columnData: TableColumnSchema
  changed: boolean
  editMode: boolean
  onChange: (val: string | boolean | null | unknown[]) => void
  onChangeEdit: (newEdit: boolean) => void
}) {
  if (columnData.isArray) {
    return (
      <EditableArrayColumn
        columnValues={columnValue as unknown[]}
        onChangeEdit={onChangeEdit}
        onChange={onChange}
        changed={changed}
        editMode={editMode}
        columnType={columnType(columnData)}
        columnData={columnData}
      />
    )
  }

  return (
    <EditableColumn
      columnValue={columnValue as string}
      editMode={editMode}
      onChangeEdit={onChangeEdit}
      columnType={columnType(columnData)}
      hasChanged={changed}
      columnData={columnData}
      onChange={onChange}
    />
  )
}
