import React from "react";
import { Search, Plus } from "lucide-react";

export interface RackToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  siteFilter: string;
  onSiteFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sites: { id: number; site_name: string; site_code: string }[];
  onAddRack: () => void;
  totalRacks?: number;
}

export const RackToolbar: React.FC<RackToolbarProps> = ({
  search,
  onSearchChange,
  siteFilter,
  onSiteFilterChange,
  statusFilter,
  onStatusFilterChange,
  sites,
  onAddRack,
  totalRacks,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-1">
      {/* ── Kiri: Pencarian & Filter Site & Filter Status ── */}
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
            placeholder="Cari rack (kode, nama, room, site)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Site Filter Dropdown */}
        <div className="w-full sm:w-[190px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={siteFilter}
            onChange={(e) => onSiteFilterChange(e.target.value)}
          >
            <option value="">Semua Site</option>
            {sites.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.site_name} ({s.site_code})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full sm:w-[170px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="active">Active</option>
            <option value="reserved">Reserved</option>
            <option value="maintenance">Maintenance</option>
            <option value="decommissioned">Decommissioned</option>
          </select>
        </div>
      </div>

      {/* ── Kanan: Badge Total & Tombol + Rack Baru ── */}
      <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
        {totalRacks !== undefined ? (
          <span className="text-xs text-slate-500 hidden md:inline">
            Menampilkan <strong className="text-slate-800">{totalRacks}</strong> rack
          </span>
        ) : null}
        <button
          type="button"
          onClick={onAddRack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:-translate-y-0.5"
        >
          <Plus size={16} className="text-white stroke-[2.5]" />
          <span>Rack Baru</span>
        </button>
      </div>
    </div>
  );
};

export default RackToolbar;
