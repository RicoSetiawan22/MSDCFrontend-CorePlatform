import React from "react";
import { Server, Zap, RefreshCw } from "lucide-react";
import type { RackDetail } from "../../types/rack";

interface RackCapacityTelemetryCardProps {
  rack: RackDetail;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const RackCapacityTelemetryCard: React.FC<RackCapacityTelemetryCardProps> = ({
  rack,
  onRefresh,
  isRefreshing = false,
}) => {
  const totalU = rack.total_u || 42;
  const usedU = rack.utilization?.used_u ?? rack.used_u ?? 0;
  const freeU = rack.utilization?.free_u ?? rack.free_u ?? Math.max(0, totalU - usedU);
  const utilizationPct =
    rack.utilization?.utilization_pct !== undefined
      ? Number(rack.utilization.utilization_pct.toFixed(1))
      : totalU > 0
      ? Number(((usedU / totalU) * 100).toFixed(1))
      : 0;

  const freePct = totalU > 0 ? Number(((freeU / totalU) * 100).toFixed(1)) : 0;

  // Power metrics
  const powerWatt = rack.power_capacity_watt ? Number(rack.power_capacity_watt) : 0;
  const usedWatt = rack.utilization?.used_watt ?? rack.used_watt ?? 0;
  const freeWatt =
    rack.utilization?.free_watt ??
    rack.free_watt ??
    Math.max(0, powerWatt - usedWatt);

  const powerUtilizationPct =
    rack.utilization?.power_utilization_pct !== undefined &&
    rack.utilization.power_utilization_pct !== null
      ? Number(rack.utilization.power_utilization_pct.toFixed(1))
      : powerWatt > 0
      ? Number(((usedWatt / powerWatt) * 100).toFixed(1))
      : 0;

  const freePowerPct = powerWatt > 0 ? Number(((freeWatt / powerWatt) * 100).toFixed(1)) : 0;
  const safetyWatt = Math.round(powerWatt * 0.7);

  // Power Zone Badge
  const getPowerZone = (pct: number) => {
    if (pct < 70) {
      return {
        label: "Zona Aman",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        barColor: "bg-emerald-500",
        textColor: "text-emerald-600",
        badgeBorder: "border-emerald-300 bg-emerald-50 text-emerald-700",
      };
    }
    if (pct <= 85) {
      return {
        label: "Peringatan",
        className: "bg-amber-50 text-amber-700 border-amber-200/80",
        barColor: "bg-amber-500",
        textColor: "text-amber-600",
        badgeBorder: "border-amber-300 bg-amber-50 text-amber-700",
      };
    }
    return {
      label: "Kritis",
      className: "bg-rose-50 text-rose-700 border-rose-200/80",
      barColor: "bg-rose-500",
      textColor: "text-rose-600",
      badgeBorder: "border-rose-300 bg-rose-50 text-rose-700",
    };
  };

  const powerZone = getPowerZone(powerUtilizationPct);

  const rackLabel = rack.rack_name
    ? `${rack.rack_name} - ${rack.rack_code}`
    : rack.rack_code;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-300">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kapasitas & Penggunaan Daya
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Telemetri</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Monitoring komprehensif utilisasi slot space ({totalU} U) dan alokasi daya listrik spesifik untuk {rackLabel} secara real-time
          </p>
        </div>

        {/* Tombol Auto Refresh */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 bg-[#E59B00] hover:bg-[#D48F00] text-white font-bold text-xs px-3.5 py-2 rounded-md transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-70"
          >
            <RefreshCw
              size={13}
              className={`shrink-0 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh data</span>
          </button>
        </div>
      </div>

      {/* ── Stacked Telemetry Panels: SLOT SPACE (Atas) & DAYA LISTRIK (Bawah) ── */}
      <div className="flex flex-col gap-10 divide-y divide-slate-300">
        {/* ── PANEL ATAS: SLOT SPACE (42 U) ── */}
        <div className="flex flex-col gap-5">
          {/* Header Panel Kiri */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0 mt-0.5">
                <Server size={20} strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-black text-slate-800 text-sm tracking-wide uppercase">
                    SLOT SPACE ({totalU} U)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                    {usedU} Slot Terkunci
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Tersedia {freeU} U untuk perangkat baru ({freePct}%)
                </div>
              </div>
            </div>

            {/* Badge Utilisasi Kanan */}
            <div className="shrink-0 px-3 py-1 rounded-xl border border-amber-300 bg-amber-50 text-amber-700 font-extrabold text-xs tracking-tight shadow-2xs">
              {utilizationPct}% Utilisasi
            </div>
          </div>

          {/* Progress Bar Status Alokasi Unit */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Status Alokasi Unit</span>
              <span className="text-slate-900 font-bold">
                {usedU} / {totalU} U Digunakan
              </span>
            </div>

            {/* Track Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5 flex">
              <div
                className="bg-[#E59B00] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, utilizationPct))}%` }}
              />
            </div>

            {/* Penanda Skala Bawah */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-0.5">
              <span className="text-slate-600 font-semibold">U1 (Bawah)</span>
              <span>U14</span>
              <span>U28</span>
              <span className="text-slate-600 font-semibold">U{totalU} (Atas)</span>
            </div>
          </div>

          {/* 3 Kolom Metrik Bawah */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 pt-3 border-t border-slate-200">
            {/* Terpakai */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-slate-500 font-medium">Terpakai</span>
              <span className="text-2xl font-black text-amber-600 mt-0.5">
                {usedU} U
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                {utilizationPct}% total
              </span>
            </div>

            {/* Sisa Slot */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-slate-500 font-medium">Sisa Slot</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5">
                {freeU} U
              </span>
              <span className="text-[11px] font-bold text-emerald-600 mt-0.5">
                Tersedia
              </span>
            </div>

            {/* Slot Maksimal */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-slate-500 font-medium">Slot Maksimal</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5">
                {totalU} U
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                Standard Rack
              </span>
            </div>
          </div>
        </div>

        {/* ── PANEL BAWAH: DAYA LISTRIK ── */}
        <div className="flex flex-col gap-5 pt-8">
          {/* Header Panel Kanan */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0 mt-0.5">
                <Zap size={20} strokeWidth={2.2} />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-black text-slate-800 text-sm tracking-wide uppercase">
                    DAYA LISTRIK ({powerWatt > 0 ? `${powerWatt} W` : "—"})
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${powerZone.className}`}
                  >
                    {powerZone.label}
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Cadangan daya tersedia {freeWatt.toLocaleString("id-ID")} W ({freePowerPct}%)
                </div>
              </div>
            </div>

            {/* Badge Utilisasi Kanan */}
            <div
              className={`shrink-0 px-3 py-1 rounded-xl border font-extrabold text-xs tracking-tight shadow-2xs ${powerZone.badgeBorder}`}
            >
              {powerUtilizationPct}% Utilisasi
            </div>
          </div>

          {/* Progress Bar Beban Daya Terkini */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700">Beban Daya Terkini</span>
              <span className="text-slate-900 font-bold">
                {usedWatt.toLocaleString("id-ID")} W / {powerWatt.toLocaleString("id-ID")} W{" "}
                <span className="text-slate-500 font-normal">
                  (Safety: &lt; {safetyWatt.toLocaleString("id-ID")} W)
                </span>
              </span>
            </div>

            {/* Track Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5 flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${powerZone.barColor}`}
                style={{ width: `${Math.min(100, Math.max(0, powerUtilizationPct))}%` }}
              />
            </div>

            {/* Legenda Ambang Batas Bawah */}
            <div className="flex items-center justify-between text-[11px] font-medium px-0.5">
              <span className="text-emerald-700 font-semibold">Normal (&lt;70%)</span>
              <span className="text-amber-700 font-semibold">Peringatan (70-85%)</span>
              <span className="text-rose-700 font-semibold">Kritis (&gt;85%)</span>
            </div>
          </div>

          {/* 3 Kolom Metrik Bawah */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 pt-3 border-t border-slate-200">
            {/* Daya Terpakai */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-slate-500 font-medium">Daya Terpakai</span>
              <span className={`text-2xl font-black mt-0.5 ${powerZone.textColor}`}>
                {usedWatt.toLocaleString("id-ID")} W
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                {powerUtilizationPct}% beban
              </span>
            </div>

            {/* Sisa Daya */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-slate-500 font-medium">Sisa Daya</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5">
                {freeWatt.toLocaleString("id-ID")} W
              </span>
              <span className="text-[11px] font-bold text-emerald-600 mt-0.5">
                Tersedia
              </span>
            </div>

            {/* Kapasitas Total */}
            <div className="flex flex-col items-center justify-center text-center px-2">
              <span className="text-xs text-slate-500 font-medium">Kapasitas Total</span>
              <span className="text-2xl font-black text-slate-900 mt-0.5">
                {powerWatt > 0 ? `${powerWatt.toLocaleString("id-ID")} W` : "—"}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">
                Max Circuit
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RackCapacityTelemetryCard;
