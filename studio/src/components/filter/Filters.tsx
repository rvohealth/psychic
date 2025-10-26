import { useState } from 'react'
import type { TableData } from '../../types/table'
import type { TableFilter } from '../../types/filter'
import FilterModal from './FilterModal'

type FilterModal = 'new' | 'edit'
export default function Filters({ tableData }: { tableData: TableData }) {
  const [currentFilters, setCurrentFilters] = useState<TableFilter[]>([])
  const [modal, setModal] = useState<FilterModal | null>(null)
  const [activeFilter, setActiveFilter] = useState<TableFilter | null>(null)

  return (
    <>
      <div className="table-filters">
        <div className="filter-display-container">
          {currentFilters.map(filter => (
            <div
              className="filter-display"
              onClick={() => {
                setActiveFilter(filter)
                setModal('edit')
              }}
            >
              <div className="column-name">{filter.columnName}</div>
              <div className="operator">{filter.comparisonOperator as string}</div>
              <div className="value">{`${filter.value}`}</div>
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
          setCurrentFilters([
            ...currentFilters.filter(
              f => f.columnName !== filter.columnName || f.comparisonOperator !== filter.comparisonOperator,
            ),
            filter,
          ])

          setModal(null)
        }}
      />

      {modal === 'edit' && activeFilter ? (
        <FilterModal
          open={true}
          tableData={tableData}
          onSubmit={filter => {
            setCurrentFilters([
              ...currentFilters.filter(
                f => f.columnName !== filter.columnName || f.comparisonOperator !== filter.comparisonOperator,
              ),
              filter,
            ])

            setModal(null)
          }}
          startFilter={activeFilter}
        />
      ) : null}
    </>
  )
}
