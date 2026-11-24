import React, { useState, useEffect, useMemo } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Activity,
  RotateCcw,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  ActiveAlarmItem,
  IActiveAlarmTableItem,
  IInfraStatusSectionData,
  DashboardDetailsData,
  AlarmIncidentStatus,
} from "../../types/dashboard";
import type { Alarm } from "../../types/monitoring";
import {
  formatRelativeTime,
  formatSiteName,
  calculateInfrastructureStatus,
} from "../../utils/dashboardAggregator";

interface ActiveAlarmsSectionProps {
  alarms?: (ActiveAlarmItem | IActiveAlarmTableItem | Alarm)[];
  totalActive?: number;
  onViewAll?: () => void;
  onViewAlarmDetail?: (alarmId: string | number) => void;
  // Props untuk integrasi status infrastruktur
  infraData?: IInfraStatusSectionData | null;
  details?: DashboardDetailsData | null;
  totalDevices?: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const defaultInfraData: IInfraStatusSectionData = {
  last_updated: "06:21:43",
  total_devices: 135,
  healthy: { count: 124, percentage: 92.0 },
  warning: { count: 8, percentage: 5.8 },
  critical: { count: 3, percentage: 2.2 },
};

export const ActiveAlarmsSection: React.FC<ActiveAlarmsSectionProps> = ({
  alarms,
  onViewAll,
  onViewAlarmDetail,
  infraData,
  details,
  totalDevices,
  onRefresh,
  isRefreshing = false,
}) => {
  // ── 1. State Management ──
  // Mode tampilan: 'table' (default) atau 'status'
  const [viewMode, setViewMode] = useState<"table" | "status">("table");

  // state untuk accordian collapse/expand
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Preservasi State Paginasi: diletakkan di level atas agar saat berpindah ke 'status'
  // dan kembali lagi ke 'table', currentPage dan itemsPerPage TIDAK ter-reset.
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Normalisasi data tabel agar 100% kompatibel dengan API monitoringApi (Alarm) maupun dashboard (ActiveAlarmItem)
  const normalizedList: IActiveAlarmTableItem[] = useMemo(() => {
    const list = alarms ?? [];
    return list.map((item, idx) => {
      if ("object_name" in item && "problem" in item && "time_ago" in item) {
        const tableItem = item as IActiveAlarmTableItem;
        return {
          ...tableItem,
          site_name: formatSiteName(tableItem.site_name),
          time_ago: formatRelativeTime(tableItem.triggered_at),
        };
      }

      const alarmItem = item as unknown as Record<string, unknown>;
      const rawStatus = String(alarmItem.status || "open").toLowerCase();
      const statusLabel =
        rawStatus === "acknowledged"
          ? "Acknowledged"
          : rawStatus === "assigned"
            ? "Assigned"
            : rawStatus === "investigating"
              ? "Investigating"
              : rawStatus === "resolved"
                ? "Resolved"
                : "Open";

      const objectName =
        (alarmItem.object_name as string) ||
        (alarmItem.target as string) ||
        (alarmItem.alarm_type as string) ||
        "DEVICE-01";

      const problem =
        (alarmItem.problem as string) ||
        (alarmItem.message as string) ||
        "Alarm triggered";

      const siteName =
        (alarmItem.site_name as string) ||
        (alarmItem.site as string) ||
        (alarmItem.site_id ? `Site ${alarmItem.site_id}` : undefined);

      return {
        id: (alarmItem.id as string | number) ?? `alm-${idx}`,
        severity: (alarmItem.severity as "warning" | "critical" | "info") ?? "warning",
        object_name: objectName,
        problem: problem,
        site_name: formatSiteName(siteName),
        triggered_at: (alarmItem.triggered_at as string) || new Date().toISOString(),
        time_ago: formatRelativeTime(alarmItem.triggered_at as string),
        status: (rawStatus as AlarmIncidentStatus) || "open",
        status_label: statusLabel,
      };
    });
  }, [alarms]);

  // Kalkulasi total halaman paginasi
  const totalPages = Math.max(
    1,
    Math.ceil(normalizedList.length / itemsPerPage),
  );

  // ── Perlindungan State Paginasi ──
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedAlarms = normalizedList.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Kalkulasi data status infrastruktur secara dinamis
  const infra: IInfraStatusSectionData = useMemo(() => {
    if (infraData) return infraData;
    if (details) {
      return calculateInfrastructureStatus(details, totalDevices);
    }
    return defaultInfraData;
  }, [infraData, details, totalDevices]);

  // Solid badge styling untuk Severity
  const getSeverityStyle = (severity: string) => {
    const s = severity.toLowerCase();
    if (s === "critical") {
      return {
        backgroundColor: "#EB3D4D",
        color: "#FFFFFF",
        label: "CRITICAL",
      };
    }
    if (s === "warning") {
      return {
        backgroundColor: "#F2A602",
        color: "#FFFFFF",
        label: "WARNING",
      };
    }
    return {
      backgroundColor: "#64748B",
      color: "#FFFFFF",
      label: severity.toUpperCase(),
    };
  };

  // Outline badge styling untuk Status
  const getStatusBadgeStyle = (status: string) => {
    const st = status.toLowerCase();
    if (st === "open") {
      return {
        border: "1px solid #EB3D4D",
        color: "#EB3D4D",
        backgroundColor: "transparent",
      };
    }
    if (st === "assigned") {
      return {
        border: "1px solid #F59E0B",
        color: "#D97706",
        backgroundColor: "transparent",
      };
    }
    if (st === "acknowledged" || st === "investigating") {
      return {
        border: "1px solid #3B82F6",
        color: "#2563EB",
        backgroundColor: "transparent",
      };
    }
    if (st === "resolved") {
      return {
        border: "1px solid #10B981",
        color: "#10B981",
        backgroundColor: "transparent",
      };
    }
    return {
      border: "1px solid #94A3B8",
      color: "#64748B",
      backgroundColor: "transparent",
    };
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col gap-4 w-full box-border">
      {/* ── Scoped CSS untuk Fade-in Transition ── */}
      <style>{`
        @keyframes fadeInView {
          from {
            opacity: 0;
            transform: translateY(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .main-card-fade-view {
          animation: fadeInView 0.25s ease-in-out forwards;
          width: 100%;
        }
      `}</style>

      {/* ── 1. Header Bar: Title di Kiri, Segmented Control & CTA di Kanan ── */}
      <div
        className={`flex items-center justify-between flex-wrap gap-3 w-full ${
          isOpen ? "pb-3.5 border-b border-slate-100" : ""
        }`}
      >
        {/* Sisi Kiri: Icon & Title Kontekstual */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
              viewMode === "table"
                ? "bg-amber-50 text-amber-600 border-amber-100"
                : "bg-emerald-50 text-emerald-600 border-emerald-100"
            }`}
          >
            {viewMode === "table" ? (
              <AlertCircle size={18} />
            ) : (
              <Activity size={18} />
            )}
          </div>
          <h2 className="m-0 text-sm font-extrabold text-slate-900 tracking-wide uppercase">
            {viewMode === "table" ? "Active Alarms" : "Infrastructure Status"}
          </h2>
        </div>

        {/* Sisi Kanan: Segmented Control Toggle & Contextual Action */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Control (Pill Toggle) */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Table
            </button>

            <button
              type="button"
              onClick={() => setViewMode("status")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === "status"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 bg-transparent"
              }`}
            >
              Status
            </button>
          </div>

          {/* Contextual Action Button */}
          {viewMode === "table" ? (
            <button
              type="button"
              onClick={onViewAll}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Lihat Semua</span>
              <ChevronRight size={14} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>
                Last updated: <strong className="text-slate-700">{infra.last_updated}</strong>
              </span>
              <button
                type="button"
                onClick={onRefresh}
                className="p-1 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                title="Refresh status infrastruktur"
              >
                <RotateCcw
                  size={13}
                  className={isRefreshing ? "animate-spin" : ""}
                />
              </button>
            </div>
          )}

          {/* ── Toggle Collapse Button ── */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? "Tutup panel Active Alarms"
                : "Buka panel Active Alarms"
            }
            className="border border-slate-200/80 bg-white cursor-pointer text-slate-500 hover:text-slate-900 p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ── 2. Card Body dengan Proteksi Min-Height & Transisi Halus ── */}
      {isOpen && (
        <div
          className={`min-h-[380px] flex flex-col ${
            viewMode === "table" ? "justify-between" : "justify-center"
          }`}
        >
          {viewMode === "table" ? (
            /* ── VIEW A: TABEL ACTIVE ALARMS (Full Width) ── */
            <div key="table-view" className="main-card-fade-view">
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs overflow-x-auto">
                {normalizedList.length === 0 ? (
                  <div className="py-12 px-4 text-center text-slate-500 flex flex-col items-center gap-2">
                    <CheckCircle2 size={36} className="text-emerald-500" />
                    <p className="m-0 font-bold text-sm text-slate-900">
                      Tidak Ada Alarm Aktif
                    </p>
                    <span className="text-xs text-slate-500">
                      Semua perangkat dan infrastruktur terpantau normal.
                    </span>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4 font-bold w-[110px]">
                          Severity
                        </th>
                        <th className="py-3 px-4 font-bold w-[160px]">
                          Object
                        </th>
                        <th className="py-3 px-4 font-bold">
                          Problem
                        </th>
                        <th className="py-3 px-4 font-bold w-[140px]">
                          Site
                        </th>
                        <th className="py-3 px-4 font-bold w-[140px]">
                          Time
                        </th>
                        <th className="py-3 px-4 font-bold text-center w-[110px]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedAlarms.map((alarm) => {
                        const sev = getSeverityStyle(alarm.severity);
                        const st = getStatusBadgeStyle(
                          alarm.status_label || alarm.status,
                        );

                        return (
                          <tr
                            key={alarm.id}
                            onClick={() => onViewAlarmDetail?.(alarm.id)}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            {/* 1. Severity Solid Badge */}
                            <td className="py-3.5 px-4">
                              <span
                                style={{
                                  backgroundColor: sev.backgroundColor,
                                  color: sev.color,
                                }}
                                className="text-[10px] font-extrabold px-2 py-0.5 rounded-md tracking-wider inline-block text-center shadow-2xs"
                              >
                                {sev.label}
                              </span>
                            </td>

                            {/* 2. Object Code (Monospace) */}
                            <td className="py-3.5 px-4 font-bold text-slate-900 font-mono text-xs">
                              {alarm.object_name}
                            </td>

                            {/* 3. Problem Description */}
                            <td className="py-3.5 px-4 text-slate-700 font-medium">
                              {alarm.problem}
                            </td>

                            {/* 4. Site */}
                            <td className="py-3.5 px-4 text-slate-500 text-xs">
                              {alarm.site_name}
                            </td>

                            {/* 5. Time Ago */}
                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
                              {alarm.time_ago}
                            </td>

                            {/* 6. Status Pill (Outlined) */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                style={{
                                  border: st.border,
                                  color: st.color,
                                  backgroundColor: st.backgroundColor,
                                }}
                                className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide"
                              >
                                {alarm.status_label || alarm.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-slate-100 flex-wrap gap-2">
                {/* Tombol Halaman */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => {
                      const isActive = pageNum === currentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-amber-500 text-white shadow-2xs border border-amber-500"
                              : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                {/* Dropdown Items per Halaman */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 bg-white cursor-pointer outline-none shadow-2xs focus:border-amber-500 transition-colors"
                  >
                    <option value={5}>5 / halaman</option>
                    <option value={10}>10 / halaman</option>
                    <option value={20}>20 / halaman</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* ── VIEW B: INFRASTRUCTURE STATUS CARDS (Responsive Grid) ── */
            <div
              key="status-view"
              className="main-card-fade-view flex flex-col gap-6 py-4"
            >
              {/* 3 Status Cards (Grid: 1 col on mobile, 3 cols on md+) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {/* 1. HEALTHY CARD */}
                <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200/80 p-5 flex flex-col items-center gap-1 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1">
                    Healthy
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-tight">
                    {infra.healthy.count}
                  </span>
                  <span className="text-xs text-slate-500">
                    Devices
                  </span>
                  <span className="text-xs font-extrabold text-emerald-600 mt-0.5">
                    {infra.healthy.percentage}%
                  </span>
                </div>

                {/* 2. WARNING CARD */}
                <div className="bg-amber-50/50 rounded-2xl border border-amber-200/80 p-5 flex flex-col items-center gap-1 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-1">
                    Warning
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-tight">
                    {infra.warning.count}
                  </span>
                  <span className="text-xs text-slate-500">
                    Devices
                  </span>
                  <span className="text-xs font-extrabold text-amber-600 mt-0.5">
                    {infra.warning.percentage}%
                  </span>
                </div>

                {/* 3. CRITICAL CARD */}
                <div className="bg-rose-50/50 rounded-2xl border border-rose-200/80 p-5 flex flex-col items-center gap-1 shadow-2xs">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                    <XCircle size={20} />
                  </div>
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider mt-1">
                    Critical
                  </span>
                  <span className="text-3xl font-black text-slate-900 leading-tight">
                    {infra.critical.count}
                  </span>
                  <span className="text-xs text-slate-500">
                    Devices
                  </span>
                  <span className="text-xs font-extrabold text-rose-600 mt-0.5">
                    {infra.critical.percentage}%
                  </span>
                </div>
              </div>

              {/* Segmented Multi-Color Progress Bar */}
              <div className="flex flex-col gap-2">
                <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 flex">
                  <div
                    style={{
                      width: `${infra.healthy.percentage}%`,
                      transition: "width 0.4s ease",
                    }}
                    className="bg-emerald-500 h-full"
                  />
                  <div
                    style={{
                      width: `${infra.warning.percentage}%`,
                      transition: "width 0.4s ease",
                    }}
                    className="bg-amber-500 h-full"
                  />
                  <div
                    style={{
                      width: `${infra.critical.percentage}%`,
                      transition: "width 0.4s ease",
                    }}
                    className="bg-rose-500 h-full"
                  />
                </div>

                {/* Labels di bawah segmented bar */}
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span className="text-emerald-600">
                    {infra.healthy.percentage}% Healthy
                  </span>
                  <span className="text-amber-600">
                    {infra.warning.percentage}% Warning
                  </span>
                  <span className="text-rose-600">
                    {infra.critical.percentage}% Critical
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
