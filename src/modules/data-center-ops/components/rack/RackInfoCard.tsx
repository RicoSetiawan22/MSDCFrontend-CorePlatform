import React from "react";
import type { RackDetail } from "../../types/rack";

interface RackInfoCardProps {
  rack: RackDetail;
}

export const RackInfoCard: React.FC<RackInfoCardProps> = ({ rack }) => {
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
    rack.status === "active"
      ? "Aktif"
      : rack.status === "reserved"
      ? "Reserved (Dipesan)"
      : rack.status === "maintenance"
      ? "Dalam Perbaikan (Maintenance)"
      : "Didecommission";

  const room = rack.site_room;
  const site = room?.site;

  const roomText = room
    ? `${room.room_code} · ${room.room_name}${
        room.floor || room.zone
          ? ` (${room.floor ? `Lantai ${room.floor}` : ""}${
              room.floor && room.zone ? ", " : ""
            }${room.zone ? `Zone ${room.zone}` : ""})`
          : ""
      }`
    : "—";

  const roomTypeAreaText = room
    ? [
        room.room_type
          ? room.room_type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : null,
        room.area_sqm
          ? `${Number(room.area_sqm).toLocaleString("id-ID")} m²`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || "—"
    : "—";

  const powerWatt = rack.power_capacity_watt ? Number(rack.power_capacity_watt) : 0;
  const powerDisplay =
    powerWatt > 0
      ? `${powerWatt.toLocaleString("id-ID")} W (${(powerWatt / 1000).toFixed(2)} kW)`
      : "—";

  const rows = [
    { label: "Site Code", value: site?.site_code || "—" },
    { label: "Site Name", value: site?.site_name || "—" },
    { label: "Room Code / Name", value: roomText },
    { label: "Room Type & Area", value: roomTypeAreaText },
    { label: "Rack Code", value: rack.rack_code },
    { label: "Rack Name", value: rack.rack_name || "—" },
    { label: "Location", value: site?.city || "—" },
    {
      label: "Province / Country",
      value: site?.province ? `${site.province}, Indonesia` : "Indonesia",
    },
    { label: "Power Capacity", value: powerDisplay },
    { label: "Total Slot", value: `${rack.total_u} U` },
    { label: "Operational Status", value: statusLabel },
    {
      label: "Site Cost Center",
      value: site?.cost_center_id ? `#${site.cost_center_id}` : "—",
    },
    { label: "Notes", value: rack.notes || "—" },
    { label: "Created At", value: formatDate(rack.created_at) },
    { label: "Last Updated", value: formatDate(rack.updated_at) },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* ── Header Card Band Bergaya Kuning Emas MSDC ── */}
      <div className="bg-[#FDE8B3] px-7 py-4 border-b border-amber-200/60">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Rack & Site Information
        </h2>
      </div>

      {/* ── Key - Value Row Layout Bersih & Responsif ── */}
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:items-center px-7 py-3.5 hover:bg-slate-50/60 transition-colors"
          >
            {/* Label Kolom Kiri */}
            <div className="w-full sm:w-64 text-sm font-normal text-slate-500 shrink-0">
              {row.label}
            </div>

            {/* Nilai Kolom Kanan */}
            <div className="mt-1 sm:mt-0 text-sm font-bold text-slate-900 break-words flex-1">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RackInfoCard;
