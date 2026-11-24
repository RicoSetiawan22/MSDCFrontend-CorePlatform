import React from "react";
import { Building2, Layers, Cpu, Globe, Wifi, Bell } from "lucide-react";
import type { SiteDependents } from "../../types/site";

interface SiteMiniKPICardsProps {
  dependents?: SiteDependents;
}

export const SiteMiniKPICards: React.FC<SiteMiniKPICardsProps> = ({ dependents }) => {
  const cards = [
    {
      label: "Room",
      value: dependents?.rooms_count ?? 0,
      icon: <Building2 size={16} className="text-blue-600" />,
      iconBg: "bg-blue-50",
    },
    {
      label: "Rack",
      value: dependents?.racks_count ?? 0,
      icon: <Layers size={16} className="text-purple-600" />,
      iconBg: "bg-purple-50",
    },
    {
      label: "Device",
      value: dependents?.devices_count ?? 0,
      icon: <Cpu size={16} className="text-sky-600" />,
      iconBg: "bg-sky-50",
    },
    {
      label: "Alokasi Daya",
      value: dependents?.power_allocations_count ?? 0,
      icon: <Globe size={16} className="text-emerald-600" />,
      iconBg: "bg-emerald-50",
    },
    {
      label: "Alokasi Bandwidth",
      value: dependents?.bandwidth_allocations_count ?? 0,
      icon: <Wifi size={16} className="text-amber-600" />,
      iconBg: "bg-amber-50",
    },
    {
      label: "Kontrak+SSO",
      value:
        (dependents?.contracts?.length ?? 0) +
        (dependents?.sales_orders?.length ?? 0),
      icon: <Bell size={16} className="text-rose-600" />,
      iconBg: "bg-rose-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((c) => (
        <div
          key={c.label}
          className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md hover:border-slate-300 cursor-default select-none will-change-transform min-h-[110px]"
        >
          {/* ── Top row: Icon Bulat di Kiri & Label di Kanan ── */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${c.iconBg}`}
            >
              {c.icon}
            </div>
            <span className="text-xs font-semibold text-slate-700 truncate">
              {c.label}
            </span>
          </div>

          {/* ── Center value: Angka Besar Bold ── */}
          <div className="my-auto pt-2 pb-1 text-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {c.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SiteMiniKPICards;
