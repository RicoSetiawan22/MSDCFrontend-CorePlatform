import React from "react";
import { Search, Plus } from "lucide-react";
import { DOCUMENT_STATUS_LABELS } from "@modules/document-management/types/document";

export interface SuratDcOpsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  availableTypes?: { code: string; label: string }[];
  totalDocuments: number;
  canCreate?: boolean;
  onNewDocument: () => void;
}

export const SuratDcOpsToolbar: React.FC<SuratDcOpsToolbarProps> = ({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  availableTypes = [],
  totalDocuments,
  canCreate = true,
  onNewDocument,
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
            placeholder="Cari No. Surat, Judul, Penerima..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all shadow-2xs"
          />
        </div>

        {/* Filter Jenis Dokumen */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs max-w-[200px]"
        >
          <option value="">Semua Jenis Surat</option>
          {availableTypes.map((t) => (
            <option key={t.code} value={t.code}>
              {t.label}
            </option>
          ))}
        </select>

        {/* Filter Status Dokumen */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
        >
          <option value="">Semua Status</option>
          {Object.entries(DOCUMENT_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Sisi Kanan: Counter Total & Tombol Tambah Surat ── */}
      <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-2xs">
          Total: <strong className="text-slate-800 font-bold">{totalDocuments}</strong> Dokumen
        </span>

        {canCreate && (
          <button
            type="button"
            onClick={onNewDocument}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E59B00] hover:bg-[#d48f00] text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>Surat Baru</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SuratDcOpsToolbar;
