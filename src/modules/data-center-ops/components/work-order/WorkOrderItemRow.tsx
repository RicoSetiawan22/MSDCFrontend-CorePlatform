import React from "react";
import {
  CheckCircle2,
  Circle,
  Package,
  Wifi,
  Network,
  Server,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@shared/lib/format";
import type { WorkOrderItem, ServiceType } from "../../types/workOrder";
import type { Device } from "../../types/device";
import { WorkOrderResourcePanels } from "./WorkOrderResourcePanels";

export interface WorkOrderItemRowProps {
  item: WorkOrderItem;
  onToggle: () => void;
  disabled?: boolean;
  isToggling?: boolean;
  onAddDevice: (editingDevice?: Device | null) => void;
  onAddCrossConnect: () => void;
  onAllocateIp: () => void;
}

const SERVICE_TAG_CONFIG: Record<
  ServiceType,
  { label: string; className: string }
> = {
  colocation: {
    label: "Colocation",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  bandwidth: {
    label: "Bandwidth",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  cross_connect: {
    label: "Cross-Connect",
    className: "bg-purple-50 text-purple-700 border-purple-200",
  },
  dedicated_server: {
    label: "Dedicated Server",
    className: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  cloud: {
    label: "Cloud",
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  managed_service: {
    label: "Managed Service",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  other: {
    label: "Lainnya",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

function getServiceIcon(serviceType?: ServiceType | null) {
  switch (serviceType) {
    case "colocation":
      return <Package size={17} className="text-blue-600" />;
    case "bandwidth":
      return <Wifi size={17} className="text-emerald-600" />;
    case "cross_connect":
      return <Network size={17} className="text-purple-600" />;
    case "dedicated_server":
    case "cloud":
      return <Server size={17} className="text-indigo-600" />;
    default:
      return <Server size={17} className="text-slate-600" />;
  }
}

export const WorkOrderItemRow: React.FC<WorkOrderItemRowProps> = ({
  item,
  onToggle,
  disabled = false,
  isToggling = false,
  onAddDevice,
  onAddCrossConnect,
  onAllocateIp,
}) => {
  const isDone = item.is_completed;
  const tagConfig = item.service_type
    ? SERVICE_TAG_CONFIG[item.service_type]
    : undefined;

  return (
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
        isDone
          ? "border-emerald-300 bg-emerald-50/20 shadow-2xs"
          : "border-slate-200/90 bg-white hover:border-slate-300"
      }`}
    >
      {/* ── Baris Atas: Checklist Header Item ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={disabled ? undefined : onToggle}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            onToggle();
          }
        }}
        className={`flex items-start gap-3.5 p-4 select-none transition-colors ${
          disabled
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:bg-slate-50/50"
        }`}
      >
        {/* Checkbox Lingkaran Interaktif */}
        <div className="pt-0.5 shrink-0 transition-transform active:scale-90">
          {isToggling ? (
            <Loader2 size={22} className="text-amber-500 animate-spin" />
          ) : isDone ? (
            <CheckCircle2 size={22} className="text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle size={22} className="text-slate-300 hover:text-slate-400" />
          )}
        </div>

        {/* Info Layanan */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="shrink-0">{getServiceIcon(item.service_type)}</span>
            <span
              className={`text-sm font-bold tracking-tight transition-all ${
                isDone ? "text-slate-400 line-through font-medium" : "text-slate-900"
              }`}
            >
              {item.description ?? "Layanan Kontrak"}
            </span>

            {/* Badge Jenis Layanan */}
            {tagConfig && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${tagConfig.className}`}
              >
                {tagConfig.label}
              </span>
            )}
          </div>

          {/* Subtitle Qty */}
          {item.contract_service && (
            <div className="text-xs text-slate-500 mt-1">
              Qty: {Number(item.contract_service.quantity).toLocaleString("id-ID")}
            </div>
          )}

          {/* Timestamp Selesai */}
          {isDone && (
            <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <span>
                ✓ Selesai{" "}
                {item.completed_at ? formatDateTime(item.completed_at) : ""}
                {item.completed_by_user ? ` oleh ${item.completed_by_user.name}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Sub-panel Resource Terpasang (Device, Cross-Connect, IP Address) ── */}
      <WorkOrderResourcePanels
        item={item}
        onAddDevice={onAddDevice}
        onAddCrossConnect={onAddCrossConnect}
        onAllocateIp={onAllocateIp}
      />
    </div>
  );
};

export default WorkOrderItemRow;
