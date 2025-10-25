import { columnType } from '../../helpers/columnType'
import type { TableColumnSchema } from '../../types/table'
import EditableArrayColumn from './EditableArrayColumn'
import EditableColumn from './EditableColumn'

export default function TableColumn({
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
  onChange: (val: string | boolean | null | unknown[]) => void
  onChangeEdit: (newEdit: boolean) => void
}) {
  if (columnData.isArray) {
    return (
      <td>
        <EditableArrayColumn
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
        columnData={columnData}
        onChange={onChange}
      />
    </td>
  )
}
