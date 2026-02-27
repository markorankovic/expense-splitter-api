type PaginationControlsProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export function PaginationControls({
  currentPage,
  pageSize,
  totalItems,
  loading = false,
  onPageChange,
}: PaginationControlsProps) {
  if (totalItems <= pageSize) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className="pagination">
      <button
        type="button"
        className="button ghost"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1 || loading}
      >
        Prev
      </button>
      <span className="muted">
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="button ghost"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages || loading}
      >
        Next
      </button>
    </div>
  );
}
