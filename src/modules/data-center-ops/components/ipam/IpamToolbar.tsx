import React from "react";
import { Search, Plus } from "lucide-react";

export interface IpamToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  versionFilter: string;
  onVersionFilterChange: (value: string) => void;
  onNewSubnet: () => void;
  totalSubnets?: number;
}

export const IpamToolbar: React.FC<IpamToolbarProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  versionFilter,
  onVersionFilterChange,
  onNewSubnet,
  totalSubnets,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
      {/* ── Left Controls: Search & Filters ── */}
      <div className="flex items-center gap-2.5 flex-1 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            placeholder="Cari subnet CIDR..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari subnet CIDR"
          />
        </div>

        {/* Filter Tipe Subnet */}
        <select
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[130px]"
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          aria-label="Filter berdasarkan tipe subnet"
        >
          <option value="">Semua Tipe</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>

        {/* Filter IP Version */}
        <select
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer min-w-[120px]"
          value={versionFilter}
          onChange={(e) => onVersionFilterChange(e.target.value)}
          aria-label="Filter berdasarkan versi IP"
        >
          <option value="">Semua Versi</option>
          <option value="ipv4">IPv4</option>
          <option value="ipv6">IPv6</option>
        </select>
      </div>

      {/* ── Right Controls: Counter & Add Button ── */}
      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
        {totalSubnets !== undefined && (
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Total: <strong className="text-slate-800">{totalSubnets}</strong> subnet
          </span>
        )}

        <button
          type="button"
          onClick={onNewSubnet}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#E59B00] hover:bg-[#d48e00] active:bg-[#c28100] text-white text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer shrink-0"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Subnet Baru</span>
        </button>
      </div>
    </div>
  );
};

export default IpamToolbar;
