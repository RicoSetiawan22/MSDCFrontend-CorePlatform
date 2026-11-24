import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

export interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  perPage?: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50],
  className = "",
}) => {
  // Generate page numbers
  const pages: number[] = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2.5 pt-5 pb-1 ${className}`}
    >
      {/* ── Page Buttons Group ── */}
      <div className="flex items-center gap-1.5">
        {/* Tombol Sebelumnya (<) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
          className="w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Nomor Halaman */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E59B00] text-white shadow-xs"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Tombol Selanjutnya (>) */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalPages === 0}
          aria-label="Halaman selanjutnya"
          className="w-7 h-7 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* ── Dropdown Pilihan Per Halaman ── */}
      {onPerPageChange && perPage !== undefined && (
        <div className="relative inline-flex items-center">
          <select
            value={perPage}
            onChange={(e) => {
              onPerPageChange(Number(e.target.value));
              onPageChange(1);
            }}
            aria-label="Pilih jumlah baris per halaman"
            className="appearance-none border border-slate-200 rounded-md pl-2.5 pr-7 py-1 text-xs text-slate-700 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
          >
            {perPageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / halaman
              </option>
            ))}
          </select>
          <ChevronDown
            size={13}
            className="absolute right-2 text-slate-400 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
};

export default DataTablePagination;
