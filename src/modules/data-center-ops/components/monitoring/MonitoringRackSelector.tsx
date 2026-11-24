import React, { useMemo } from "react";
import { RotateCw, Server, Clock, MapPin, Radio, Edit3 } from "lucide-react";
import type { Rack } from "../../types/rack";

interface MonitoringRackSelectorProps {
  racks: Rack[];
  selectedRackId: number | null;
  onSelectRack: (rackId: number | null) => void;
  isLoadingRacks: boolean;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string | null;
  activeSource?: "sensor" | "manual" | null;
}

export const MonitoringRackSelector: React.FC<MonitoringRackSelectorProps> = React.memo(({
  racks,
  selectedRackId,
  onSelectRack,
  isLoadingRacks,
  onManualRefresh,
  isRefreshing = false,
  lastUpdated,
  activeSource,
}) => {
  const selectedRack = racks.find((r) => r.id === selectedRackId);

  // Group racks by Room/Site hierarchically (clean standard industry UX, no hardcoding)
  const groupedRacks = useMemo(() => {
    const groups: Record<string, Rack[]> = {};
    racks.forEach((r) => {
      const roomName = r.site_room
        ? `${r.site_room.site?.site_name ? `${r.site_room.site.site_name} — ` : ""}${r.site_room.room_name}`
        : "Lokasi Umum / Lainnya";

      if (!groups[roomName]) {
        groups[roomName] = [];
      }
      groups[roomName].push(r);
    });
    return groups;
  }, [racks]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 transition-all">
      {/* Top bar: Header & Data Update Timestamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#0A2140] flex items-center gap-2.5">
            MONITORING RACK
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitoring suhu &amp; kelembapan per rack secara real-time dari sensor telemetri &amp; verifikasi manual.
          </p>
        </div>

        {/* Data Update Timestamp Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200/90 text-slate-600 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Update Pembacaan:</span>
            <span className="font-bold text-[#0A2140] font-mono">
              {lastUpdated ? `${lastUpdated}` : "Memuat data..."}
            </span>
            {onManualRefresh && (
              <button
                type="button"
                onClick={onManualRefresh}
                title="Muat ulang pembacaan suhu & kelembapan"
                disabled={isRefreshing}
                className="ml-1 p-1 hover:bg-slate-200/70 rounded transition-all text-slate-500 hover:text-[#E59B00] cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#E59B00]" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rack Selector Input Section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            Pilih Rack
          </label>

          {/* Dynamic Data-Driven Status Badge */}
          {selectedRack && (
            <div className="flex items-center gap-2 text-xs font-semibold">
              {activeSource === "sensor" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                  Live Sensor Telemetri
                </span>
              ) : activeSource === "manual" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Edit3 className="w-3 h-3 text-blue-600" />
                  Data Pembacaan Manual
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-normal text-slate-400 bg-slate-50 border border-slate-200">
                  Belum Ada Data
                </span>
              )}

              {selectedRack.site_room && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-normal text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {selectedRack.site_room.room_name} ({selectedRack.total_u ?? 42}U)
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <select
            className="w-full bg-slate-50/70 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-lg border border-slate-200 focus:border-[#E59B00] focus:ring-2 focus:ring-[#E59B00]/20 py-2.5 px-3.5 transition-all outline-none cursor-pointer"
            value={selectedRackId ?? ""}
            disabled={isLoadingRacks}
            onChange={(e) => onSelectRack(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">-- Pilih Rack dari Master Data --</option>
            {Object.entries(groupedRacks).map(([roomGroup, rackList]) => (
              <optgroup key={roomGroup} label={`📍 ${roomGroup}`}>
                {rackList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.rack_code}
                    {r.rack_name ? ` — ${r.rack_name}` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});

MonitoringRackSelector.displayName = "MonitoringRackSelector";
