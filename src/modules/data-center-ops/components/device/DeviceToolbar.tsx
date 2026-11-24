import React from "react";
import { Search, Plus } from "lucide-react";

export interface DeviceToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  siteFilter: string;
  onSiteFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sites: { id: number; site_name: string; site_code: string }[];
  onAddDevice: () => void;
  totalDevices?: number;
}

export const DeviceToolbar: React.FC<DeviceToolbarProps> = ({
  search,
  onSearchChange,
  siteFilter,
  onSiteFilterChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  sites,
  onAddDevice,
  totalDevices,
}) => {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-1">
      {/* ── Kiri: Pencarian & Filter Site, Tipe, Status ── */}
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
            placeholder="Cari device (nama, kode, vendor, SN)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari device inventori"
          />
        </div>

        {/* Site Filter Dropdown */}
        <div className="w-full sm:w-[180px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={siteFilter}
            onChange={(e) => onSiteFilterChange(e.target.value)}
            aria-label="Filter berdasarkan Site"
          >
            <option value="">Semua Site</option>
            {sites.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.site_name} ({s.site_code})
              </option>
            ))}
          </select>
        </div>

        {/* Type Filter Dropdown */}
        <div className="w-full sm:w-[150px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            aria-label="Filter berdasarkan Tipe Device"
          >
            <option value="">Semua Tipe</option>
            <option value="server">Server</option>
            <option value="storage">Storage</option>
            <option value="switch">Switch</option>
            <option value="router">Router</option>
            <option value="firewall">Firewall</option>
            <option value="ups">UPS</option>
            <option value="pdu">PDU</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        {/* Status Filter Dropdown */}
        <div className="w-full sm:w-[160px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter berdasarkan Status Perangkat"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="spare">Spare / Cadangan</option>
            <option value="maintenance">Maintenance</option>
            <option value="decommissioned">Didecommission</option>
          </select>
        </div>
      </div>

      {/* ── Kanan: Badge Total & Tombol + Device Baru ── */}
      <div className="flex items-center gap-3 self-end lg:self-auto shrink-0">
        {totalDevices !== undefined ? (
          <span className="text-xs text-slate-500 hidden md:inline">
            Menampilkan <strong className="text-slate-800">{totalDevices}</strong> device
          </span>
        ) : null}
        <button
          type="button"
          onClick={onAddDevice}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs hover:-translate-y-0.5"
        >
          <Plus size={16} className="text-white stroke-[2.5]" />
          <span>Device Baru</span>
        </button>
      </div>
    </div>
  );
};

export default DeviceToolbar;
