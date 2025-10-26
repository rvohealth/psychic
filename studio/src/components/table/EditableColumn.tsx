import type { TableColumnSchema } from '../../types/table'
import ColumnDisplay from './ColumnDisplay'
import ColumnInput from './ColumnInput'

export default function EditableColumn({
  columnValue,
  editMode,
  onChangeEdit,
  columnType,
  hasChanged,
  onChange,
  columnData,
}: {
  columnValue: string
  editMode: boolean
  onChangeEdit: (newEdit: boolean) => void
  columnType: string
  hasChanged: boolean
  onChange: (val: string | boolean | null | unknown[]) => void
  columnData: TableColumnSchema
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
          <ColumnDisplay
            columnValue={columnValue}
            columnType={columnType}
            onClick={() => {
              onChangeEdit(true)
            }}
          />
        </div>
      )}
      {editMode && (
        <ColumnInput
          columnData={columnData}
          columnValue={columnValue}
          onChange={onChange}
          onSubmit={() => onChangeEdit(false)}
        />
      )}
    </div>
  )
}
