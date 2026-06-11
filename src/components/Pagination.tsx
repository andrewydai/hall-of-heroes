interface PaginationProps {
  page: number
  totalPages: number
  onPage: (page: number) => void
}

export default function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between pt-3 border-t border-blue-900/40 mt-1">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="text-xs border border-blue-900 text-blue-400 rounded px-3 py-1 disabled:opacity-30 hover:border-blue-700 transition-colors"
      >
        ← Prev
      </button>
      <span className="text-xs text-blue-500">{page} / {totalPages}</span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className="text-xs border border-blue-900 text-blue-400 rounded px-3 py-1 disabled:opacity-30 hover:border-blue-700 transition-colors"
      >
        Next →
      </button>
    </div>
  )
}
