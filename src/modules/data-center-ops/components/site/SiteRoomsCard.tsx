import React from "react";
import { DoorOpen } from "lucide-react";
import type { SiteRoom } from "../../types/site";

interface SiteRoomsCardProps {
  rooms?: SiteRoom[];
  onAddRoom?: () => void;
}

export const SiteRoomsCard: React.FC<SiteRoomsCardProps> = ({ rooms = [] }) => {
  const formatRoomType = (type: string) => {
    switch (type) {
      case "server_room":
        return "Server Room";
      case "ups_room":
        return "UPS Room";
      case "meet_me_room":
        return "Meet-Me Room (MMR)";
      case "battery_room":
        return "Battery Room";
      case "generator_room":
        return "Generator Room";
      default:
        return type;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <DoorOpen size={18} className="text-[#0A2140]" />
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Ruangan Terdaftar ({rooms.length})
          </h2>
        </div>
      </div>

      {/* ── Table or Empty State ── */}
      {rooms.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <DoorOpen size={20} />
          </div>
          <p className="text-sm font-semibold text-slate-700">Belum ada ruangan di site ini</p>
          <p className="text-xs text-slate-400">
            Klik tombol &quot;Tambah Room&quot; untuk menambahkan ruangan pertama.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">KODE</th>
                <th className="py-3 px-6">NAMA RUANGAN</th>
                <th className="py-3 px-6">LANTAI / ZONA</th>
                <th className="py-3 px-6">TIPE</th>
                <th className="py-3 px-6 text-right">LUAS AREA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">
                    {room.room_code}
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    {room.room_name}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    Lantai {room.floor || "—"}{room.zone ? ` / Zona ${room.zone}` : ""}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                      {formatRoomType(room.room_type)}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-right font-medium text-slate-700">
                    {room.area_sqm != null ? `${room.area_sqm} m²` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SiteRoomsCard;
