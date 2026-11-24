import React from "react";
import { Network, Globe, Radio, Shield } from "lucide-react";

export interface IpamKPIMetrics {
  totalSubnets: number;
  totalIpCapacity: number;
  publicSubnets: number;
  privateSubnets: number;
}

export interface IpamKPICardsProps {
  metrics: IpamKPIMetrics;
}

export const IpamKPICards: React.FC<IpamKPICardsProps> = ({ metrics }) => {
  const cards = [
    {
      id: "total_subnets",
      title: "TOTAL SUBNET",
      value: metrics.totalSubnets.toLocaleString("id-ID"),
      suffix: "",
      icon: <Network size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Total Subnet Terdaftar",
    },
    {
      id: "total_ip_capacity",
      title: "KAPASITAS IP",
      value: metrics.totalIpCapacity.toLocaleString("id-ID"),
      suffix: "/HOST",
      icon: <Globe size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-500",
      caption: "Estimasi Alamat IPv4",
    },
    {
      id: "public_subnets",
      title: "SUBNET PUBLIC",
      value: metrics.publicSubnets.toLocaleString("id-ID"),
      suffix: "",
      icon: <Radio size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Jaringan Publik & Internet",
    },
    {
      id: "private_subnets",
      title: "SUBNET PRIVATE",
      value: metrics.privateSubnets.toLocaleString("id-ID"),
      suffix: "",
      icon: <Shield size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Jaringan Internal DC & LAN",
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
            {card.suffix && (
              <span className="text-xs font-semibold text-slate-400">
                {card.suffix}
              </span>
            )}
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

export default IpamKPICards;
