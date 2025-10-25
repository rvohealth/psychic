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
  let displayValue: unknown = columnValue
  switch (columnValue) {
    case null:
      displayValue = 'NULL'
      break

    case true:
      displayValue = 'true'
      break

    case false:
      displayValue = 'false'
      break
  }

  // onClick={() => {
  //   onChangeEdit(true)
  //   setCurrentEditIndex(index)
  // }}
  return (
    <div className={`column-display ${columnType}`}>
      {allowDelete && (
        <span className="delete-btn" onClick={onDelete}>
          &times;
        </span>
      )}
      <span className="text" onClick={onClick}>
        {displayValue as string}
      </span>
    </div>
  )
}
