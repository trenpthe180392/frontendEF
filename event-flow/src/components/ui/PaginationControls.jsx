import { useEffect, useState } from 'react'

import Button from './Button'
import Input from './Input'

function clampPage(page, totalPages) {
  const parsed = Number(page)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(Math.max(Math.trunc(parsed), 1), Math.max(totalPages, 1))
}

function clampPageSize(size) {
  const parsed = Number(size)
  if (!Number.isFinite(parsed)) return 10
  return Math.min(Math.max(Math.trunc(parsed), 1), 100)
}

function getVisiblePages(currentPage, totalPages) {
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

function PaginationControls({ currentPage, totalPages, pageSize, onPageChange, onPageSizeChange }) {
  const [pageInput, setPageInput] = useState(String(currentPage))
  const [pageSizeInput, setPageSizeInput] = useState(String(pageSize || 10))
  const visiblePages = getVisiblePages(currentPage, totalPages)

  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

  useEffect(() => {
    setPageSizeInput(String(pageSize || 10))
  }, [pageSize])

  function goToInputPage(event) {
    event.preventDefault()
    const nextPage = clampPage(pageInput, totalPages)
    setPageInput(String(nextPage))
    onPageChange(nextPage)
  }

  function changePageSize(event) {
    event.preventDefault()
    const nextPageSize = clampPageSize(pageSizeInput)
    setPageSizeInput(String(nextPageSize))
    onPageSizeChange?.(nextPageSize)
  }

  if (totalPages <= 1 && !onPageSizeChange) return null

  return (
    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-neutral-500">
        Trang {currentPage}/{totalPages}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {onPageSizeChange ? (
          <form className="flex items-center gap-2" onSubmit={changePageSize}>
            <label className="text-sm font-medium text-neutral-600" htmlFor="pagination-size-input">
              Số hàng/trang
            </label>
            <Input
              id="pagination-size-input"
              className="h-9 w-20"
              min="1"
              max="100"
              type="number"
              value={pageSizeInput}
              onChange={(event) => setPageSizeInput(event.target.value)}
            />
            <Button type="submit" variant="secondary" size="sm">
              Áp dụng
            </Button>
          </form>
        ) : null}
        <form className="flex items-center gap-2" onSubmit={goToInputPage}>
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
        </form>
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
