import React from 'react'
import Spinner from '../ui/Spinner'
import EmptyState from './EmptyState'
import PaginationControls from '../ui/PaginationControls'

/**
 * @param {object} props
 * @param {Array} props.columns - Column definitions [{ header: string, accessor: string | function, render: function }]
 * @param {Array} props.data - Data to display
 * @param {boolean} props.loading
 * @param {string} props.emptyText
 * @param {object} props.pagination - { currentPage, totalPages, onPageChange }
 */
function DataTable({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  pagination,
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="md" />
        <p className="mt-4 text-sm text-neutral-500">Loading data...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No data found"
        description={emptyText}
      />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-neutral-300 bg-neutral-50">
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-sm font-semibold text-neutral-700">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIdx) => (
            <tr key={rowIdx} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
              {columns.map((col, colIdx) => (
                <td key={colIdx} className="px-4 py-3 text-sm text-neutral-700">
                  {col.render ? col.render(item) : (typeof col.accessor === 'function' ? col.accessor(item) : item[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <div className="mt-4 flex justify-center">
          <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  )
}

export default DataTable
