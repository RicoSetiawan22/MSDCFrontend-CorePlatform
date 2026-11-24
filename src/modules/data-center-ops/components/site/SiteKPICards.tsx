import React, { useState, useRef, useEffect } from "react";
import { Building2, Layers, ShieldCheck, Wrench } from "lucide-react";

export interface SiteKPIStats {
  totalSites: number;
  totalRooms: number;
  activeSites: number;
  maintenanceSites: number;
}

interface SiteKPICardsProps {
  stats: SiteKPIStats;
  isLoading?: boolean;
  activeFilter?: string;
  onFilterChange?: (status: string) => void;
}

export const SiteKPICards: React.FC<SiteKPICardsProps> = ({
  stats,
  isLoading = false,
  activeFilter,
  onFilterChange,
}) => {
  const [clickedCardId, setClickedCardId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cards = [
    {
      id: "all",
      filterValue: "",
      title: "TOTAL SITE",
      value: stats.totalSites,
      icon: <Building2 size={20} />,
      iconBg: "bg-blue-50 text-blue-600",
      dotColor: "bg-blue-500",
      caption: "Keseluruhan Lokasi",
    },
    {
      id: "rooms",
      filterValue: null, // Info-only or custom
      title: "TOTAL ROOMS",
      value: stats.totalRooms,
      icon: <Layers size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-400",
      caption: "Ruang server Terdaftar",
    },
    {
      id: "active",
      filterValue: "active",
      title: "SITE AKTIF",
      value: stats.activeSites,
      icon: <ShieldCheck size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Beroperasi Normal",
    },
    {
      id: "maintenance",
      filterValue: "maintenance",
      title: "DALAM PERBAIKI",
      value: stats.maintenanceSites,
      icon: <Wrench size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Perlu Perhatian",
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
      {cards.map((card) => {
        const isClickable = Boolean(onFilterChange && card.filterValue !== null);
        const isClicked = clickedCardId === card.id;

        return (
          <div
            key={card.id}
            onClick={() => {
              if (isClickable && onFilterChange && card.filterValue !== null) {
                // Toggle off if already active
                if (activeFilter === card.filterValue && card.filterValue !== "") {
                  onFilterChange("");
                } else {
                  onFilterChange(card.filterValue);
                }
              }

              // Efek highlight biru sesaat saat diklik, lalu menghilang secara mulus setelah delay 400ms
              setClickedCardId(card.id);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setClickedCardId(null);
              }, 400);
            }}
            className={`group bg-white rounded-xl border p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg cursor-pointer flex flex-col justify-between will-change-transform active:translate-y-0 active:scale-[0.99] ${
              isClicked
                ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                : "border-slate-200/80 hover:border-slate-300"
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
