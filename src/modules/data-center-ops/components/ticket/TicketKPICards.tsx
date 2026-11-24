import React from "react";
import { Ticket as TicketIcon, Activity, Wrench, AlertTriangle } from "lucide-react";

export interface TicketKPIMetrics {
  total: number;
  openCount: number;
  remoteHandsCount: number;
  overdueCount: number;
}

export interface TicketKPICardsProps {
  metrics: TicketKPIMetrics;
}

export const TicketKPICards: React.FC<TicketKPICardsProps> = ({ metrics }) => {
  const cards = [
    {
      id: "total_ticket",
      title: "TOTAL TIKET",
      value: metrics.total,
      icon: <TicketIcon size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      caption: "• Jumlah Tiket",
    },
    {
      id: "open_tickets",
      title: "TIKET AKTIF",
      value: metrics.openCount,
      icon: <Activity size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      caption: "• Sedang Ditangani",
    },
    {
      id: "remote_hands",
      title: "REMOTE HANDS",
      value: metrics.remoteHandsCount,
      icon: <Wrench size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      caption: "• Total Permintaan",
    },
    {
      id: "overdue_tickets",
      title: "SLA OVERDUE",
      value: metrics.overdueCount,
      icon: <AlertTriangle size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      caption: "• Perlu Perhatian",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300 ease-out flex flex-col justify-between will-change-transform select-none"
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

          {/* ── Baris Tengah: Nilai Utama (Angka Besar Centered) ── */}
          <div className="my-3 text-center">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {card.value.toLocaleString("id-ID")}
            </span>
          </div>

          {/* ── Baris Bawah: Keterangan (Centered) ── */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
              {card.caption}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketKPICards;
