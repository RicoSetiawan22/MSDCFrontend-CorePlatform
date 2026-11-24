import React from "react";
import { Link } from "react-router-dom";
import { Eye, AlertCircle, RotateCw } from "lucide-react";
import type { Otb, OtbStatus } from "../../types/otb";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { OtbTablePagination } from "./OtbTablePagination";

export interface OtbTableProps {
  otbs: Otb[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const STATUS_CONFIG: Record<
  OtbStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Aktif",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  inactive: {
    label: "Nonaktif",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
  },
};

export const OtbTable: React.FC<OtbTableProps> = ({
  otbs,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  // Hanya tampilkan loading jika belum ada data sama sekali (React UI Patterns: No stale flicker)
  if (isLoading && otbs.length === 0) {
    return (
      <div className="py-12">
        <LoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Gagal Memuat Data</h3>
        <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
          {errorMessage || "Terjadi kendala komunikasi dengan server. Periksa hak akses atau koneksi jaringan Anda."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCw size={13} />
            <span>Coba Muat Ulang</span>
          </button>
        )}
      </div>
    );
  }

  // Tampilkan EmptyState jika data kosong dan tidak sedang loading awal
  if (!isLoading && !isError && otbs.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Belum Ada OTB"
          subtitle="Buat OTB baru dengan jumlah port-nya — semua port individual otomatis dibuat sekaligus."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Table Container ── */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header Strip Kuning Emas Pastel Sesuai Desain MSDC */}
            <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[140px]">
                  TAG
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[180px]">
                  LOKASI
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[140px]">
                  KAPASITAS PORT
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[130px]">
                  TERPAKAI
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[110px]">
                  RUSAK
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[120px]">
                  STATUS
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[130px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {otbs.map((otb) => {
                const statusBadge = STATUS_CONFIG[otb.status] ?? STATUS_CONFIG.active;
                const used = otb.allocated_ports_count ?? 0;
                const damaged = otb.damaged_ports_count ?? 0;

                return (
                  <tr
                    key={otb.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Tag Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {otb.tag_number}
                    </td>

                    {/* Lokasi */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {otb.location ?? "—"}
                    </td>

                    {/* Kapasitas Port */}
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {otb.port_count} port
                    </td>

                    {/* Terpakai */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold text-slate-800">{used}</span>
                      <span className="text-slate-400"> / {otb.port_count}</span>
                    </td>

                    {/* Rusak */}
                    <td className="py-3.5 px-4">
                      {damaged > 0 ? (
                        <span className="font-bold text-rose-600">{damaged}</span>
                      ) : (
                        <span className="text-slate-500 font-medium">0</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                        {statusBadge.label}
                      </span>
                    </td>

                    {/* Kolom Aksi: Tombol Icon + Text 'Kelola Port' */}
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/dc/otbs/${otb.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-95"
                        title={`Kelola port OTB ${otb.tag_number}`}
                      >
                        <Eye size={13} className="text-slate-500 stroke-[2.2]" />
                        <span>Kelola Port</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Kontrol Paginasi Terpusat (Centered Sesuai Desain RackTable) ── */}
      {total > 0 ? (
        <OtbTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      ) : null}
    </div>
  );
};

export default OtbTable;
