import React from "react";
import { Search } from "lucide-react";
import type { UsageType, UsageStatus } from "../../types/usage";

const TYPE_OPTIONS: { value: UsageType | ""; label: string }[] = [
  { value: "", label: "Semua Tipe Penggunaan" },
  { value: "rack_space", label: "Rack Space" },
  { value: "power", label: "Power" },
  { value: "bandwidth", label: "Bandwidth" },
  { value: "remote_hands", label: "Remote Hands" },
];

const STATUS_OPTIONS: { value: UsageStatus | ""; label: string }[] = [
  { value: "", label: "Semua Status Tagihan" },
  { value: "draft", label: "Draft" },
  { value: "sent_to_finance", label: "Sent to Finance" },
  { value: "billed", label: "Sudah Ditagih" },
];

export interface UsageToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  totalRecords: number;
}

export const UsageToolbar: React.FC<UsageToolbarProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  totalRecords,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-1">
      {/* ── Sisi Kiri: Search Input & Filter Dropdowns ── */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1">
        {/* Search Input */}
        <div className="relative min-w-[220px] sm:min-w-[260px] flex-1 sm:flex-none">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Cari Customer ID, Periode..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Tipe Penggunaan */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs max-w-[200px]"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Filter Status Tagihan */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Sisi Kanan: Counter Total Records ── */}
      <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
          Total: <strong className="text-slate-800 font-bold">{totalRecords}</strong> Record
        </span>
      </div>
    </div>
  );
};

export default UsageToolbar;
