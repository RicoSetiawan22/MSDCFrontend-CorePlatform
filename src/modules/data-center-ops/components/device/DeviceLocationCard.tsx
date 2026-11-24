import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Building2,
  DoorOpen,
  Server,
  Layers,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from "lucide-react";
import type { Device } from "../../types/device";

export interface DeviceLocationCardProps {
  device: Device;
}

export const DeviceLocationCard: React.FC<DeviceLocationCardProps> = ({ device }) => {
  const site = device.site;
  const room = device.site_room;
  const rack = device.rack;

  // Hitung span U
  let uSpanText = "—";
  if (device.rack_position_u) {
    if (device.rack_position_u_end && device.rack_position_u_end !== device.rack_position_u) {
      const span = device.rack_position_u_end - device.rack_position_u + 1;
      uSpanText = `Slot U${device.rack_position_u} - U${device.rack_position_u_end} (${span}U Unit)`;
    } else {
      uSpanText = `Slot U${device.rack_position_u} (1U Unit)`;
    }
  }

  const isRackInstalled = Boolean(rack?.id);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* ── 1. Header Card Band Bergaya Kuning Emas Pastel MSDC ── */}
      <div className="bg-[#FDE8B3]/60 px-6 py-4 border-b border-amber-200/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#0A2140] flex items-center justify-center font-bold">
            <MapPin size={17} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Lokasi Fisik &amp; Penempatan Rack
            </h2>
            <p className="text-[11px] text-slate-600 font-medium">
              Hirarki pusat data, ruangan server, dan unit slot rack yang dialokasikan
            </p>
          </div>
        </div>

        {/* Status Pill Badge di Header */}
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-amber-200/80 text-amber-800 shadow-2xs">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isRackInstalled ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span>{isRackInstalled ? "Terpasang di Rack" : "Gudang / Tanpa Rack"}</span>
        </span>
      </div>

      {/* ── 2. Grid 3 Kolom Penempatan (Site, Room, Rack) ── */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Kolom 1: Site Data Center */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group">
          <div className="flex flex-col gap-3">
            {/* Top row: Label & Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 size={14} />
                </div>
                <span>Site Data Center</span>
              </div>
              {site?.id ? (
                <Link
                  to={`/dc/sites/${site.id}`}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Detail Site</span>
                  <ExternalLink size={11} />
                </Link>
              ) : null}
            </div>

            {/* Nama & Kode Site */}
            {site ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {site.site_name}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 self-start">
                  {site.site_code}
                </span>
                <div className="flex flex-col gap-0.5 text-xs text-slate-600 mt-1">
                  <p className="line-clamp-2" title={site.address ?? ""}>
                    {site.address || "Alamat lokasi belum tercatat"}
                  </p>
                  {(site.city || site.province) ? (
                    <span className="text-[11px] font-medium text-slate-400">
                      {[site.city, site.province].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400 italic">
                Perangkat belum ditempatkan pada site data center spesifik.
              </div>
            )}
          </div>

          {/* Bottom row: Kapasitas Daya Site */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Kapasitas Daya:</span>
            {site?.total_power_capacity_kw ? (
              <strong className="text-slate-800 font-semibold inline-flex items-center gap-1">
                <Zap size={11} className="text-amber-500" />
                {site.total_power_capacity_kw} kW
              </strong>
            ) : (
              <span className="text-slate-400 font-normal">—</span>
            )}
          </div>
        </div>

        {/* Kolom 2: Ruangan Server (Room) */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group">
          <div className="flex flex-col gap-3">
            {/* Top row: Label */}
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DoorOpen size={14} />
              </div>
              <span>Ruangan Server (Room)</span>
            </div>

            {/* Nama & Kode Room */}
            {room ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {room.room_name}
                </span>
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 self-start">
                  {room.room_code}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 flex-wrap">
                  {room.floor ? (
                    <span className="bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700">
                      Lantai {room.floor}
                    </span>
                  ) : null}
                  {room.zone ? (
                    <span className="bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700">
                      Zona {room.zone}
                    </span>
                  ) : null}
                  {room.room_type ? (
                    <span className="bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-700 capitalize">
                      {room.room_type.replace(/_/g, " ")}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400 italic">
                Perangkat tidak berada di ruangan server spesifik (disimpan di gudang / area umum).
              </div>
            )}
          </div>

          {/* Bottom row: Lingkungan */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Sistem Lingkungan:</span>
            <strong className="text-slate-700 font-semibold inline-flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              {room ? "Pendingin Aktif" : "Standar"}
            </strong>
          </div>
        </div>

        {/* Kolom 3: Rack Unit & Posisi Slot U */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4 group">
          <div className="flex flex-col gap-3">
            {/* Top row: Label & Link */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Server size={14} />
                </div>
                <span>Rack Unit &amp; Slot U</span>
              </div>
              {rack?.id ? (
                <Link
                  to={`/dc/racks/${rack.id}`}
                  className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 hover:underline"
                >
                  <span>Detail Rack</span>
                  <ExternalLink size={11} />
                </Link>
              ) : null}
            </div>

            {/* Nama & Slot U Rack */}
            {rack ? (
              <div className="flex flex-col gap-2">
                <span className="text-base font-bold text-slate-900 leading-snug">
                  {rack.rack_code} {rack.rack_name ? `— ${rack.rack_name}` : ""}
                </span>

                {/* Slot U Badge */}
                <div className="bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 self-start shadow-2xs">
                  <Layers size={13} className="text-amber-600" />
                  <span>{uSpanText}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                  <span>Kapasitas: <strong className="text-slate-800">{rack.total_u ?? 42} U</strong></span>
                  {rack.power_capacity_watt ? (
                    <span>Batas Daya: <strong className="text-slate-800">{Number(rack.power_capacity_watt).toLocaleString("id-ID")} W</strong></span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="py-4 text-xs text-slate-400 italic">
                Perangkat belum terpasang di rack (tanpa alokasi slot U).
              </div>
            )}
          </div>

          {/* Bottom row: Status Rack */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Status Rack:</span>
            <span className="font-semibold text-slate-700 inline-flex items-center gap-1 capitalize">
              <CheckCircle2 size={12} className="text-emerald-500" />
              {rack?.status ?? "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceLocationCard;

