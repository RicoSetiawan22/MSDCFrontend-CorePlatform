import { Search, Plus } from "lucide-react";
import { Button } from "@shared/components/Button";
import type { VendorStatus, TaxStatus } from "../../types/vendor";

const STATUS_LABEL: Record<VendorStatus, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
  blacklisted: "Blacklist",
};

const TAX_STATUS_LABEL: Record<TaxStatus, string> = {
  pkp: "PKP (Kena PPN)",
  non_pkp: "Non-PKP",
  pemungut: "Pemungut PPN",
};

interface VendorToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: VendorStatus | "") => void;
  taxFilter: string;
  onTaxFilterChange: (val: TaxStatus | "") => void;
  onAddVendor: () => void;
  totalDisplayCount?: number;
}

export function VendorToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  taxFilter,
  onTaxFilterChange,
  onAddVendor,
  totalDisplayCount = 0,
}: VendorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Input Search */}
      <div className="relative flex-1 min-w-[260px]">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          placeholder="Cari nama, NPWP, atau kode vendor..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Status */}
      <select
        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-all min-w-[140px]"
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as VendorStatus | "")}
      >
        <option value="">Semua Status</option>
        {Object.entries(STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Filter Pajak */}
      <select
        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-blue-500 transition-all min-w-[140px]"
        value={taxFilter}
        onChange={(e) => onTaxFilterChange(e.target.value as TaxStatus | "")}
      >
        <option value="">Semua Pajak</option>
        {Object.entries(TAX_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {/* Teks Jumlah Vendor & Tombol Tambah */}
      <div className="flex items-center gap-4 ml-auto">
        <span className="text-xs text-slate-500">
          Menampilkan <strong className="text-slate-800">{totalDisplayCount}</strong> vendor
        </span>

        <Button
          onClick={onAddVendor}
          className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-xl flex items-center gap-2 text-sm shadow-sm transition-all"
        >
          <Plus size={16} /> Vendor Baru
        </Button>
      </div>
    </div>
  );
}