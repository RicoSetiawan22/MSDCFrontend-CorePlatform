import React from "react";
import { Search, Plus } from "lucide-react";

export interface OtbToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddOtb: () => void;
  totalOtbs?: number;
}

export const OtbToolbar: React.FC<OtbToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddOtb,
  totalOtbs,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1">
      {/* ── Kiri: Pencarian & Filter Status ── */}
      <div className="flex items-center gap-3 flex-1 flex-wrap sm:flex-nowrap">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            placeholder="Cari tag number atau lokasi..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari OTB"
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full sm:w-[160px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter berdasarkan Status"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* ── Kanan: Badge Total & Tombol + OTB Baru ── */}
      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
        {totalOtbs !== undefined ? (
          <span className="text-xs text-slate-500 hidden md:inline">
            Menampilkan <strong className="text-slate-800">{totalOtbs}</strong> OTB
          </span>
        ) : null}
        <button
          type="button"
          onClick={onAddOtb}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:-translate-y-0.5"
        >
          <Plus size={16} className="text-white stroke-[2.5]" />
          <span>OTB Baru</span>
        </button>
      </div>
    </div>
  );
};

export default OtbToolbar;
