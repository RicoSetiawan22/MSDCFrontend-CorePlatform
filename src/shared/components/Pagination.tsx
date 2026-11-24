
interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, lastPage);
  const activePage = Math.min(
    Math.max(1, currentPage),
    totalPages
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
        padding: "0.85rem 0",
        fontSize: "0.85rem",
        color: "var(--grey-dark, #64748b)",
      }}
    >
      {/* TOTAL DATA */}
      <span>
        Total {total} data
      </span>

      {/* NAVIGASI HALAMAN */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="btn btn-secondary"
          disabled={activePage <= 1}
          onClick={() => onPageChange(activePage - 1)}
        >
          ← Sebelumnya
        </button>

        <span
          style={{
            padding: "0.5rem 0.75rem",
            whiteSpace: "nowrap",
          }}
        >
          Halaman {activePage} / {totalPages}
        </span>

        <button
          type="button"
          className="btn btn-secondary"
          disabled={activePage >= totalPages}
          onClick={() => onPageChange(activePage + 1)}
        >
          Berikutnya →
        </button>
      </div>
    </div>
  );
}
