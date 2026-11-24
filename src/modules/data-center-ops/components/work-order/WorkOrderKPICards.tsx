import React from "react";
import { ClipboardList, Activity, Clock, CheckCircle2 } from "lucide-react";

export interface WorkOrderKPIMetrics {
  totalWorkOrders: number;
  inProgressWorkOrders: number;
  unstartedWorkOrders: number;
  readyForTestingWorkOrders: number;
}

export interface WorkOrderKPICardsProps {
  metrics: WorkOrderKPIMetrics;
}

export const WorkOrderKPICards: React.FC<WorkOrderKPICardsProps> = ({
  metrics,
}) => {
  const cards = [
    {
      id: "total_wo",
      title: "TOTAL ANTREAN",
      value: metrics.totalWorkOrders.toLocaleString("id-ID"),
      icon: <ClipboardList size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Seluruh Antrean Aktif",
    },
    {
      id: "in_progress_wo",
      title: "DALAM PENGERJAAN",
      value: metrics.inProgressWorkOrders.toLocaleString("id-ID"),
      icon: <Activity size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Sedang Dikerjakan Teknisi",
    },
    {
      id: "unstarted_wo",
      title: "MENUNGGU PENGERJAAN",
      value: metrics.unstartedWorkOrders.toLocaleString("id-ID"),
      icon: <Clock size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-500",
      caption: "Belum Ada Item Dikerjakan",
    },
    {
      id: "ready_testing_wo",
      title: "SIAP TESTING",
      value: metrics.readyForTestingWorkOrders.toLocaleString("id-ID"),
      icon: <CheckCircle2 size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Layanan Fisik Rampung",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.id}
          className="group bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-md flex flex-col justify-between will-change-transform select-none"
        >
          {/* ── Baris Atas: Icon Bulat & Label ── */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 ease-out ${card.iconBg}`}
            >
              {card.icon}
            </div>
            <span className="text-[0.75rem] font-bold text-slate-800 tracking-wider uppercase">
              {card.title}
            </span>
          </div>

          {/* ── Baris Tengah: Nilai Utama (Angka Besar Centered) ── */}
          <div className="my-3 text-center flex items-center justify-center gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {card.value}
            </span>
          </div>

          {/* ── Baris Bawah: Indikator Titik & Keterangan (Centered) ── */}
          <div className="flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${card.dotColor}`}
            />
            <span
              className="text-xs text-slate-500 font-medium truncate max-w-[200px]"
              title={card.caption}
            >
              {card.caption}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default WorkOrderKPICards;
