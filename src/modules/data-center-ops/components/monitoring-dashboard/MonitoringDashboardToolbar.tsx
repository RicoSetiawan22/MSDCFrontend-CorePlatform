import React from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import type { Site } from "../../types/site";

export type StatusConditionFilter = "all" | "normal" | "warning" | "critical";

interface MonitoringDashboardToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  siteFilter: string;
  onSiteFilterChange: (value: string) => void;
  statusFilter: StatusConditionFilter;
  onStatusFilterChange: (status: StatusConditionFilter) => void;
  sites: Site[];
  onRefresh: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
  totalFilteredRacks: number;
  conditionCounts: {
    all: number;
    normal: number;
    warning: number;
    critical: number;
  };
}

export const MonitoringDashboardToolbar: React.FC<MonitoringDashboardToolbarProps> = ({
  search,
  onSearchChange,
  siteFilter,
  onSiteFilterChange,
  statusFilter,
  onStatusFilterChange,
  sites,
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  totalFilteredRacks,
  conditionCounts,
}) => {
  return (
    <div className="flex flex-col gap-3.5 pb-2 border-b border-slate-100">
      {/* ── Baris 1: Search Input, Filter Site, & Refresh Button ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Kiri: Search Input & Dropdown Site */}
        <div className="flex items-center gap-3 flex-1 flex-wrap sm:flex-nowrap">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all"
              placeholder="Cari kode rak, ruangan, atau site..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filter Lokasi Site */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <Filter size={16} className="text-slate-400 shrink-0 hidden sm:inline" />
            <select
              className="w-full sm:w-[180px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2140]/10 focus:border-[#0A2140] transition-all cursor-pointer"
              value={siteFilter}
              onChange={(e) => onSiteFilterChange(e.target.value)}
            >
              <option value="">Semua Lokasi Site</option>
              {sites.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.site_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kanan: Refresh Button & Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          {lastUpdated && (
            <span className="text-xs text-slate-400 hidden md:inline">
              Update: {lastUpdated}
            </span>
          )}

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            title="Refresh Data Telemetri"
          >
            <RefreshCw
              size={15}
              className={`${isRefreshing ? "animate-spin text-[#E59B00]" : "text-slate-600"}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Baris 2: Filter Pills Kondisi (Semua, Normal, Warning, Critical) & Counter ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-white text-[#0A2140] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({conditionCounts.all})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("normal")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "normal"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "normal" ? "bg-white" : "bg-emerald-500"}`} />
            Normal ({conditionCounts.normal})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("warning")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "warning"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-amber-700 hover:bg-amber-50"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "warning" ? "bg-white" : "bg-amber-500"}`} />
            Warning ({conditionCounts.warning})
          </button>

          <button
            type="button"
            onClick={() => onStatusFilterChange("critical")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "critical"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-700 hover:bg-rose-50"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === "critical" ? "bg-white" : "bg-rose-500"}`} />
            Critical ({conditionCounts.critical})
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-[#0A2140]">{totalFilteredRacks}</strong> unit rak
        </span>
      </div>
    </div>
  );
};

export default MonitoringDashboardToolbar;
