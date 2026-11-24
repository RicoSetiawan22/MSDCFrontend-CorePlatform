import React, { useMemo } from "react";

export interface DashboardStatusBannerProps {
  isOperational?: boolean;
  statusTitle?: string;
  attentionTitle?: string;
  subtitle?: React.ReactNode;
  lastUpdated?: string;
  badge?: React.ReactNode;
  className?: string;
}

export const DashboardStatusBanner: React.FC<DashboardStatusBannerProps> = ({
  isOperational = true,
  statusTitle = "ALL SYSTEMS OPERATIONAL",
  attentionTitle = "SYSTEM ATTENTION REQUIRED",
  subtitle,
  lastUpdated,
  badge,
  className = "",
}) => {
  const defaultLastUpdated = useMemo(() => {
    return new Date()
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  }, []);

  const displayTime = lastUpdated || defaultLastUpdated;

  return (
    <div
      className={`rounded-xl px-6 py-4 flex items-center justify-between flex-wrap gap-4 transition-all duration-200 ${
        isOperational
          ? "bg-[#ECFDF5] border border-emerald-200/60"
          : "bg-amber-50/70 border border-amber-200/60"
      } ${className}`}
    >
      {/* ── Sisi Kiri: Status Operasional & Subtitle ── */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[0.95rem] font-extrabold tracking-wide uppercase leading-tight ${
              isOperational ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {isOperational ? statusTitle : attentionTitle}
          </span>
          {badge}
        </div>
        {subtitle && (
          <span className="text-xs text-slate-500 font-normal mt-1">
            {subtitle}
          </span>
        )}
      </div>

      {/* ── Sisi Kanan: Last Updated Timestamp ── */}
      <div className="flex flex-col items-end text-right">
        <span className="text-[0.72rem] text-slate-400 font-medium">
          Last updated
        </span>
        <span className="text-sm font-bold text-slate-800 tracking-wider font-mono mt-0.5">
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export default DashboardStatusBanner;
