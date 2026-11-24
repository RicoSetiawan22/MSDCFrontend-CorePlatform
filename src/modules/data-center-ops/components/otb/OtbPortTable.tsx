import React from "react";
import { Link } from "react-router-dom";
import { Search, Lock, AlertTriangle, Unplug, Wrench } from "lucide-react";
import type { OtbPort, OtbPortStatus } from "../../types/otb";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { OtbTablePagination } from "./OtbTablePagination";

export interface OtbPortTableProps {
  ports: OtbPort[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onAllocate: (port: OtbPort) => void;
  onRelease: (port: OtbPort) => void;
  onMarkDamaged: (port: OtbPort) => void;
  onRepair: (port: OtbPort) => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const STATUS_CONFIG: Record<
  OtbPortStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  available: {
    label: "Available",
    bg: "bg-[#dcfce7]",
    text: "text-[#166534]",
    border: "border-emerald-200/80",
    dot: "bg-[#166534]",
  },
  allocated: {
    label: "Allocated",
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

export const OtbPortTable: React.FC<OtbPortTableProps> = ({
  ports,
  isLoading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onAllocate,
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
  return (
    <div className="mx-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
      {/* ── Toolbar: Search & Filter Status ── */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap pb-1">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            className="w-full pl-10 pr-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            placeholder="Cari nomor port..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Cari nomor port"
          />
        </div>

        <div className="w-full sm:w-[170px]">
          <select
            className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            aria-label="Filter berdasarkan Status"
          >
            <option value="">Semua Status</option>
            <option value="available">Available</option>
            <option value="allocated">Allocated</option>
            <option value="damaged">Damaged</option>
          </select>
        </div>
      </div>

      {/* ── Loading & Empty States (React UI Patterns) ── */}
      {isLoading && ports.length === 0 && (
        <div className="py-12">
          <LoadingState />
        </div>
      )}

      {!isLoading && ports.length === 0 && (
        <div className="py-8">
          <EmptyState
            title="Tidak Ada Port Cocok"
            subtitle="Coba ubah kata kunci pencarian atau sesuaikan filter status."
          />
        </div>
      )}

      {ports.length > 0 && (
        <>
          {/* ── Table Container ── */}
          <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                {/* Header Strip Kuning Emas Pastel Sesuai Desain MSDC */}
                <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
                  <tr>
                    <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[100px]">
                      PORT
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[130px]">
                      STATUS
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[160px]">
                      CUSTOMER
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[150px]">
                      KONTRAK
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[170px]">
                      TGL ALOKASI
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[130px]">
                      AKSI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ports.map((port) => {
                    const statusBadge = STATUS_CONFIG[port.status] ?? STATUS_CONFIG.available;

                    return (
                      <tr
                        key={port.id}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Port Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                          #{port.port_number}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* Customer */}
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {port.customer?.company_name ?? "—"}
                        </td>

                        {/* Kontrak */}
                        <td className="py-3.5 px-4">
                          {port.contract_service ? (
                            <Link
                              to={`/crm-sales/contracts/${port.contract_service.contract_id}`}
                              className="font-mono text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              Lihat Contract
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Tanggal Alokasi */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-xs">
                          {port.allocated_date ?? "—"}
                        </td>

                        {/* Kolom Aksi */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Aksi 1: Port Available -> Alokasikan (Icon Plug/Connected) */}
                            {port.status === "available" && (
                              <div className="relative group/tooltip inline-flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => onAllocate(port)}
                                  title="Alokasikan Port"
                                  aria-label={`Alokasikan port #${port.port_number}`}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <Unplug size={13} strokeWidth={2.2} />
                                </button>
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                                  <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                                    Alokasikan
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                                </div>
                              </div>
                            )}

                            {/* Aksi 2: Port Allocated -> Lepas Alokasi (Icon Lock Biru) */}
                            {port.status === "allocated" && (
                              <div className="relative group/tooltip inline-flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => onRelease(port)}
                                  title="Lepas Alokasi Port"
                                  aria-label={`Lepas alokasi port #${port.port_number}`}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <Lock size={13} strokeWidth={2.2} />
                                </button>
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                                  <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-blue-600 rounded-md shadow-lg whitespace-nowrap">
                                    Lepas Alokasi
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-blue-600 rotate-45 mx-auto -mt-1" />
                                </div>
                              </div>
                            )}

                            {/* Aksi 3: Port Belum Damaged -> Tandai Rusak (Icon Alert Merah) */}
                            {port.status !== "damaged" && (
                              <div className="relative group/tooltip inline-flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => onMarkDamaged(port)}
                                  title="Tandai Port Rusak"
                                  aria-label={`Tandai port #${port.port_number} rusak`}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <AlertTriangle size={13} strokeWidth={2.2} />
                                </button>
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                                  <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 rounded-md shadow-lg whitespace-nowrap">
                                    Tandai Rusak
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-rose-600 rotate-45 mx-auto -mt-1" />
                                </div>
                              </div>
                            )}

                            {/* Aksi 4: Port Damaged -> Perbaiki (Icon Wrench Hijau) */}
                            {port.status === "damaged" && (
                              <div className="relative group/tooltip inline-flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => onRepair(port)}
                                  title="Tandai Sudah Diperbaiki"
                                  aria-label={`Tandai port #${port.port_number} sudah diperbaiki`}
                                  className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                                >
                                  <Wrench size={13} strokeWidth={2.2} />
                                </button>
                                <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                                  <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-emerald-600 rounded-md shadow-lg whitespace-nowrap">
                                    Selesai Perbaikan
                                  </div>
                                  <div className="w-1.5 h-1.5 bg-emerald-600 rotate-45 mx-auto -mt-1" />
                                </div>
                              </div>
                            )}
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
            <OtbTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              perPage={perPage}
              perPageOptions={[15, 30, 50]}
              onPageChange={onPageChange}
              onPerPageChange={onPerPageChange}
            />
          ) : null}
        </>
      )}
    </div>
  );
};

export default OtbPortTable;
