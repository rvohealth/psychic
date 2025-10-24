import { useState } from 'react'
import type { TableColumnSchema } from '../../types/table'
import defaultValueForDbType from '../../helpers/defaultValueForDbType'
import ColumnInput from './ColumnInput'
import ColumnDisplay from './ColumnDisplay'

export default function EditableArrayColumn({
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
  const defaultValue = defaultValueForDbType(columnData)

  return (
    <div className={`editable-column is-array ${columnType} ${changed ? 'changed' : ''}`}>
      {(columnValues || []).map((value, index) =>
        editMode && index === currentEditIndex ? (
          <ColumnInput
            key={index}
            columnData={columnData}
            columnValue={value}
            onChange={newVal =>
              onChange((columnValues || [])?.map((origVal, i) => (i === index ? newVal : origVal)))
            }
            onSubmit={() => onChangeEdit(false)}
          />
        ) : (
          <ColumnDisplay
            allowDelete
            key={index}
            columnValue={value as string}
            columnType={columnType}
            onClick={() => {
              onChangeEdit(true)
              setCurrentEditIndex(index)
            }}
            onDelete={() => {
              onChange(columnValues!.filter((_, i) => i !== index))
            }}
          />
        ),
      )}
      <button
        onClick={() => {
          setCurrentEditIndex((columnValues || []).length + 1)
          onChange([...(columnValues || []), defaultValue])
          onChangeEdit(true)
        }}
      >
        +
      </button>
    </div>
  )
}
