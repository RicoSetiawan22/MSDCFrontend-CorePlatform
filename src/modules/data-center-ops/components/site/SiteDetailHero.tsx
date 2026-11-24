import React from "react";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import type { Site, SiteStatus } from "../../types/site";

interface SiteDetailHeroProps {
  site: Site;
  onBack: () => void;
  onEdit: () => void;
  onAddRoom: () => void;
}

export const SiteDetailHero: React.FC<SiteDetailHeroProps> = ({
  site,
  onBack,
  onEdit,
  onAddRoom,
}) => {
  const getStatusBadge = (status: SiteStatus) => {
    switch (status) {
      case "active":
        return {
          label: "AKTIF",
          className: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
          dotColor: "bg-emerald-500",
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

  const badge = getStatusBadge(site.status);
  const locationText = [site.city, site.province].filter(Boolean).join(", ") || "Lokasi belum ditentukan";

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-5">
      {/* ── Left: Site Title, Status, Code & Location ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-[#0A2140] tracking-tight uppercase">
            {site.site_name}
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border tracking-wide ${badge.className}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
            <span>{badge.label}</span>
          </span>
        </div>

        <div className="text-lg font-bold text-slate-800 font-mono tracking-tight">
          {site.site_code}
        </div>

        <div className="text-sm font-medium text-slate-500">
          {locationText}
        </div>
      </div>

      {/* ── Right: Action Buttons (Kembali, Edit Site, + Tambah Room) ── */}
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
          onClick={onEdit}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Pencil size={13} strokeWidth={2.4} />
          <span>Edit Site</span>
        </button>

        <button
          type="button"
          onClick={onAddRoom}
          className="bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
        >
          <Plus size={14} strokeWidth={2.4} />
          <span>Tambah Room</span>
        </button>
      </div>
    </div>
  );
};

export default SiteDetailHero;
