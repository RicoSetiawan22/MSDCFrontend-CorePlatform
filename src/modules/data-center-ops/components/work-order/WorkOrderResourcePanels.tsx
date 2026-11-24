import React from "react";
import { Package, Network, Globe2, Server, AlertCircle } from "lucide-react";
import type { WorkOrderItem } from "../../types/workOrder";
import type { Device } from "../../types/device";

export interface WorkOrderResourcePanelsProps {
  item: WorkOrderItem;
  onAddDevice: (editingDevice?: Device | null) => void;
  onAddCrossConnect: () => void;
  onAllocateIp: () => void;
}

const DEVICE_TYPES = ["colocation", "dedicated_server", "cloud"];

export const WorkOrderResourcePanels: React.FC<WorkOrderResourcePanelsProps> = ({
  item,
  onAddDevice,
  onAddCrossConnect,
  onAllocateIp,
}) => {
  if (!item.contract_service) return null;
  const cs = item.contract_service;

  const showDevice = item.service_type && DEVICE_TYPES.includes(item.service_type);
  const showCrossConnect =
    item.service_type === "cross_connect" || cs.requires_cross_connect;
  const showIp = (cs.required_ip_count ?? 0) > 0;

  if (!showDevice && !showCrossConnect && !showIp) return null;

  return (
    <div className="border-t border-slate-200/80 bg-[#FAFBFD] p-4 rounded-b-xl flex flex-col gap-4">
      {/* ── 1. Sub-panel Device Terpasang di Slot ── */}
      {showDevice && (
        <ResourceSubSection
          icon={<Package size={14} className="text-blue-600" />}
          title="DEVICE TERPASANG DI SLOT"
          actionLabel="+ Daftarkan Device"
          onAction={() => onAddDevice(null)}
        >
          {(cs.devices ?? []).length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              Belum ada device didaftarkan di slot ini.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(cs.devices ?? []).map((device) => {
                const isSpare = device.status === "spare";
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between gap-3 text-xs p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Server size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900">
                            {device.device_code}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700 truncate">
                            {device.device_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>
                            {device.rack
                              ? `${device.rack.rack_code} U${device.rack_position_u ?? "?"}`
                              : "Belum terpasang di rack"}
                          </span>
                          {isSpare && (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-bold ml-1">
                              <AlertCircle size={10} /> Placeholder, belum dilengkapi
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSpare && (
                      <button
                        type="button"
                        onClick={() => onAddDevice(device)}
                        className="px-2.5 py-1 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold text-[11px] rounded-md transition-colors cursor-pointer shrink-0"
                      >
                        Lengkapi
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ResourceSubSection>
      )}

      {/* ── 2. Sub-panel Cross-Connect ── */}
      {showCrossConnect && (
        <ResourceSubSection
          icon={<Network size={14} className="text-purple-600" />}
          title="CROSS-CONNECT"
          actionLabel="+ Pasang Cross-Connect"
          onAction={onAddCrossConnect}
        >
          {(cs.cross_connects ?? []).length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              Belum ada cross-connect terpasang.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(cs.cross_connects ?? []).map((cc) => (
                <div
                  key={cc.id}
                  className="flex items-center justify-between gap-3 text-xs p-2.5 bg-white border border-slate-200/80 rounded-lg shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Network size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          {cc.tag_number ?? `CC-${cc.id}`}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="font-semibold text-slate-700">
                          {cc.cable_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {cc.source_location ?? "?"} →{" "}
                        {cc.destination_otb_port
                          ? `${cc.destination_otb_port.otb?.tag_number ?? "OTB"} Port ${cc.destination_otb_port.port_number}`
                          : (cc.destination_location ?? "?")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ResourceSubSection>
      )}

      {/* ── 3. Sub-panel IP Address ── */}
      {showIp && (
        <ResourceSubSection
          icon={<Globe2 size={14} className="text-teal-600" />}
          title={`IP ADDRESS (${(cs.ip_addresses ?? []).length}/${cs.required_ip_count})`}
          actionLabel="+ Alokasi IP"
          onAction={onAllocateIp}
        >
          {(cs.ip_addresses ?? []).length === 0 ? (
            <div className="text-xs text-slate-500 italic py-1">
              Belum ada IP dialokasikan.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              {(cs.ip_addresses ?? []).map((ip) => (
                <span
                  key={ip.id}
                  className="font-mono text-xs font-semibold bg-white border border-slate-200/90 text-slate-800 px-2.5 py-1 rounded-md shadow-2xs inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {ip.ip_address}
                </span>
              ))}
            </div>
          )}
        </ResourceSubSection>
      )}
    </div>
  );
};

interface ResourceSubSectionProps {
  icon: React.ReactNode;
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}

function ResourceSubSection({
  icon,
  title,
  actionLabel,
  onAction,
  children,
}: ResourceSubSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 tracking-wider">
          {icon}
          <span>{title}</span>
        </div>
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer hover:underline"
        >
          <span>{actionLabel}</span>
        </button>
      </div>
      <div>{children}</div>
    </div>
  );
}

export default WorkOrderResourcePanels;
