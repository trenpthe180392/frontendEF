import { useEffect, useState } from 'react'

import Button from './Button'
import Input from './Input'
import Select from './Select'

function clampPage(page, totalPages) {
  const parsed = Number(page)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(Math.max(Math.trunc(parsed), 1), Math.max(totalPages, 1))
}

function getVisiblePages(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

function PaginationControls({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  const [pageInput, setPageInput] = useState(String(currentPage))
  const visiblePages = getVisiblePages(currentPage, totalPages)
  const pageSizes = [10, 25, 50]

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  function goToInputPage(event) {
    event.preventDefault()
    const nextPage = clampPage(pageInput, totalPages)
    setPageInput(String(nextPage))
    onPageChange(nextPage)
  }

  if (totalPages <= 1 && !onPageSizeChange) return null

  return (
    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-neutral-500">
        Trang {currentPage}/{totalPages}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-neutral-600" htmlFor="pagination-size-input">
              Số hàng/trang
            </label>
            <Select
              id="pagination-size-input"
              className="h-9 w-20"
              value={pageSize || 10}
              onChange={(event) => onPageSizeChange?.(Number(event.target.value))}
            >
              {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </Select>
          </div>
        ) : null}
        {totalPages > 7 ? <form className="flex items-center gap-2" onSubmit={goToInputPage}>
          <label className="text-sm font-medium text-neutral-600" htmlFor="pagination-page-input">
            Đến trang
          </label>
          <Input
            id="pagination-page-input"
            className="h-9 w-20"
            min="1"
            max={totalPages}
            type="number"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
          />
          <Button type="submit" variant="secondary" size="sm">
            Đi
          </Button>
        </form> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            Trước
          </Button>
          {visiblePages.map((page, index) => {
            const previous = visiblePages[index - 1]
            const hasGap = previous && page - previous > 1

            return (
              <span key={page} className="inline-flex items-center gap-2">
                {hasGap ? <span className="text-sm text-neutral-400">...</span> : null}
                <Button type="button" variant={page === currentPage ? 'primary' : 'secondary'} size="sm" onClick={() => onPageChange(page)}>
                  {page}
                </Button>
              </span>
            )
          })}
          <Button type="button" variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
            Sau
          </Button>
        </div>
      </div>
    </div>
  )
}

export default PaginationControls
