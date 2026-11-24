import React from "react";

export type AlarmSeverity = "critical" | "major" | "minor" | "warning" | "info" | string;

interface SeverityBadgeProps {
  severity: AlarmSeverity;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = "" }) => {
  const norm = (severity || "").toLowerCase();

  const severityClasses: Record<string, string> = {
    critical: "bg-red-50 text-red-500 border-red-300",
    major: "bg-amber-50 text-amber-500 border-amber-300",
    minor: "bg-amber-50 text-amber-600 border-amber-300",
    warning: "bg-amber-50 text-amber-600 border-amber-300",
    info: "bg-blue-50 text-blue-500 border-blue-300",
  };

  const badgeClass =
    severityClasses[norm] ||
    "bg-slate-100 text-slate-500 border-slate-300";

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${badgeClass} ${className}`}
    >
      {severity}
    </span>
  );
};

export default SeverityBadge;
