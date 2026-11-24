import React from "react";

export interface ProgressBarProps {
  percentage?: number;
  value?: number;
  max?: number;
  maxLabel?: string;
  maxWidth?: string;
  height?: number | string;
  color?: string;
  bgColor?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage: pctProp,
  value,
  max = 100,
  maxLabel: _maxLabel,
  maxWidth,
  height = "h-2",
  color,
  bgColor = "bg-slate-100",
  className = "",
}) => {
  const finalValue = pctProp !== undefined ? pctProp : (value ?? 0);
  const pct = Math.min(Math.max(pctProp !== undefined ? pctProp : (finalValue / max) * 100, 0), 100);

  const getColorClass = () => {
    if (color) return "";
    if (pct > 85) return "bg-rose-500";
    if (pct > 70) return "bg-amber-500";
    return "bg-[#F2A602]";
  };

  return (
    <div
      className={`w-full overflow-hidden rounded-full ${bgColor} ${typeof height === "string" && height.startsWith("h-") ? height : ""} ${className}`}
      style={{
        ...(typeof height === "number" ? { height } : {}),
        ...(maxWidth ? { maxWidth } : {}),
      }}
    >
      <div
        className={`h-full rounded-full transition-all duration-300 ${getColorClass()}`}
        style={{
          width: `${pct}%`,
          ...(color ? { backgroundColor: color } : {}),
        }}
      />
    </div>
  );
};
