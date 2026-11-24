import React from "react";
import { Search, Plus, QrCode, Filter, Send } from "lucide-react";
import { Link } from "react-router-dom";

interface VisitorPassToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAddVisitor?: () => void;
  totalItems?: number;
}

export const VisitorPassToolbar: React.FC<VisitorPassToolbarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalItems,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1">
      {/* ── Sisi Kiri: Input Pencarian & Dropdown Status ── */}
      <div className="flex items-center gap-2.5 flex-1 max-w-xl flex-wrap sm:flex-nowrap">
        {/* Input Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            placeholder="Cari tiket, nama tamu, instansi, atau no KTP..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full sm:w-auto relative">
          <select
            aria-label="Filter status izin"
            className="w-full sm:w-[170px] pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer shadow-2xs"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">Semua Status</option>
            <option value="pending_registration">Menunggu Registrasi</option>
            <option value="scheduled">Terjadwal</option>
            <option value="active_in_facility">Aktif di Fasilitas</option>
            <option value="overstayed">Overstay Alert</option>
            <option value="completed">Selesai (Check-Out)</option>
            <option value="cancelled">Dibatalkan</option>
            <option value="expired">Kedaluwarsa</option>
          </select>
          <Filter
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </div>

      {/* ── Sisi Kanan: Scanner Pos Jaga & Tombol Aksi ── */}
      <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
        {totalItems !== undefined && (
          <span className="text-xs text-slate-500 hidden xl:inline mr-1">
            Total <strong className="text-slate-800">{totalItems}</strong> tiket
          </span>
        )}

        {/* Shortcut cepat ke Pos Jaga Scanner */}
        <Link
          to="/dc/visitor-scanner"
          title="Buka Halaman Scanner Pos Jaga Data Center"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300 rounded-lg shadow-2xs hover:shadow transition-all cursor-pointer"
        >
          <QrCode size={14} className="text-emerald-600" />
          <span>Scanner Pos Jaga</span>
        </Link>

        {/* Tombol Pendaftaran On-Site / Darurat */}
        <Link
          to="/dc/visitor-passes/create"
          title="Pendaftaran manual on-site / walk-in darurat"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs hover:shadow transition-all cursor-pointer"
        >
          <Plus size={14} className="text-slate-600" />
          <span>Pendaftaran On-Site</span>
        </Link>

        {/* Tombol Kirim Undangan Kunjungan Baru */}
        <Link
          to="/dc/visitor-passes/invite"
          title="Kirim link formulir registrasi mandiri ke PIC/Teknisi"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <Send size={14} className="text-white" />
          <span>Kirim Undangan Tamu</span>
        </Link>
      </div>
    </div>
  );
};
