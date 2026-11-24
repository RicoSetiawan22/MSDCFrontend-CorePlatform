import React from "react";
import { Link } from "react-router-dom";
import { Pencil, Lock, Unlock, AlertTriangle, Wrench, AlertCircle, RotateCw } from "lucide-react";
import type { CrossConnect, CrossConnectStatus } from "../../types/crossConnect";
import { CABLE_TYPE_LABELS } from "./CrossConnectToolbar";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { CrossConnectTablePagination } from "./CrossConnectTablePagination";

export interface CrossConnectTableProps {
  cables: CrossConnect[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onEdit: (cc: CrossConnect) => void;
  onLock: (cc: CrossConnect) => void;
  onRelease: (cc: CrossConnect) => void;
  onMarkDamaged: (cc: CrossConnect) => void;
  onRepair: (cc: CrossConnect) => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const STATUS_CONFIG: Record<
  CrossConnectStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  available: {
    label: "Available",
    bg: "bg-[#dcfce7]",
    text: "text-[#166534]",
    border: "border-emerald-200/80",
    dot: "bg-[#166534]",
  },
  active: {
    label: "Active",
    bg: "bg-[#dbeafe]",
    text: "text-[#1d4ed8]",
    border: "border-blue-200/80",
    dot: "bg-[#1d4ed8]",
  },
  damaged: {
    label: "Damaged",
    bg: "bg-[#fee2e2]",
    text: "text-[#991b1b]",
    border: "border-rose-200/80",
    dot: "bg-[#991b1b]",
  },
};

export const CrossConnectTable: React.FC<CrossConnectTableProps> = ({
  cables,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onEdit,
  onLock,
  onRelease,
  onMarkDamaged,
  onRepair,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  // Hanya tampilkan loading jika belum ada data sama sekali (React UI Patterns: No stale flicker)
  if (isLoading && cables.length === 0) {
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
  if (!isLoading && !isError && cables.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Belum Ada Cross-Connect"
          subtitle="Kabel cross-connect yang didaftarkan akan muncul di sini. Klik tombol '+ Kabel Baru' untuk menambahkan."
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
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[110px]">
                  TAG
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[140px]">
                  TIPE KABEL
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[150px]">
                  SUMBER
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[160px]">
                  TUJUAN
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[140px]">
                  CUSTOMER
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[160px]">
                  KONTRAK
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[120px]">
                  STATUS
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[140px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cables.map((cc) => {
                const statusBadge = STATUS_CONFIG[cc.status] ?? STATUS_CONFIG.available;
                const cableTypeLabel = CABLE_TYPE_LABELS[cc.cable_type] ?? cc.cable_type;

                return (
                  <tr
                    key={cc.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Tag Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                      {cc.tag_number ?? "—"}
                    </td>

                    {/* Tipe Kabel */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {cableTypeLabel}
                    </td>

                    {/* Sumber */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span>{cc.source_location ?? "—"}</span>
                      {cc.source_port ? (
                        <span className="text-slate-400"> · Port {cc.source_port}</span>
                      ) : null}
                    </td>

                    {/* Tujuan */}
                    <td className="py-3.5 px-4">
                      {cc.destination_otb_port ? (
                        <span className="font-mono text-slate-700">
                          {cc.destination_otb_port.otb?.tag_number ?? `OTB #${cc.destination_otb_port.otb_id}`}
                          <span className="text-slate-400"> · Port {cc.destination_otb_port.port_number}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          {cc.destination_location ?? "—"}
                          {cc.destination_port ? (
                            <span className="text-slate-400"> · Port {cc.destination_port}</span>
                          ) : null}
                        </span>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {cc.customer?.company_name ?? "—"}
                    </td>

                    {/* Kontrak (BATASAN KETAT: Rute Link Tidak Boleh Berubah) */}
                    <td className="py-3.5 px-4">
                      {cc.contract ? (
                        <Link
                          to={`/crm-sales/contracts/${cc.contract.id}`}
                          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {cc.contract.contract_number}
                        </Link>
                      ) : cc.contract_service ? (
                        <Link
                          to={`/crm-sales/contracts/${cc.contract_service.contract_id}`}
                          className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          Lihat Contract
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
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

                    {/* Kolom Aksi dengan Tombol Icon & Tooltip */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Tombol Edit */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onEdit(cc)}
                            title="Edit Kabel"
                            aria-label={`Edit kabel ${cc.tag_number ?? `#${cc.id}`}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Pencil size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Edit
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        </div>

                        {/* 2. Tombol Lock (Jika available) */}
                        {cc.status === "available" ? (
                          <div className="relative group/tooltip inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onLock(cc)}
                              title="Pasang / Kunci (Active)"
                              aria-label={`Pasang / kunci kabel ${cc.tag_number ?? `#${cc.id}`}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Lock size={13} strokeWidth={2.2} />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-blue-600 rounded-md shadow-lg whitespace-nowrap">
                                Pasang / Kunci
                              </div>
                              <div className="w-1.5 h-1.5 bg-blue-600 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        ) : null}

                        {/* 3. Tombol Release (Jika active) */}
                        {cc.status === "active" ? (
                          <div className="relative group/tooltip inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onRelease(cc)}
                              title="Lepas (Kembali ke Stok)"
                              aria-label={`Lepas kabel ${cc.tag_number ?? `#${cc.id}`}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Unlock size={13} strokeWidth={2.2} />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-md shadow-lg whitespace-nowrap">
                                Lepas Kabel
                              </div>
                              <div className="w-1.5 h-1.5 bg-emerald-600 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        ) : null}

                        {/* 4. Tombol Mark Damaged (Jika belum damaged) */}
                        {cc.status !== "damaged" ? (
                          <div className="relative group/tooltip inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onMarkDamaged(cc)}
                              title="Tandai Rusak"
                              aria-label={`Tandai kabel rusak ${cc.tag_number ?? `#${cc.id}`}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border border-amber-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <AlertTriangle size={13} strokeWidth={2.2} />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-amber-600 rounded-md shadow-lg whitespace-nowrap">
                                Tandai Rusak
                              </div>
                              <div className="w-1.5 h-1.5 bg-amber-600 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        ) : null}

                        {/* 5. Tombol Repair (Jika damaged) */}
                        {cc.status === "damaged" ? (
                          <div className="relative group/tooltip inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onRepair(cc)}
                              title="Tandai Diperbaiki"
                              aria-label={`Tandai kabel diperbaiki ${cc.tag_number ?? `#${cc.id}`}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Wrench size={13} strokeWidth={2.2} />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-md shadow-lg whitespace-nowrap">
                                Selesai Diperbaiki
                              </div>
                              <div className="w-1.5 h-1.5 bg-emerald-600 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        ) : null}
                      </div>
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
        <CrossConnectTablePagination
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

export default CrossConnectTable;
