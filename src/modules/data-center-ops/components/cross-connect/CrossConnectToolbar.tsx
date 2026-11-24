import React from "react";
import { Search, Plus } from "lucide-react";
import type { CableType } from "../../types/crossConnect";

export const CABLE_TYPE_LABELS: Record<CableType, string> = {
  cat5e: "Cat5e",
  cat6: "Cat6",
  cat6a: "Cat6a",
  multimode_fiber: "Multi-Mode Fiber",
  singlemode_fiber: "Single-Mode Fiber",
  coaxial: "Coaxial",
  other: "Lainnya",
};

export interface CrossConnectToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  cableTypeFilter: string;
  onCableTypeFilterChange: (value: string) => void;
  onAddCable: () => void;
  totalCables?: number;
}

export const CrossConnectToolbar: React.FC<CrossConnectToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  cableTypeFilter,
  onCableTypeFilterChange,
  onAddCable,
  totalCables,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-1">
      {/* ── Kiri: Pencarian & Filter Status, Tipe Kabel ── */}
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
            placeholder="Cari kabel, tag number, lokasi, customer..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari kabel cross connect"
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
            <option value="available">Available</option>
            <option value="active">Active</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>

        {/* Cable Type Filter Dropdown */}
        <div className="w-full sm:w-[180px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={cableTypeFilter}
            onChange={(e) => onCableTypeFilterChange(e.target.value)}
            aria-label="Filter berdasarkan Tipe Kabel"
          >
            <option value="">Semua Tipe Kabel</option>
            {Object.entries(CABLE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Kanan: Badge Total & Tombol + Kabel Baru ── */}
      <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
        {totalCables !== undefined ? (
          <span className="text-xs text-slate-500 hidden md:inline">
            Menampilkan <strong className="text-slate-800">{totalCables}</strong> kabel
          </span>
        ) : null}
        <button
          type="button"
          onClick={onAddCable}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:-translate-y-0.5"
        >
          <Plus size={16} className="text-white stroke-[2.5]" />
          <span>Kabel Baru</span>
        </button>
      </div>
    </div>
  );
};

export default CrossConnectToolbar;
