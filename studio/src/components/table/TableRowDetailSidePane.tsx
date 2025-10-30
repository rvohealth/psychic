import { useState } from 'react'
import type { TableData } from '../../types/table'
import type { SummarizedAssociationMetadata } from './TableView'
import TableView from './TableView'

export default function TableRowDetailSidePane({
  open,
  row,
  tableData,
  associationMetadata,
  onClose,
}: {
  open: boolean
  row: object
  tableData: TableData
  associationMetadata: SummarizedAssociationMetadata[]
  onClose: () => void
}) {
  const [selectedAssociationMetadata, setSelectedAssociationMetadata] =
    useState<SummarizedAssociationMetadata | null>()
  if (!open) return

  const primaryKeyColumnName = tableData.primaryKey as keyof typeof row

  console.log({ selectedAssociationMetadata })
  return (
    <div className="table-detail-side-pane side-pane">
      <div
        className="backdrop"
        onClick={() => {
          onClose()
        }}
      ></div>
      <div className="contents">
        {associationMetadata.map(assoc => (
          <button onClick={() => setSelectedAssociationMetadata(assoc)} key={assoc.associationName}>
            {assoc.associationName}
          </button>
        ))}

        {selectedAssociationMetadata ? (
          <>
            <TableView
              key={selectedAssociationMetadata.associationGlobalName}
              mode="model"
              tableOrModelName={selectedAssociationMetadata.associationGlobalName}
              defaultFilters={[
                {
                  columnName: selectedAssociationMetadata.foreignKey,
                  comparisonOperator: '=',
                  value: row[primaryKeyColumnName],
                },
              ]}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}
