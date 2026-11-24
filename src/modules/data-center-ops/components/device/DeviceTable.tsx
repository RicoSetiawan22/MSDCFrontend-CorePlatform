import React from "react";
import { Eye, Pencil, ArrowRightLeft, Trash2, Zap, AlertCircle, RotateCw } from "lucide-react";
import type { Device, DeviceType, DeviceStatus } from "../../types/device";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { DeviceTablePagination } from "./DeviceTablePagination";

export interface DeviceTableProps {
  devices: Device[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  sitesMap: Map<number, { site_name: string; site_code: string }>;
  roomsMap?: Map<number, { room_name: string; room_code: string }>;
  racksMap: Map<number, { rack_name?: string; rack_code: string; site_room_id?: number }>;
  onDetail?: (device: Device) => void;
  onEdit: (device: Device) => void;
  onMove: (device: Device) => void;
  onDelete: (device: Device) => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

const TYPE_CONFIG: Record<
  DeviceType,
  { label: string; bg: string; text: string; border: string }
> = {
  server: { label: "Server", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/80" },
  storage: { label: "Storage", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200/80" },
  switch: { label: "Switch", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200/80" },
  router: { label: "Router", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200/80" },
  firewall: { label: "Firewall", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200/80" },
  ups: { label: "UPS", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/80" },
  pdu: { label: "PDU", bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200/80" },
  other: { label: "Lainnya", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200/80" },
};

const STATUS_CONFIG: Record<
  DeviceStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Aktif",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  spare: {
    label: "Spare",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200/80",
    dot: "bg-orange-500",
  },
  decommissioned: {
    label: "Didecommission",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200/80",
    dot: "bg-slate-400",
  },
};

export const DeviceTable: React.FC<DeviceTableProps> = ({
  devices,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  sitesMap,
  roomsMap,
  racksMap,
  onDetail,
  onEdit,
  onMove,
  onDelete,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
}) => {
  if (isLoading && devices.length === 0) {
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

  if (!isLoading && !isError && devices.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          title="Belum Ada Perangkat"
          subtitle="Tambahkan perangkat inventori baru untuk mulai mencatat server, switch, storage, dan alokasi U di data center."
        />
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="flex flex-col gap-4">
      {/* ── Table Container ── */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Header Strip Kuning Emas Pastel Sesuai Desain MSDC */}
            <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[130px]">
                  KODE
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[200px]">
                  DEVICE &amp; SPESIFIKASI
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 w-[100px]">
                  TIPE
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[210px]">
                  LOKASI FISIK
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-right min-w-[95px]">
                  DAYA
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[130px]">
                  SERIAL NUMBER
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center w-[120px]">
                  STATUS
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 min-w-[120px]">
                  GARANSI
                </th>
                <th className="py-3.5 px-4 text-xs font-bold tracking-wider text-slate-700 text-center min-w-[140px]">
                  AKSI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devices.map((device) => {
                const typeConfig = TYPE_CONFIG[device.device_type] ?? TYPE_CONFIG.other;
                const statusConfig = STATUS_CONFIG[device.status] ?? STATUS_CONFIG.active;

                // Lookup Site
                const siteObj = device.site_id ? sitesMap.get(device.site_id) : undefined;
                const siteLabel = siteObj
                  ? `${siteObj.site_code} — ${siteObj.site_name}`
                  : device.site?.site_code
                  ? `${device.site.site_code} — ${device.site.site_name}`
                  : null;

                // Lookup Rack
                const rackObj = device.rack_id ? racksMap.get(device.rack_id) : undefined;
                const rackLabel = rackObj
                  ? `${rackObj.rack_code}${rackObj.rack_name ? ` (${rackObj.rack_name})` : ""}`
                  : device.rack?.rack_code
                  ? device.rack.rack_code
                  : null;

                // Lookup Room
                const roomObj = device.site_room_id && roomsMap ? roomsMap.get(device.site_room_id) : undefined;
                const roomLabel = roomObj ? `${roomObj.room_code} — ${roomObj.room_name}` : null;

                // Format Posisi U
                let uPositionText: string | null = null;
                if (device.rack_position_u) {
                  if (device.rack_position_u_end && device.rack_position_u_end !== device.rack_position_u) {
                    uPositionText = `U${device.rack_position_u} - U${device.rack_position_u_end}`;
                  } else {
                    uPositionText = `U${device.rack_position_u}`;
                  }
                }

                // Cek Garansi
                let isExpired = false;
                let isExpiringSoon = false;
                if (device.warranty_expiry) {
                  const expDate = new Date(device.warranty_expiry);
                  if (expDate < now) {
                    isExpired = true;
                  } else {
                    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 90) {
                      isExpiringSoon = true;
                    }
                  }
                }

                return (
                  <tr
                    key={device.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    {/* Kode Perangkat */}
                    <td className="py-3.5 px-4">
                      {onDetail ? (
                        <button
                          type="button"
                          onClick={() => onDetail(device)}
                          className="font-mono text-xs font-bold text-slate-800 hover:text-amber-600 hover:underline tracking-tight text-left cursor-pointer transition-colors"
                          title="Lihat detail perangkat"
                        >
                          {device.device_code}
                        </button>
                      ) : (
                        <span className="font-mono text-xs font-bold text-slate-800 tracking-tight">
                          {device.device_code}
                        </span>
                      )}
                    </td>

                    {/* Nama Device & Spesifikasi */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-900 text-xs leading-snug">
                          {device.device_name}
                        </span>
                        {(device.manufacturer || device.model) ? (
                          <span className="text-[11px] text-slate-500 font-medium">
                            {[device.manufacturer, device.model].filter(Boolean).join(" • ")}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Tipe Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
                      >
                        {typeConfig.label}
                      </span>
                    </td>

                    {/* Lokasi Fisik */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        {siteLabel ? (
                          <div className="font-semibold text-slate-800 text-xs truncate max-w-[220px]" title={siteLabel}>
                            {siteLabel}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Tanpa site</span>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                          {roomLabel ? (
                            <span className="text-slate-600 font-medium">{roomLabel}</span>
                          ) : null}

                          {rackLabel ? (
                            <span className="text-slate-700 font-medium inline-flex items-center gap-1">
                              {roomLabel ? <span className="text-slate-300">•</span> : null}
                              <strong className="text-slate-900">{rackLabel}</strong>
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">
                              Tanpa Rack / Gudang
                            </span>
                          )}

                          {uPositionText ? (
                            <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                              {uPositionText}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Daya (Watt) */}
                    <td className="py-3.5 px-4 text-right">
                      {device.power_watt !== null && device.power_watt !== undefined ? (
                        <div className="inline-flex items-center justify-end gap-1 font-semibold text-slate-800">
                          <Zap size={11} className="text-amber-500" />
                          <span>{Number(device.power_watt).toLocaleString("id-ID")} W</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Serial Number */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      {device.serial_number || <span className="text-slate-400 font-sans">—</span>}
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

                    {/* Garansi */}
                    <td className="py-3.5 px-4">
                      {device.warranty_expiry ? (
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`text-xs font-medium ${
                              isExpired
                                ? "text-rose-600 font-semibold"
                                : isExpiringSoon
                                ? "text-amber-600 font-semibold"
                                : "text-slate-700"
                            }`}
                          >
                            {formatDate(device.warranty_expiry)}
                          </span>
                          {isExpired ? (
                            <span className="text-[10px] text-rose-500 inline-flex items-center gap-0.5">
                              <AlertCircle size={10} /> Expired
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="text-[10px] text-amber-500">
                              Segera habis
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">—</span>
                      )}
                    </td>

                    {/* Aksi: Detail + Edit + Pindahkan + Hapus */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        {/* 0. Tombol Detail */}
                        {onDetail ? (
                          <div className="relative group/tooltip inline-flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => onDetail(device)}
                              title="Lihat Detail"
                              aria-label={`Lihat detail perangkat ${device.device_code}`}
                              className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                            >
                              <Eye size={13} strokeWidth={2.2} />
                            </button>
                            <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                              <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                                Detail
                              </div>
                              <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                            </div>
                          </div>
                        ) : null}

                        {/* 1. Tombol Edit */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onEdit(device)}
                            title="Edit Perangkat"
                            aria-label={`Edit perangkat ${device.device_code}`}
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

                        {/* 2. Tombol Pindahkan (Relocate) */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onMove(device)}
                            title="Pindahkan Lokasi"
                            aria-label={`Pindahkan lokasi perangkat ${device.device_code}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <ArrowRightLeft size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-slate-900 rounded-md shadow-lg whitespace-nowrap">
                              Pindahkan
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-1" />
                          </div>
                        </div>

                        {/* 3. Tombol Hapus */}
                        <div className="relative group/tooltip inline-flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => onDelete(device)}
                            title="Hapus Perangkat"
                            aria-label={`Hapus perangkat ${device.device_code}`}
                            className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 border border-rose-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
                          >
                            <Trash2 size={13} strokeWidth={2.2} />
                          </button>
                          <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
                            <div className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 rounded-md shadow-lg whitespace-nowrap">
                              Hapus
                            </div>
                            <div className="w-1.5 h-1.5 bg-rose-600 rotate-45 mx-auto -mt-1" />
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

      {/* ── Kontrol Paginasi Terpusat (Centered Sesuai Desain RackTable) ── */}
      {total > 0 ? (
        <DeviceTablePagination
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

export default DeviceTable;
