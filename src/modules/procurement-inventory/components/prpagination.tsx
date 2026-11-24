import { ChevronLeft, ChevronRight } from "lucide-react";

interface PrPaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PrPagination({
  currentPage,
  lastPage,
  total,
  onPageChange,
}: PrPaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
      {/* Total Data */}
      <div className="font-medium">
        Menampilkan <span className="font-bold text-slate-700">{total}</span> total data
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        {/* Tombol Previously */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            currentPage <= 1
              ? "bg-slate-50 text-slate-300 border-slate-200/60 cursor-not-allowed"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs active:scale-95"
          }`}
        >
          <ChevronLeft size={14} />
          <span>Sebelumnya</span>
        </button>

        {/* Page Indicator */}
        <div className="px-3 py-1.5 bg-slate-100/80 rounded-xl font-semibold text-slate-700 border border-slate-200/50">
          {currentPage} <span className="text-slate-400 font-normal">/</span> {lastPage}
        </div>

        {/* Tombol Next */}
        <button
          type="button"
          disabled={currentPage >= lastPage}
          onClick={() => onPageChange(currentPage + 1)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            currentPage >= lastPage
              ? "bg-slate-50 text-slate-300 border-slate-200/60 cursor-not-allowed"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs active:scale-95"
          }`}
        >
          <span>Berikutnya</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}