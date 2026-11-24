import React from "react";
import { ArrowLeft, LayoutGrid, Trash2 } from "lucide-react";
import type { RackDetail, RackStatus } from "../../types/rack";

interface RackDetailHeroProps {
  rack: RackDetail;
  onBack: () => void;
  onViewSlots: () => void;
  onDelete: () => void;
}

export const RackDetailHero: React.FC<RackDetailHeroProps> = ({
  rack,
  onBack,
  onViewSlots,
  onDelete,
}) => {
  const getStatusBadge = (status: RackStatus) => {
    switch (status) {
      case "active":
        return {
          label: "AKTIF",
          className: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
          dotColor: "bg-emerald-500",
        };
      case "reserved":
        return {
          label: "RESERVED",
          className: "bg-amber-50 text-amber-700 border-amber-200/80",
          dotColor: "bg-amber-500",
        };
      case "maintenance":
        return {
          label: "MAINTENANCE",
          className: "bg-orange-50 text-orange-700 border-orange-200/80",
          dotColor: "bg-orange-500",
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

  const badge = getStatusBadge(rack.status);
  const room = rack.site_room;
  const site = room?.site;

  const titleText = rack.rack_name
    ? `${rack.rack_name} - ${rack.rack_code}`
    : rack.rack_code;

  const locationText = [site?.city, site?.province].filter(Boolean).join(", ");
  const roomHierarchy = room
    ? [
        room.room_name,
        room.floor ? `Lantai ${room.floor}` : null,
        room.zone ? `Zone ${room.zone}` : null,
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-5">
      {/* ── Left: Rack Title, Status Badge, Site & Location Hierarchy ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-[#0A2140] tracking-tight uppercase">
            {titleText}
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border tracking-wide ${badge.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
            <span>{badge.label}</span>
          </span>
        </div>

        {site?.site_name ? (
          <div className="text-lg font-bold text-slate-800 tracking-tight">
            {site.site_name}
          </div>
        ) : null}

        <div className="text-sm font-medium text-slate-500 flex flex-wrap items-center gap-x-2">
          {locationText && <span>{locationText}</span>}
          {locationText && roomHierarchy && <span className="text-slate-300">•</span>}
          {roomHierarchy && <span>{roomHierarchy}</span>}
        </div>
      </div>

      {/* ── Right: Action Buttons (Kembali, Lihat Slot, Hapus) ── */}
      <div className="flex items-center flex-wrap gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <ArrowLeft size={14} />
          <span>Kembali</span>
        </button>

        <button
          type="button"
          onClick={onViewSlots}
          className="bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <LayoutGrid size={14} strokeWidth={2.2} />
          <span>Lihat Slot</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="bg-[#EB3D4D] hover:bg-[#D43746] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Trash2 size={13} strokeWidth={2.4} />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  );
};

export default RackDetailHero;
