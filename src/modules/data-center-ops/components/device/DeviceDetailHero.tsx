import React from "react";
import { ArrowLeft, Pencil, ArrowRightLeft, Trash2, Server } from "lucide-react";
import type { Device, DeviceStatus } from "../../types/device";

export interface DeviceDetailHeroProps {
  device: Device;
  onBack: () => void;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}

export const DeviceDetailHero: React.FC<DeviceDetailHeroProps> = ({
  device,
  onBack,
  onEdit,
  onMove,
  onDelete,
}) => {
  const getStatusBadge = (status: DeviceStatus) => {
    switch (status) {
      case "active":
        return {
          label: "AKTIF",
          className: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
          dotColor: "bg-emerald-500",
        };
      case "spare":
        return {
          label: "CADANGAN / SPARE",
          className: "bg-sky-50 text-sky-600 border-sky-200/80",
          dotColor: "bg-sky-500",
        };
      case "maintenance":
        return {
          label: "MAINTENANCE",
          className: "bg-amber-50 text-amber-700 border-amber-200/80",
          dotColor: "bg-amber-500",
        };
      case "decommissioned":
        return {
          label: "DIDECOMMISSION",
          className: "bg-slate-100 text-slate-600 border-slate-200/80",
          dotColor: "bg-slate-400",
        };
      default:
        return {
          label: status,
          className: "bg-slate-100 text-slate-600 border-slate-200",
          dotColor: "bg-slate-400",
        };
    }
  };

  const badge = getStatusBadge(device.status);

  // Lokasi penempatan teks
  const vendorModel = [device.manufacturer, device.model].filter(Boolean).join(" ");
  const siteName = device.site?.site_name ? `Site ${device.site.site_name}` : null;
  const rackSlot = device.rack?.rack_code
    ? `Rack ${device.rack.rack_code}${
        device.rack_position_u
          ? ` (Slot U${device.rack_position_u}${
              device.rack_position_u_end && device.rack_position_u_end !== device.rack_position_u
                ? `-U${device.rack_position_u_end}`
                : ""
            })`
          : ""
      }`
    : "Gudang / Tanpa Rack";

  const locationSubtitle = [vendorModel, siteName, rackSlot].filter(Boolean).join(" • ");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-5">
      {/* ── Left: Device Title, Status, Code & Hardware Location ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
            <Server size={18} />
          </div>
          <h1 className="text-2xl font-black text-[#0A2140] tracking-tight uppercase">
            {device.device_name}
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border tracking-wide ${badge.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
            <span>{badge.label}</span>
          </span>
        </div>

        <div className="text-lg font-bold text-slate-800 font-mono tracking-tight pl-12 md:pl-12">
          {device.device_code}
        </div>

        <div className="text-sm font-medium text-slate-500 pl-12 md:pl-12">
          {locationSubtitle || "Informasi lokasi belum ditentukan"}
        </div>
      </div>

      {/* ── Right: Action Buttons (Kembali, Pindahkan, Edit, Hapus) ── */}
      <div className="flex items-center flex-wrap gap-2.5 shrink-0 self-start md:self-auto">
        <button
          type="button"
          onClick={onBack}
          className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={onMove}
          className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowRightLeft size={13} />
          <span>Pindahkan</span>
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Pencil size={13} strokeWidth={2.4} />
          <span>Edit Perangkat</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Trash2 size={13} strokeWidth={2.2} />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};

export default DeviceDetailHero;
