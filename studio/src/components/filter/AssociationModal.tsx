import { type TableFilter } from '../../types/filter'
import type { TableData } from '../../types/table'
import TableView from '../table/TableView'

export default function AssociationModal({
  open,
  associationName,
  primaryKeyColumn,
  primaryKeyValue,
  tableData,
  startFilter,
  onClose,
}: {
  open: boolean
  primaryKeyColumn: string
  primaryKeyValue: unknown
  associationName: string
  tableData: TableData
  startFilter?: TableFilter
  onClose: () => void
}) {
  if (!open) return

  return (
    <div className="association-modal app-modal">
      <div
        className="backdrop"
        onClick={() => {
          onClose()
        }}
      ></div>

      <div className="contents">
        <TableView mode="model" tableOrModelName={} />
      </div>
    </div>
  )
}
