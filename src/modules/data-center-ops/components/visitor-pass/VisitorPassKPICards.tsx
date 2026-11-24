import React from "react";
import { UserCheck, Clock, CheckCircle2, Mail, AlertTriangle } from "lucide-react";

export interface VisitorPassKPIStats {
  total: number;
  activeInFacility: number;
  upcoming: number;
  completed?: number;
  pendingRegistration?: number;
  overstayed?: number;
}

interface VisitorPassKPICardsProps {
  stats: VisitorPassKPIStats;
  isLoading?: boolean;
}

export const VisitorPassKPICards: React.FC<VisitorPassKPICardsProps> = ({
  stats,
  isLoading = false,
}) => {
  const pendingCount = stats.pendingRegistration ?? 0;
  const overstayCount = stats.overstayed ?? 0;

  const cards = [
    {
      id: "active",
      title: "AKTIF DI FASILITAS",
      value: stats.activeInFacility,
      icon: <UserCheck size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Sedang di Dalam Gedung",
      badge: stats.activeInFacility > 0 ? "LIVE" : undefined,
      badgeColor: "bg-emerald-100 text-emerald-800",
      specialBorder: undefined,
    },
    {
      id: "upcoming",
      title: "TERJADWAL",
      value: stats.upcoming,
      icon: <Clock size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Siap Check-In",
    },
    {
      id: "pending",
      title: "MENUNGGU REGISTRASI",
      value: pendingCount,
      icon: <Mail size={20} />,
      iconBg: "bg-purple-50 text-purple-600",
      dotColor: "bg-purple-500",
      caption: "Undangan Belum Diisi Tamu",
    },
    {
      id: "overstay",
      title: "OVERSTAY ALERT",
      value: overstayCount,
      icon: <AlertTriangle size={20} />,
      iconBg: overstayCount > 0 ? "bg-rose-500 text-white" : "bg-rose-50 text-rose-600",
      dotColor: "bg-rose-500",
      caption: overstayCount > 0 ? "Melewati Batas Keluar!" : "Tertib Sesuai Jadwal",
      badge: overstayCount > 0 ? "WARNING" : undefined,
      badgeColor: "bg-rose-100 text-rose-800",
      specialBorder:
        overstayCount > 0
          ? "border-rose-400 bg-rose-50/40 ring-2 ring-rose-500/20"
          : undefined,
    },
    {
      id: "completed",
      title: "SELESAI (CHECK-OUT)",
      value: stats.completed ?? 0,
      icon: <CheckCircle2 size={20} />,
      iconBg: "bg-slate-100 text-slate-600",
      dotColor: "bg-slate-500",
      caption: "Riwayat Kunjungan",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse flex flex-col items-center justify-center text-center h-[145px]"
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-24 mb-2" />
            <div className="h-7 bg-slate-100 rounded w-16 mb-2" />
            <div className="h-3 bg-slate-100 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
      {cards.map((card) => {
        return (
          <div
            key={card.id}
            className={`bg-white rounded-xl p-4 shadow-xs border flex flex-col items-center justify-center text-center select-none relative overflow-hidden transition-all duration-200 hover:shadow-sm ${
              card.specialBorder || "border-slate-200/80"
            }`}
          >
            {/* Live / Warning badge indicator */}
            {card.badge && (
              <div className="absolute top-2.5 right-2.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.62rem] font-extrabold ${
                    card.badgeColor || "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
                  {card.badge}
                </span>
              </div>
            )}

            {/* Icon centered */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 shadow-2xs ${card.iconBg}`}
            >
              {card.icon}
            </div>

            {/* Title */}
            <span className="text-[0.7rem] font-bold text-slate-500 tracking-wider uppercase">
              {card.title}
            </span>

            {/* Metric Value */}
            <div className="my-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {card.value.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Bottom Caption */}
            <div className="flex items-center justify-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-100 text-[0.7rem] text-slate-500 w-full">
              <span className={`w-1.5 h-1.5 rounded-full ${card.dotColor}`} />
              <span className="truncate">{card.caption}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
