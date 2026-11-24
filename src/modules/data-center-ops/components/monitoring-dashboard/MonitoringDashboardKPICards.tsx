import React from "react";
import { Server, Radio, Thermometer, Droplets } from "lucide-react";

export interface MonitoringKPIStats {
  totalRacks: number;
  monitoredCount: number;
  avgTemp: string | null;
  avgHum: string | null;
  normalCount: number;
  warningCount: number;
  criticalCount: number;
}

interface MonitoringDashboardKPICardsProps {
  stats: MonitoringKPIStats;
  isLoading?: boolean;
}

export const MonitoringDashboardKPICards: React.FC<MonitoringDashboardKPICardsProps> = ({
  stats,
  isLoading = false,
}) => {
  const cards = [
    {
      id: "total",
      title: "TOTAL RAK INVENTORI",
      value: stats.totalRacks,
      icon: <Server size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-400",
      caption: "Unit Rak Terdaftar",
    },
    {
      id: "monitored",
      title: "TELEMETRI SENSOR AKTIF",
      value: stats.monitoredCount,
      icon: <Radio size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Membaca Suhu & Hum Live",
    },
    {
      id: "temperature",
      title: "RATA-RATA SUHU",
      value: stats.avgTemp !== null ? `${stats.avgTemp}°C` : "-",
      icon: <Thermometer size={20} />,
      iconBg: "bg-rose-50 text-rose-600",
      dotColor: "bg-rose-500",
      caption: "Target Ideal: 18°C – 27°C",
    },
    {
      id: "humidity",
      title: "RATA-RATA KELEMBAPAN",
      value: stats.avgHum !== null ? `${stats.avgHum}%` : "-",
      icon: <Droplets size={20} />,
      iconBg: "bg-cyan-50 text-cyan-600",
      dotColor: "bg-cyan-500",
      caption: "Target Ideal: 40% – 60%",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse flex flex-col justify-between h-[150px]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100" />
              <div className="h-4 bg-slate-100 rounded w-24" />
            </div>
            <div className="my-auto">
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
            <div className="h-3 bg-slate-100 rounded w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg cursor-pointer flex flex-col justify-between will-change-transform active:translate-y-0 active:scale-[0.99]"
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
            <span className="text-3xl font-extrabold text-[#0A2140] tracking-tight group-hover:text-[#E59B00] transition-colors">
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
      ))}
    </div>
  );
};

export default MonitoringDashboardKPICards;
