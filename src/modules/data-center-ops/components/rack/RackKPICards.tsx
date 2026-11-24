import React from "react";
import { Building2, DoorOpen, Server, Layers } from "lucide-react";

export interface RackKPIMetrics {
  totalSites: number;
  totalRooms: number;
  activeRacks: number;
  totalRacks: number;
  freeU: number;
  totalU: number;
}

export interface RackKPICardsProps {
  metrics: RackKPIMetrics;
  selectedStatus?: string;
  onFilterStatus?: (status: string) => void;
}

export const RackKPICards: React.FC<RackKPICardsProps> = ({ metrics }) => {
  const cards = [
    {
      id: "total_sites",
      title: "TOTAL SITE",
      value: metrics.totalSites,
      icon: <Building2 size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Keseluruhan Lokasi",
    },
    {
      id: "total_rooms",
      title: "TOTAL ROOMS",
      value: metrics.totalRooms,
      icon: <DoorOpen size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-400",
      caption: "Ruang server Terdaftar",
    },
    {
      id: "active_racks",
      title: "RACK AKTIF",
      value: metrics.activeRacks,
      icon: <Server size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Beroperasi Normal",
    },
    {
      id: "free_capacity",
      title: "SISA KAPASITAS",
      value: `${metrics.freeU} U`,
      icon: <Layers size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: metrics.totalU > 0 ? `Tersedia dari ${metrics.totalU} U` : "Kapasitas U Tersedia",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        return (
          <div
            key={card.id}
            className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between will-change-transform"
          >
            {/* ── Baris Atas: Icon Bulat & Label ── */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 ease-out ${card.iconBg}`}
              >
                {card.icon}
              </div>
              <span className="text-[0.75rem] font-bold text-slate-800 tracking-wider uppercase">
                {card.title}
              </span>
            </div>

            {/* ── Baris Tengah: Nilai Utama (Angka Besar) ── */}
            <div className="my-3 text-center">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </span>
            </div>

            {/* ── Baris Bawah: Indikator Titik & Keterangan ── */}
            <div className="flex items-center justify-center gap-2">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${card.dotColor}`}
              />
              <span className="text-xs text-slate-500 font-medium">
                {card.caption}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RackKPICards;
