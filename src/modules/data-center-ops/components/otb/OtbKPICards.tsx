import React from "react";
import { Cable, Layers, ShieldCheck, AlertTriangle } from "lucide-react";

export interface OtbKPIMetrics {
  totalOtbs: number;
  capacityDisplay: string;
  usedPorts: number;
  damagedPorts: number;
}

export interface OtbKPICardsProps {
  metrics: OtbKPIMetrics;
  selectedStatus?: string;
  onFilterStatus?: (status: string) => void;
}

export const OtbKPICards: React.FC<OtbKPICardsProps> = ({
  metrics,
  selectedStatus,
  onFilterStatus,
}) => {
  const cards = [
    {
      id: "total_otb",
      statusValue: "",
      title: "TOTAL OTB",
      value: metrics.totalOtbs,
      icon: <Cable size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "• Jumlah OTB",
    },
    {
      id: "port_capacity",
      statusValue: "",
      title: "KAPASITAS PORT",
      value: (
        <span>
          {metrics.capacityDisplay}
          <span className="text-base font-bold text-slate-500 ml-0.5">/OTB</span>
        </span>
      ),
      icon: <Layers size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-500",
      caption: "• Total port di satu OTB",
    },
    {
      id: "used_ports",
      statusValue: "active",
      title: "PORT TERPAKAI",
      value: metrics.usedPorts,
      icon: <ShieldCheck size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "• Total Port Keseluruhan",
    },
    {
      id: "damaged_ports",
      statusValue: "damaged",
      title: "PORT RUSAK",
      value: metrics.damagedPorts,
      icon: <AlertTriangle size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "• Perlu Perhatian",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isClickable = Boolean(card.statusValue && onFilterStatus);
        const isSelected = selectedStatus === card.statusValue && Boolean(card.statusValue);

        return (
          <div
            key={card.id}
            onClick={() => {
              if (isClickable && onFilterStatus) {
                onFilterStatus(isSelected ? "" : card.statusValue);
              }
            }}
            className={`group bg-white rounded-xl border p-5 shadow-sm transition-all duration-300 ease-out flex flex-col justify-between will-change-transform ${
              isClickable
                ? "cursor-pointer hover:-translate-y-1.5 hover:shadow-lg"
                : "hover:-translate-y-1 hover:shadow-md"
            } ${
              isSelected
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/10"
                : "border-slate-200/80"
            }`}
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
              <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]" title={card.caption}>
                {card.caption}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OtbKPICards;
