import nonArrayColumnType from '../../helpers/nonArrayColumnType'
import type { TableColumnSchema } from '../../types/table'

export default function ColumnInput({
  columnValue,
  columnData,
  onChange,
}: {
  columnValue: unknown
  columnData: TableColumnSchema
  onChange: (val: string | boolean | null | unknown[]) => void
}) {
  switch (nonArrayColumnType(columnData)) {
    case 'boolean':
      return (
        <select
          onChange={e =>
            onChange(e.target.value === 'NULL' ? null : e.target.value === 'true' ? true : false)
          }
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
