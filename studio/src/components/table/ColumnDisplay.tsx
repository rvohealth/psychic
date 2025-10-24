export default function ColumnDisplay({
  columnValue,
  columnType,
  onClick,
  allowDelete = false,
  onDelete = () => {},
}: {
  columnValue: boolean | string | null
  columnType: string
  onClick: () => void
  allowDelete?: boolean
  onDelete?: () => void
}) {
  return (
    <div className={`column-display ${columnType}`}>
      {allowDelete && (
        <span className="delete-btn" onClick={onDelete}>
          &times;
        </span>
      )}
      <span className="text" onClick={onClick}>
        {displayableValue(columnValue)}
      </span>
    </div>
  )
}

function displayableValue(columnValue: boolean | string | null): string {
  const MAX_DISPLAY_LIMIT = 40
  switch (columnValue) {
    case null:
      return 'NULL'

    case true:
      return 'true'

    case false:
      return 'false'

    default: {
      const val =
        typeof columnValue === 'object' ? JSON.stringify(columnValue) : (columnValue as string).toString()
      return val.length <= MAX_DISPLAY_LIMIT ? val : val.substring(0, MAX_DISPLAY_LIMIT) + '…'
    }
  }
}
