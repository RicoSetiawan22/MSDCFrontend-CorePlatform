import React from "react";
import { Layers, Zap, Server, ShieldCheck } from "lucide-react";
import type { Device } from "../../types/device";

export interface DeviceMiniKPICardsProps {
  device: Device;
}

export const DeviceMiniKPICards: React.FC<DeviceMiniKPICardsProps> = ({ device }) => {
  // Format Daya
  const powerDisplay =
    device.power_watt !== null && device.power_watt !== undefined
      ? `${Number(device.power_watt).toLocaleString("id-ID")} W`
      : "—";

  // Format Posisi U
  let uSlotDisplay = "Gudang / Tanpa Slot";
  if (device.rack_position_u) {
    if (device.rack_position_u_end && device.rack_position_u_end !== device.rack_position_u) {
      const uSpan = device.rack_position_u_end - device.rack_position_u + 1;
      uSlotDisplay = `U${device.rack_position_u} - U${device.rack_position_u_end} (${uSpan}U)`;
    } else {
      uSlotDisplay = `U${device.rack_position_u} (1U)`;
    }
  }

  const rackCaption = device.rack?.rack_code
    ? `Rack ${device.rack.rack_code}${device.site_room?.room_code ? ` • ${device.site_room.room_code}` : ""}`
    : "Belum dialokasikan ke rack";

  const cards = [
    {
      id: "type",
      title: "TIPE PERANGKAT",
      value: (device.device_type || "server").toUpperCase(),
      icon: <Layers size={18} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Klasifikasi Infrastruktur",
    },
    {
      id: "power",
      title: "KONSUMSI DAYA",
      value: powerDisplay,
      icon: <Zap size={18} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Beban Daya Terukur",
    },
    {
      id: "rack_slot",
      title: "ALOKASI RACK",
      value: uSlotDisplay,
      icon: <Server size={18} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: rackCaption,
    },
    {
      id: "status",
      title: "STATUS OPERASIONAL",
      value:
        device.status === "active"
          ? "AKTIF"
          : device.status === "spare"
          ? "SPARE"
          : device.status === "maintenance"
          ? "MAINTENANCE"
          : "DIDECOMMISSION",
      icon: <ShieldCheck size={18} />,
      iconBg: "bg-indigo-50 text-indigo-600",
      dotColor: device.status === "active" ? "bg-emerald-500" : "bg-amber-500",
      caption: "Kondisi Operasional Perangkat",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="group bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md flex flex-col justify-between will-change-transform"
        >
          {/* Top: Icon & Title */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ease-out ${card.iconBg}`}
            >
              {card.icon}
            </div>
            <span className="text-[0.72rem] font-bold text-slate-700 tracking-wider uppercase">
              {card.title}
            </span>
          </div>

          {/* Middle: Big Value */}
          <div className="my-2.5 text-center">
            <span className="text-xl font-black text-slate-900 tracking-tight">
              {card.value}
            </span>
          </div>

          {/* Bottom: Dot Indicator & Caption */}
          <div className="flex items-center justify-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${card.dotColor}`} />
            <span className="text-xs text-slate-500 font-medium truncate" title={card.caption}>
              {card.caption}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeviceMiniKPICards;
