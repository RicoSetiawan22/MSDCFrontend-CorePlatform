import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export const CRM_DEFAULT_PER_PAGE = 10;
const PER_PAGE_OPTIONS = [10, 20, 50];

interface CrmPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

// Match Data Center Ops without depending on another module or its Tailwind build.
const PAGINATION_STYLES = `
.crm-table-pagination {
  box-sizing: border-box;
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px 16px;
  color: #334155;
}
.crm-table-pagination .crm-table-pagination__pages {
  display: flex;
  align-items: center;
  gap: 6px;
}
.crm-table-pagination button.crm-table-pagination__button {
  box-sizing: border-box;
  display: inline-flex;
  min-width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px !important;
  background: #fff;
  color: #334155;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transform: none;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.crm-table-pagination button.crm-table-pagination__button:hover:not(:disabled) {
  background: #f8fafc;
  color: #1e293b;
  transform: none;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
}
.crm-table-pagination button.crm-table-pagination__button--arrow { color: #94a3b8; }
.crm-table-pagination button.crm-table-pagination__button[aria-current="page"],
.crm-table-pagination button.crm-table-pagination__button[aria-current="page"]:hover {
  border-color: #E59B00;
  background: #E59B00;
  color: #fff;
}
.crm-table-pagination button.crm-table-pagination__button:disabled {
  opacity: .3;
  cursor: not-allowed;
}
.crm-table-pagination .crm-table-pagination__size { position: relative; display: inline-flex; align-items: center; }
.crm-table-pagination select.crm-table-pagination__select {
  box-sizing: border-box;
  width: auto;
  height: 28px;
  margin: 0;
  padding: 4px 28px 4px 10px;
  appearance: none;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,.05);
}
.crm-table-pagination .crm-table-pagination__chevron { position: absolute; right: 8px; color: #94a3b8; pointer-events: none; }
.crm-table-pagination button.crm-table-pagination__button:focus-visible,
.crm-table-pagination select.crm-table-pagination__select:focus-visible { outline: 2px solid #E59B00; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) {
  .crm-table-pagination button.crm-table-pagination__button { transition: none; }
}
`;

export function CrmPagination({
  currentPage,
  lastPage,
  total,
  perPage,
  onPageChange,
  onPerPageChange,
}: CrmPaginationProps) {
  const totalPages = Number.isFinite(lastPage) ? Math.max(1, Math.floor(lastPage)) : 1;
  const page = Number.isFinite(currentPage)
    ? Math.min(totalPages, Math.max(1, Math.floor(currentPage)))
    : 1;
  const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => startPage + index,
  );

  return (
    <nav className="crm-table-pagination" aria-label={`Navigasi halaman, total ${total} data`}>
      <style>{PAGINATION_STYLES}</style>
      <div className="crm-table-pagination__pages">
        <button
          type="button"
          className="crm-table-pagination__button crm-table-pagination__button--arrow"
          aria-label="Halaman sebelumnya"
          title="Halaman sebelumnya"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} aria-hidden="true" />
        </button>
        {pages.map((number) => (
          <button
            key={number}
            type="button"
            className="crm-table-pagination__button"
            aria-label={`Halaman ${number}`}
            aria-current={number === page ? "page" : undefined}
            onClick={() => { if (number !== page) onPageChange(number); }}
          >
            {number}
          </button>
        ))}
        <button
          type="button"
          className="crm-table-pagination__button crm-table-pagination__button--arrow"
          aria-label="Halaman selanjutnya"
          title="Halaman selanjutnya"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </div>
      <div className="crm-table-pagination__size">
        <select
          className="crm-table-pagination__select"
          aria-label="Pilih jumlah baris per halaman"
          value={perPage}
          onChange={(event) => {
            onPerPageChange(Number(event.target.value));
            onPageChange(1);
          }}
        >
          {PER_PAGE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} / halaman</option>
          ))}
        </select>
        <ChevronDown size={13} className="crm-table-pagination__chevron" aria-hidden="true" />
      </div>
    </nav>
  );
}
