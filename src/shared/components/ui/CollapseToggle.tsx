import React from "react";
import { ChevronDown } from "lucide-react";

export interface CollapseToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  isCollapsed?: boolean;
  onToggle: () => void;
  label?: string;
  showText?: string;
  hideText?: string;
}

export const CollapseToggle: React.FC<CollapseToggleProps> = ({
  isOpen,
  isCollapsed,
  onToggle,
  label,
  showText = "Tampilkan Detail",
  hideText = "Sembunyikan",
  className = "",
  ...props
}) => {
  const open = isOpen !== undefined ? isOpen : !isCollapsed;
  const displayText = label || (open ? hideText : showText);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100/90 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors cursor-pointer ${className}`}
      {...props}
    >
      <span>{displayText}</span>
      <ChevronDown
        size={14}
        className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
};
