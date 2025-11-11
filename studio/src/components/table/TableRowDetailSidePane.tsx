import { Fragment, useEffect, useState } from 'react'
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

  useEffect(() => {
    if (!open) setSelectedAssociationMetadata(null)
  }, [open])

  if (!open) return

  const primaryKeyColumnName = tableData.primaryKey as keyof typeof row

  return (
    <div className="table-detail-side-pane side-pane">
      <div
        className="backdrop"
        onClick={() => {
          onClose()
        }}
      ></div>
      <div className="contents">
        <button onClick={() => setSelectedAssociationMetadata(null)}>JSON</button>

        {associationMetadata.map(assoc => (
          <button onClick={() => setSelectedAssociationMetadata(assoc)} key={assoc.associationName}>
            {assoc.associationName}
          </button>
        ))}

        {selectedAssociationMetadata ? (
          <>
            <TableView
              nested
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
        ) : (
          <>
            <table>
              <tbody>
                {Object.keys(row).map(columnName => (
                  <tr key={columnName}>
                    <td>{columnName}</td>
                    <td>{JSON.stringify(row[columnName as keyof typeof row])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
