import React from "react";
import { Search } from "lucide-react";

export interface WorkOrderToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  progressFilter: string;
  onProgressFilterChange: (value: string) => void;
  serviceFilter: string;
  onServiceFilterChange: (value: string) => void;
  totalWorkOrders: number;
}

export const WorkOrderToolbar: React.FC<WorkOrderToolbarProps> = ({
  search,
  onSearchChange,
  progressFilter,
  onProgressFilterChange,
  serviceFilter,
  onServiceFilterChange,
  totalWorkOrders,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-1">
      {/* ── Sisi Kiri: Search Input & Filter Dropdowns ── */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="relative min-w-[240px] sm:min-w-[280px] flex-1 sm:flex-none">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Cari No. SO, Customer, Kontrak..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Progres */}
        <select
          value={progressFilter}
          onChange={(e) => onProgressFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
        >
          <option value="">Semua Progres</option>
          <option value="unstarted">Belum Dikerjakan (0%)</option>
          <option value="in_progress">Dalam Pengerjaan (1-99%)</option>
          <option value="ready_testing">Siap Testing (Layanan Selesai)</option>
        </select>

        {/* Filter Layanan */}
        <select
          value={serviceFilter}
          onChange={(e) => onServiceFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
        >
          <option value="">Semua Tipe Layanan</option>
          <option value="colocation">Colocation (Rack)</option>
          <option value="bandwidth">Bandwidth (Internet)</option>
          <option value="cross_connect">Cross-Connect</option>
          <option value="dedicated_server">Dedicated Server</option>
        </select>
      </div>

      {/* ── Sisi Kanan: Total Count Indicator ── */}
      <div className="flex items-center gap-2 self-start md:self-center text-xs text-slate-500">
        <span>Menampilkan:</span>
        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-mono text-[0.75rem]">
          {totalWorkOrders} SO
        </span>
      </div>
    </div>
  );
};

export default WorkOrderToolbar;
