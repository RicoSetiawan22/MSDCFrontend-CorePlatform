import React from "react";
import {
  Thermometer,
  Droplets,
  Clock,
  ArrowRight,
  AlertTriangle,
  WifiOff,
  Server,
  MapPin,
} from "lucide-react";
import type { Rack } from "../../types/rack";

export interface RackTelemetryData {
  temperature: number | null;
  humidity: number | null;
  status: "normal" | "warning" | "critical" | "unmonitored";
  lastRecordedAt: string | null;
  breachReason?: string;
}

interface MonitoringDashboardCardProps {
  rack: Rack;
  telemetry?: RackTelemetryData;
  onSelect: () => void;
}

/* ───────────────────────── Konfigurasi status ───────────────────────── */

type StatusKey = "normal" | "warning" | "critical" | "offline";

const STATUS_STYLES: Record<
  StatusKey,
  { label: string; accent: string; badge: string; dot: string; value: string; ring: string; alert: string }
> = {
  normal: {
    label: "Normal",
    accent: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    dot: "bg-emerald-500",
    value: "text-[#0A2140]",
    ring: "hover:ring-emerald-200",
    alert: "",
  },
  warning: {
    label: "Warning",
    accent: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    dot: "bg-amber-500",
    value: "text-amber-600",
    ring: "ring-amber-100 hover:ring-amber-300",
    alert: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  critical: {
    label: "Critical",
    accent: "bg-rose-500",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    dot: "bg-rose-500",
    value: "text-rose-600",
    ring: "ring-rose-100 hover:ring-rose-300",
    alert: "bg-rose-50 text-rose-800 ring-rose-200",
  },
  offline: {
    label: "Offline",
    accent: "bg-slate-200",
    badge: "bg-slate-50 text-slate-500 ring-slate-200",
    dot: "bg-slate-300",
    value: "text-slate-400",
    ring: "hover:ring-slate-300",
    alert: "",
  },
};

/* ───────────────────────── Helper format ───────────────────────── */

const formatNumber = (n: number) =>
  n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

const formatLastSeen = (iso: string) => {
  const date = new Date(iso);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit lalu`;

  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
  return `${time} WIB`;
};

/** Data dianggap usang bila lebih dari 15 menit tidak ada log baru. */
const isStale = (iso: string | null) =>
  !!iso && Date.now() - new Date(iso).getTime() > 15 * 60 * 1000;

/* ───────────────────────── Komponen ───────────────────────── */

export const MonitoringDashboardCard: React.FC<MonitoringDashboardCardProps> = React.memo(
  ({ rack, telemetry, onSelect }) => {
    const hasData =
      !!telemetry && (telemetry.temperature !== null || telemetry.humidity !== null);

    const statusKey: StatusKey = !hasData
      ? "offline"
      : telemetry!.status === "critical" || telemetry!.status === "warning"
      ? telemetry!.status
      : "normal";

    const s = STATUS_STYLES[statusKey];
    const stale = hasData && isStale(telemetry!.lastRecordedAt);

    const roomName = rack.site_room?.room_name ?? "Ruangan";
    const siteName = rack.site_room?.site?.site_name ?? "";
    const fullLocation = siteName ? `${roomName}, ${siteName}` : roomName;

    return (
      <article
        onClick={onSelect}
        className={`group relative flex h-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 shadow-[0_1px_2px_rgba(10,33,64,0.04)] transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(10,33,64,0.18)] ${s.ring}`}
      >
        {/* Garis aksen status */}
        <span className={`absolute inset-y-0 left-0 w-1 ${s.accent}`} aria-hidden />

        <div className="flex flex-1 flex-col p-4 pl-5">
          {/* ── Header: badge otomatis turun ke baris baru kalau kartu sempit ── */}
          <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <Server className="h-4 w-4 shrink-0 text-slate-400" />
              <h4 className="truncate text-lg font-bold tracking-tight text-[#0A2140]">
                {rack.rack_code}
              </h4>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${s.badge}`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {statusKey === "critical" && (
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 motion-reduce:hidden ${s.dot}`}
                  />
                )}
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${s.dot}`} />
              </span>
              {s.label}
            </span>
          </header>

          {/* Lokasi: maksimal 2 baris, tinggi tetap supaya semua kartu sejajar */}
          <p className="mt-1.5 flex min-h-8 items-start gap-1 text-xs leading-4 text-slate-500" title={fullLocation}>
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
            <span className="line-clamp-2 break-words">
              {roomName}
              {siteName && <span className="text-slate-400">, {siteName}</span>}
            </span>
          </p>

          {/* ── Body ── */}
          <div className="mt-3 flex flex-1 flex-col">
            {hasData ? (
              /* Dua metrik berdampingan; kalau kartu sempit, otomatis menumpuk */
              <div className="grid grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))] gap-2">
                <Metric
                  icon={<Thermometer className="h-3.5 w-3.5 text-rose-500" />}
                  label="Suhu"
                  value={telemetry!.temperature}
                  unit="°C"
                  valueClass={s.value}
                />
                <Metric
                  icon={<Droplets className="h-3.5 w-3.5 text-sky-500" />}
                  label="Kelembapan"
                  value={telemetry!.humidity}
                  unit="%"
                  valueClass={s.value}
                  progress={telemetry!.humidity}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <WifiOff className="h-4 w-4 text-slate-400" />
                </span>
                <p className="text-xs font-medium text-slate-500">Sensor belum terpasang</p>
              </div>
            )}

            {telemetry?.breachReason && (statusKey === "warning" || statusKey === "critical") && (
              <div
                className={`mt-2 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs font-medium ring-1 ring-inset ${s.alert}`}
                title={telemetry.breachReason}
              >
                <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2 break-words">{telemetry.breachReason}</span>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <footer className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs">
            <span
              className={`flex min-w-0 items-center gap-1.5 ${stale ? "text-amber-600" : "text-slate-400"}`}
              title={stale ? "Tidak ada data baru lebih dari 15 menit" : undefined}
            >
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {telemetry?.lastRecordedAt ? formatLastSeen(telemetry.lastRecordedAt) : "Belum ada log"}
              </span>
            </span>
            {rack.total_u ? (
              <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-600">
                {rack.total_u}U
              </span>
            ) : null}
          </footer>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className={`mt-3 flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E59B00] focus-visible:ring-offset-2 ${
              hasData
                ? "bg-[#0A2140] text-white hover:bg-[#E59B00] hover:text-[#0A2140]"
                : "bg-white text-[#0A2140] ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {hasData ? "Lihat telemetri" : "Lihat detail rak"}
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </article>
    );
  }
);

/* ───────────────────────── Sub-komponen metrik ───────────────────────── */

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  unit: string;
  valueClass: string;
  progress?: number | null;
}

const Metric: React.FC<MetricProps> = ({ icon, label, value, unit, valueClass, progress }) => (
  <div className="flex min-w-0 flex-col rounded-xl bg-slate-50 px-3 py-2.5">
    <span className="flex items-center gap-1 truncate text-[11px] font-medium text-slate-500">
      {icon}
      {label}
    </span>
    <span className={`mt-1 whitespace-nowrap text-xl font-bold leading-none tracking-tight tabular-nums ${valueClass}`}>
      {value !== null ? formatNumber(value) : "–"}
      <span className="ml-0.5 text-xs font-semibold text-slate-400">{unit}</span>
    </span>
    {progress != null && (
      <span className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden>
        <span
          className="block h-full rounded-full bg-sky-400"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </span>
    )}
  </div>
);

MonitoringDashboardCard.displayName = "MonitoringDashboardCard";
export default MonitoringDashboardCard;