import React from "react";
import { Building2, MapPin } from "lucide-react";
import { SiteLocationMap } from "./SiteLocationMap";
import type { Site } from "../../types/site";

interface SiteInfoCardProps {
  site: Site;
}

export const SiteInfoCard: React.FC<SiteInfoCardProps> = ({ site }) => {
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const statusLabel =
    site.status === "active"
      ? "Aktif"
      : site.status === "maintenance"
      ? "Dalam Perbaikan (Maintenance)"
      : "Didecommission";

  const rows = [
    { label: "Site Code", value: site.site_code },
    { label: "Site Name", value: site.site_name },
    { label: "Location", value: site.city || "—" },
    { label: "Province", value: site.province || "—" },
    { label: "Address", value: site.address || "—" },
    {
      label: "Total Power Capacity",
      value: site.total_power_capacity_kw
        ? `${Number(site.total_power_capacity_kw).toLocaleString("id-ID")} kW`
        : "—",
    },
    {
      label: "Total Bandwidth",
      value: site.total_bandwidth_mbps
        ? `${Number(site.total_bandwidth_mbps).toLocaleString("id-ID")} Mbps`
        : "—",
    },
    { label: "Operational Status", value: statusLabel },
    {
      label: "Cost Center ID",
      value: site.cost_center_id ? `#${site.cost_center_id}` : "—",
    },
    { label: "Notes", value: site.notes || "—" },
    { label: "Created At", value: formatDate(site.created_at) },
    { label: "Last Updated", value: formatDate(site.updated_at) },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* ── Header Card Band Bergaya Kuning Emas MSDC ── */}
      <div className="bg-[#FDE8B3] px-6 sm:px-7 py-4 border-b border-amber-200/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <Building2 size={18} className="text-amber-800" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Site Information & Lokasi Fasilitas
          </h2>
        </div>

        {site.city && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-amber-300/80 text-xs font-bold text-amber-900 shadow-2xs">
            <MapPin size={12} className="text-amber-600" />
            <span>{site.city}, {site.province || "Indonesia"}</span>
          </span>
        )}
      </div>

      {/* ── Split Grid Layout: Spesifikasi Teknis (Kiri) & Peta Interaktif (Kanan) ── */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Tabel Spesifikasi Site (7 Kolom) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 bg-white shadow-2xs">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-center px-4 sm:px-5 py-3 hover:bg-slate-50/70 transition-colors"
            >
              {/* Label Kolom Kiri */}
              <div className="w-full sm:w-44 text-xs font-medium text-slate-500 shrink-0">
                {row.label}
              </div>

              {/* Nilai Kolom Kanan */}
              <div className="mt-0.5 sm:mt-0 text-xs sm:text-sm font-bold text-slate-900 break-words flex-1">
                {row.value}
              </div>
            </div>
          ))}
        </div>

        {/* Kolom Kanan: Peta Interaktif & Navigasi Fasilitas (5 Kolom) */}
        <div className="lg:col-span-5 h-full">
          <SiteLocationMap site={site} />
        </div>
      </div>
    </div>
  );
};

export default SiteInfoCard;
