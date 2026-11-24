import React from "react";
import { AlertTriangle, AlertCircle, Info, Check, CheckCheck } from "lucide-react";
import type { Alarm } from "../../types/monitoring";
import { formatMonitoringTimestamp } from "./metricThresholdEvaluator";

interface MonitoringAlarmBannerProps {
  alarms: Alarm[];
  onAcknowledge: (id: number) => void;
  onResolve: (id: number) => void;
  isAckPending?: boolean;
  isResolvePending?: boolean;
}

export const MonitoringAlarmBanner: React.FC<MonitoringAlarmBannerProps> = React.memo(({
  alarms,
  onAcknowledge,
  onResolve,
  isAckPending = false,
  isResolvePending = false,
}) => {
  if (!alarms || alarms.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {alarms.map((alarm) => {
        const isCritical = alarm.severity === "critical";
        const isWarning = alarm.severity === "warning";

        const bgClass = isCritical
          ? "bg-rose-50/90 border-rose-200"
          : isWarning
          ? "bg-[#FEF7E6] border-[#FDE8B3]"
          : "bg-blue-50/90 border-blue-200";

        const textClass = isCritical
          ? "text-rose-900"
          : isWarning
          ? "text-amber-900"
          : "text-blue-900";

        const badgeBg = isCritical
          ? "bg-rose-100 text-rose-800 border-rose-200"
          : isWarning
          ? "bg-[#FDE8B3] text-[#B54708] border-[#F2A602]/30"
          : "bg-blue-100 text-blue-800 border-blue-200";

        return (
          <div
            key={alarm.id}
            className={`rounded-xl border p-3.5 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm transition-all ${bgClass}`}
          >
            {/* Left: Icon, Title & Badge */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/80 shadow-xs shrink-0">
                {isCritical ? (
                  <AlertCircle className="w-5 h-5 text-rose-600 animate-bounce" />
                ) : isWarning ? (
                  <AlertTriangle className="w-5 h-5 text-[#F2A602]" />
                ) : (
                  <Info className="w-5 h-5 text-blue-600" />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs sm:text-sm font-bold tracking-tight uppercase ${textClass}`}>
                  {alarm.severity}: {alarm.message || `Metrik ${alarm.alarm_type}`}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide border ${badgeBg}`}>
                  Alarm Aktif ({alarm.status})
                </span>
              </div>
            </div>

            {/* Right: Timestamp & Action Buttons */}
            <div className="flex items-center justify-between md:justify-end gap-3.5 pt-2 md:pt-0 border-t md:border-t-0 border-black/5">
              <span className="text-xs font-medium text-slate-500 font-mono">
                {formatMonitoringTimestamp(alarm.triggered_at)} WIB
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onAcknowledge(alarm.id)}
                  disabled={isAckPending || alarm.status === "acknowledged"}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-slate-500" />
                  Ack
                </button>

                <button
                  type="button"
                  onClick={() => onResolve(alarm.id)}
                  disabled={isResolvePending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-md text-xs font-semibold bg-[#00B074] hover:bg-[#009663] text-white shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Resolve
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

MonitoringAlarmBanner.displayName = "MonitoringAlarmBanner";
