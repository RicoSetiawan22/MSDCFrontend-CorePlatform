import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { SiteRoom } from "../../types/site";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatNumber } from "@shared/lib/format";
import { RoomTablePagination } from "./RoomTablePagination";

export type RoomItem = SiteRoom & {
  site_id?: number;
  site_code?: string;
  site_name?: string;
};

interface RoomTableProps {
  rooms: RoomItem[];
  isLoading: boolean;
  onEdit: (room: RoomItem) => void;
  onDelete: (room: RoomItem) => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const ROOM_TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  server_room: {
    label: "Server Room",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  network_room: {
    label: "Network Room",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200/80",
    dot: "bg-purple-500",
  },
  ups_room: {
    label: "UPS & Power",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  other: {
    label: "Lainnya",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
  },
};

export const RoomTable: React.FC<RoomTableProps> = ({
  rooms,
  isLoading,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingState />
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Belum Ada Room"
          subtitle="Tambahkan room untuk mulai mengelola pembagian ruangan di data center."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Table Container ── */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header Strip Kuning Emas Pastel Sesuai Desain Site & Dependents */}
            <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
              <tr>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 min-w-[160px]">
                  SITE
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 w-[120px]">
                  KODE ROOM
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 min-w-[180px]">
                  NAMA ROOM
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[130px]">
                  TIPE
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[130px]">
                  LANTAI & ZONE
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-right min-w-[100px]">
                  LUAS (M²)
                </th>
                <th className="py-3.5 px-5 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[80px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => {
                const typeConfig =
                  ROOM_TYPE_CONFIG[room.room_type] ?? {
                    label: room.room_type || "Lainnya",
                    bg: "bg-slate-100",
                    text: "text-slate-600",
                    border: "border-slate-200/80",
                    dot: "bg-slate-400",
                  };

                return (
                  <tr
                    key={room.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Site Information */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 text-xs leading-snug">
                        {room.site_name ?? "—"}
                      </div>
                      {room.site_code && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {room.site_code}
                        </div>
                      )}
                    </td>

                    {/* Kode Room */}
                    <td className="py-3.5 px-5 font-mono text-xs font-bold text-slate-800">
                      {room.room_code}
                    </td>

                    {/* Nama Room */}
                    <td className="py-3.5 px-5 font-semibold text-sm text-slate-900">
                      {room.room_name}
                    </td>

                    {/* Tipe Room Badge */}
                    <td className="py-3.5 px-5 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`}
                        />
                        <span>{typeConfig.label}</span>
                      </span>
                    </td>

                    {/* Lantai & Zone */}
                    <td className="py-3.5 px-5 text-center text-xs text-slate-600">
                      {room.floor || room.zone ? (
                        <span>
                          {room.floor ? `Lantai ${room.floor}` : "Lantai —"}{" "}
                          <span className="text-slate-300">•</span>{" "}
                          {room.zone ? `Zone ${room.zone}` : "Zone —"}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Luas */}
                    <td className="py-3.5 px-5 text-right text-xs font-semibold text-slate-700">
                      {room.area_sqm != null ? (
                        <span>{formatNumber(room.area_sqm)} m²</span>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Aksi: Icon Edit & Icon Hapus (No Detail Button) */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* 1. Edit Room */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onEdit(room)}
                            title="Edit Room"
                            aria-label={`Edit ${room.room_name}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border border-amber-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <Pencil size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Edit Room
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        </div>

                        {/* 2. Hapus Room */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onDelete(room)}
                            title="Hapus Room"
                            aria-label={`Hapus ${room.room_name}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/80 transition-all cursor-pointer shadow-xs active:scale-95"
                          >
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Hapus Room
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
      {total > 0 && (
        <RoomTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
        />
      )}
    </div>
  );
};

export default RoomTable;
