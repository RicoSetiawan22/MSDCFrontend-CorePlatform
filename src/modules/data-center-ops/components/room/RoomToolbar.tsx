import React from "react";
import { Search, Plus } from "lucide-react";

interface RoomToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  siteFilter: string;
  onSiteFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sites: { id: number; site_name: string; site_code: string }[];
  onAddRoom: () => void;
  totalRooms?: number;
}

export const RoomToolbar: React.FC<RoomToolbarProps> = ({
  search,
  onSearchChange,
  siteFilter,
  onSiteFilterChange,
  typeFilter,
  onTypeFilterChange,
  sites,
  onAddRoom,
  totalRooms,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-1">
      {/* ── Kiri: Pencarian & Filter Site & Filter Tipe Room ── */}
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
            placeholder="Cari room (kode, nama, site)..."
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

        {/* Room Type Filter Dropdown */}
        <div className="w-full sm:w-[170px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
          >
            <option value="">Semua Tipe Room</option>
            <option value="server_room">Server Room</option>
            <option value="network_room">Network Room</option>
            <option value="ups_room">UPS & Power</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
      </div>

      {/* ── Kanan: Badge Total & Tombol + Room Baru ── */}
      <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
        {totalRooms !== undefined && (
          <span className="text-xs text-slate-500 hidden md:inline">
            Menampilkan <strong className="text-slate-800">{totalRooms}</strong> room
          </span>
        )}
        <button
          type="button"
          onClick={onAddRoom}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:-translate-y-0.5"
        >
          <Plus size={16} className="text-white stroke-[2.5]" />
          <span>Room Baru</span>
        </button>
      </div>
    </div>
  );
};

export default RoomToolbar;
