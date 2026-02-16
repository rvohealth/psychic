import { useState } from 'react'
import type { TableData } from '../../types/table'
import type { TableFilter } from '../../types/filter'
import FilterModal from './FilterModal'

type FilterModal = 'new' | 'edit'
export default function Filters({
  tableData,
  currentFilters,
  onChange,
}: {
  tableData: TableData
  currentFilters: TableFilter[]
  onChange: (newFilters: TableFilter[]) => void
}) {
  const [modal, setModal] = useState<FilterModal | null>(null)
  const [activeFilter, setActiveFilter] = useState<TableFilter | null>(null)

  return (
    <>
      <div className="table-filters">
        <div className="filter-display-container">
          {currentFilters.map((filter, index) => (
            <div className="filter-display">
              <div
                className="delete-btn"
                onClick={() => {
                  onChange(currentFilters.filter((_, i) => i !== index))
                }}
              >
                &times;
              </div>
              <div
                onClick={() => {
                  setActiveFilter(filter)
                  setModal('edit')
                }}
              >
                <div className="column-name">{filter.columnName}</div>
                <div className="operator">{filter.comparisonOperator as string}</div>
                <div className="value">{`${filter.value}`}</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              setModal('new')
            }}
          >
            +
          </button>
        </div>
      </div>

      <FilterModal
        open={modal === 'new'}
        tableData={tableData}
        onSubmit={filter => {
          onChange([
            ...currentFilters.filter(
              f => f.columnName !== filter.columnName || f.comparisonOperator !== filter.comparisonOperator,
            ),
            filter,
          ])

          setModal(null)
        }}
        onClose={() => {
          setModal(null)
        }}
      />

      {modal === 'edit' && activeFilter ? (
        <FilterModal
          open={true}
          tableData={tableData}
          onSubmit={filter => {
            onChange([
              ...currentFilters.filter(
                f => f.columnName !== filter.columnName || f.comparisonOperator !== filter.comparisonOperator,
              ),
              filter,
            ])

            setModal(null)
          }}
          startFilter={activeFilter}
          onClose={() => {
            setModal(null)
          }}
        />
      ) : null}
    </>
  )
}
