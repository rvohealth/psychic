import nonArrayColumnType from '../../helpers/nonArrayColumnType'
import type { TableColumnSchema } from '../../types/table'

export default function ColumnInput({
  columnValue,
  columnData,
  onChange,
  onSubmit,
}: {
  columnValue: unknown
  columnData: TableColumnSchema
  onChange: (val: string | boolean | null | unknown[]) => void
  onSubmit: () => void
}) {
  return (
    <div className="column-input">
      <ColumnInputContents
        columnValue={columnValue}
        columnData={columnData}
        onChange={onChange}
        onSubmit={onSubmit}
      />
    </div>
  )
}

function ColumnInputContents({
  columnValue,
  columnData,
  onChange,
  onSubmit,
}: {
  columnValue: unknown
  columnData: TableColumnSchema
  onChange: (val: string | boolean | null | unknown[]) => void
  onSubmit: () => void
}) {
  switch (nonArrayColumnType(columnData)) {
    case 'boolean':
      return (
        <select
          onChange={e => {
            onChange(e.target.value === 'NULL' ? null : e.target.value === 'true' ? true : false)
            onSubmit()
          }}
        >
          <option selected={columnValue === true}>true</option>
          <option selected={columnValue === false}>false</option>
          <option selected={columnValue === null}>NULL</option>
        </select>
      )

    case 'bigint':
    case 'number':
    case 'integer':
    case 'decimal':
      return (
        <input
          type="number"
          value={columnValue as string}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => {
            if (!e.shiftKey && e.key === 'Enter') {
              onSubmit()
            }
          }}
        />
      )

    default:
      if (columnData.enumValues?.length) {
        // enums should always be editMode=true, so the select
        // box can always stay visible.
        return (
          <select
            onChange={e => {
              onChange(e.target.value)
              onSubmit()
            }}
          >
            {columnData.enumValues.map(enumValue => (
              <option selected={columnValue === enumValue} key={enumValue}>
                {enumValue}
              </option>
            ))}
          </select>
        )
      } else {
        return (
          <input
            type="text"
            value={columnValue as string}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => {
              if (!e.shiftKey && e.key === 'Enter') {
                onSubmit()
              }
            }}
          />
        )
      }
  }
}
