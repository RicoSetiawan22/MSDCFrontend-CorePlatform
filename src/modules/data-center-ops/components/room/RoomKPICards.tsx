import React, { useState, useRef, useEffect, useMemo } from "react";
import { DoorOpen, Server, Network, Zap } from "lucide-react";

export interface RoomKPIStats {
  totalRooms: number;
  serverRooms: number;
  networkRooms: number;
  upsRooms: number;
}

export interface RoomKPICardsProps {
  stats?: RoomKPIStats;
  metrics?: RoomKPIStats;
  rooms?: Array<{ room_type?: string }>;
  isLoading?: boolean;
  activeFilter?: string;
  selectedType?: string;
  onFilterChange?: (type: string) => void;
  onFilterType?: (type: string) => void;
}

export const RoomKPICards: React.FC<RoomKPICardsProps> = ({
  stats: propStats,
  metrics: propMetrics,
  rooms,
  isLoading = false,
  activeFilter,
  selectedType,
  onFilterChange,
  onFilterType,
}) => {
  const [clickedCardId, setClickedCardId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentFilter = activeFilter ?? selectedType ?? "";
  const handleFilter = onFilterChange ?? onFilterType;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stats = useMemo<RoomKPIStats>(() => {
    if (propStats) return propStats;
    if (propMetrics) return propMetrics;
    if (rooms) {
      let serverRooms = 0;
      let networkRooms = 0;
      let upsRooms = 0;

      rooms.forEach((r) => {
        const type = (r.room_type ?? "").toLowerCase();
        if (type === "server_room") serverRooms += 1;
        else if (type === "network_room") networkRooms += 1;
        else if (type === "ups_room") upsRooms += 1;
      });

      return {
        totalRooms: rooms.length,
        serverRooms,
        networkRooms,
        upsRooms,
      };
    }
    return {
      totalRooms: 0,
      serverRooms: 0,
      networkRooms: 0,
      upsRooms: 0,
    };
  }, [propStats, propMetrics, rooms]);

  const cards = [
    {
      id: "all",
      filterValue: "",
      title: "TOTAL RUANGAN",
      value: stats.totalRooms,
      icon: <DoorOpen size={20} />,
      iconBg: "bg-slate-100 text-slate-700",
      dotColor: "bg-slate-400",
      caption: "Keseluruhan Ruangan",
    },
    {
      id: "server_room",
      filterValue: "server_room",
      title: "SERVER ROOM",
      value: stats.serverRooms,
      icon: <Server size={20} />,
      iconBg: "bg-emerald-50 text-emerald-600",
      dotColor: "bg-emerald-500",
      caption: "Ruang Komputasi & Rack",
    },
    {
      id: "network_room",
      filterValue: "network_room",
      title: "NETWORK ROOM",
      value: stats.networkRooms,
      icon: <Network size={20} />,
      iconBg: "bg-slate-100 text-slate-800",
      dotColor: "bg-slate-600",
      caption: "Distribusi Jaringan & MMR",
    },
    {
      id: "ups_room",
      filterValue: "ups_room",
      title: "UPS & POWER",
      value: stats.upsRooms,
      icon: <Zap size={20} />,
      iconBg: "bg-amber-50 text-amber-600",
      dotColor: "bg-amber-500",
      caption: "Kelistrikan & Cadangan Daya",
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
        const isClickable = Boolean(handleFilter && card.filterValue !== null);
        const isSelected = currentFilter === card.filterValue && Boolean(card.filterValue);
        const isClicked = clickedCardId === card.id;

        return (
          <div
            key={card.id}
            onClick={() => {
              if (isClickable && handleFilter) {
                if (currentFilter === card.filterValue && card.filterValue !== "") {
                  handleFilter("");
                } else {
                  handleFilter(card.filterValue);
                }
              }

              setClickedCardId(card.id);
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              timeoutRef.current = setTimeout(() => {
                setClickedCardId(null);
              }, 400);
            }}
            className={`group bg-white rounded-xl border p-5 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between will-change-transform active:translate-y-0 active:scale-[0.99] ${
              isClickable ? "cursor-pointer" : ""
            } ${
              isSelected || isClicked
                ? "border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-50/10"
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

export default RoomKPICards;
