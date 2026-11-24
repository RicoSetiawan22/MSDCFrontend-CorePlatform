import React from "react";
import { Search, Plus } from "lucide-react";

interface SiteToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddSite: () => void;
  totalSites?: number;
}

export const SiteToolbar: React.FC<SiteToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAddSite,
  totalSites,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1">
      {/* ── Kiri: Pencarian & Filter Status ── */}
      <div className="flex items-center gap-3 flex-1 max-w-xl flex-wrap sm:flex-nowrap">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Cari site (kode, nama, lokasi)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full sm:w-auto">
          <select
            className="w-full sm:w-[160px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="maintenance">Maintenance</option>
            <option value="decommissioned">Didecommission</option>
          </select>
        </div>
      </div>

      {/* ── Kanan: Tombol + Site Baru ── */}
      <div className="flex items-center gap-3 self-end sm:self-auto">
        {totalSites !== undefined && (
          <span className="text-xs text-slate-500 hidden md:inline">
            Menampilkan <strong className="text-slate-800">{totalSites}</strong> site
          </span>
        )}
        <button
          type="button"
          onClick={onAddSite}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-gold hover:-translate-y-0.5 text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus size={16} className="text-white stroke-[2.5] bg-primary-gold" />
          <span>Site Baru</span>
        </button>
      </div>
    </div>
  );
};
