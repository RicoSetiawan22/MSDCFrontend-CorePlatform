import React from "react";
import { LayoutGrid, Eye, Trash2, AlertCircle, RotateCw } from "lucide-react";
import type { Rack } from "../../types/rack";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { RackTablePagination } from "./RackTablePagination";

export interface RackTableProps {
  racks: Rack[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onViewSlots: (rack: Rack) => void;
  onDetail: (rack: Rack) => void;
  onDelete: (rack: Rack) => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const RACK_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Active",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  reserved: {
    label: "Reserved",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200/80",
    dot: "bg-orange-500",
  },
  decommissioned: {
    label: "Decommissioned",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
  },
};

export const RackTable: React.FC<RackTableProps> = ({
  racks,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onViewSlots,
  onDetail,
  onDelete,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  if (isLoading && racks.length === 0) {
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

  if (!isLoading && !isError && racks.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Belum Ada Rack"
          subtitle="Tambahkan rack inventory untuk mulai mengelola kapasitas U dan daya di ruangan server."
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
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[100px]">
                  KODE
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[200px]">
                  SITE / ROOM
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[150px]">
                  NAMA RACK
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[90px]">
                  TOTAL U
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[90px]">
                  SISA U
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-right min-w-[120px]">
                  KAPASITAS DAYA
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-right min-w-[110px]">
                  SISA DAYA
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[120px]">
                  STATUS
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[170px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {racks.map((rack) => {
                const statusConfig =
                  RACK_STATUS_CONFIG[rack.status] ?? {
                    label: rack.status || "Unknown",
                    bg: "bg-slate-100",
                    text: "text-slate-600",
                    border: "border-slate-200/80",
                    dot: "bg-slate-400",
                  };

                const room = rack.site_room;
                const site = room?.site;
                const freeU = rack.free_u;
                const freeWatt = rack.free_watt;

                return (
                  <tr
                    key={rack.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Kode Rack */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onDetail(rack)}
                        className="font-mono text-xs font-bold text-slate-800 hover:text-amber-600 transition-colors cursor-pointer text-left"
                        title="Buka Detail Rack"
                      >
                        {rack.rack_code}
                      </button>
                    </td>

                    {/* Site / Room (3 Baris Hirarki) */}
                    <td className="py-3.5 px-4">
                      {room ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="font-semibold text-slate-900 text-xs leading-snug">
                            {site?.site_code ? (
                              <span>
                                {site.site_code}{" "}
                                <span className="font-normal text-slate-500">
                                  — {site.site_name}
                                </span>
                              </span>
                            ) : (
                              site?.site_name ?? "—"
                            )}
                          </div>
                          <div className="text-xs text-slate-600 font-medium">
                            {room.room_code} — {room.room_name}
                          </div>
                          {room.floor || room.zone ? (
                            <div className="text-[11px] text-slate-400">
                              {room.floor ? `Lantai ${room.floor}` : "Lantai —"}{" "}
                              <span className="text-slate-300">•</span>{" "}
                              {room.zone ? `Zone ${room.zone}` : "Zone —"}
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Nama Rack */}
                    <td className="py-3.5 px-4 font-medium text-xs text-slate-800">
                      {rack.rack_name || "—"}
                    </td>

                    {/* Total U */}
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                      {rack.total_u} U
                    </td>

                    {/* Sisa U */}
                    <td className="py-3.5 px-4 text-center text-xs font-bold">
                      {freeU !== undefined ? (
                        <span
                          className={
                            freeU <= 0
                              ? "text-rose-600"
                              : "text-emerald-700"
                          }
                        >
                          {freeU} U
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Kapasitas Daya */}
                    <td className="py-3.5 px-4 text-right text-xs font-semibold text-slate-700">
                      {rack.power_capacity_watt
                        ? `${Number(rack.power_capacity_watt).toLocaleString("id-ID")} W`
                        : "—"}
                    </td>

                    {/* Sisa Daya */}
                    <td className="py-3.5 px-4 text-right text-xs font-semibold">
                      {rack.power_capacity_watt && freeWatt !== undefined && freeWatt !== null ? (
                        <span
                          className={
                            freeWatt <= 0
                              ? "text-rose-600 font-bold"
                              : "text-slate-700"
                          }
                        >
                          {Number(freeWatt).toLocaleString("id-ID")} W
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                        />
                        <span>{statusConfig.label}</span>
                      </span>
                    </td>

                    {/* Aksi: Lihat Slot + Detail + Hapus */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* 1. Tombol Lihat Slot */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onViewSlots(rack)}
                            title="Lihat Slot"
                            aria-label={`Lihat slot rack ${rack.rack_code}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <LayoutGrid size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Lihat Slot
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        </div>

                        {/* 2. Tombol Detail */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onDetail(rack)}
                            title="Detail Rack"
                            aria-label={`Detail rack ${rack.rack_code}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Eye size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Detail Rack
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        </div>

                        {/* 3. Tombol Hapus */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onDelete(rack)}
                            title="Hapus Rack"
                            aria-label={`Hapus rack ${rack.rack_code}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Hapus Rack
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination di Bagian Bawah ── */}
      {total > 0 ? (
        <RackTablePagination
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

export default RackTable;
