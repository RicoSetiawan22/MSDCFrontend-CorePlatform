import React, { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  Server,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowRightLeft,
} from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import type {
  RackDetail,
  RackDependentAllocation,
} from "../../types/rack";
import { RackCapacityTelemetryCard } from "./RackCapacityTelemetryCard";
import { RackReleaseModal } from "./RackReleaseModal";
import { RackMoveModal } from "./RackMoveModal";

interface RackDependentsCardProps {
  rack: RackDetail;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const DEVICE_TYPE_MAP: Record<string, { label: string; bg: string; text: string }> = {
  server: { label: "Server", bg: "bg-blue-50", text: "text-blue-700" },
  switch: { label: "Switch", bg: "bg-emerald-50", text: "text-emerald-700" },
  router: { label: "Router", bg: "bg-indigo-50", text: "text-indigo-700" },
  firewall: { label: "Firewall", bg: "bg-rose-50", text: "text-rose-700" },
  ups: { label: "UPS", bg: "bg-amber-50", text: "text-amber-700" },
  pdu: { label: "PDU", bg: "bg-purple-50", text: "text-purple-700" },
  storage: { label: "Storage", bg: "bg-teal-50", text: "text-teal-700" },
  other: { label: "Lainnya", bg: "bg-slate-100", text: "text-slate-700" },
};

export const RackDependentsCard: React.FC<RackDependentsCardProps> = ({
  rack,
  onRefresh,
  isRefreshing = false,
}) => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("rack.manage");

  const [deviceSearch, setDeviceSearch] = useState("");
  const [devicePage, setDevicePage] = useState(1);
  const devicePerPage = 5;

  const [allocationSearch, setAllocationSearch] = useState("");
  const [allocationPage, setAllocationPage] = useState(1);
  const allocationPerPage = 5;

  const [releaseTarget, setReleaseTarget] = useState<RackDependentAllocation | null>(null);
  const [moveTarget, setMoveTarget] = useState<RackDependentAllocation | null>(null);

  const dependents = rack.dependents;
  const devices = dependents?.devices ?? [];
  const allocations = dependents?.allocations ?? [];
  const canDelete = dependents?.can_delete ?? (!devices.length && !allocations.length);

  // Filter devices
  const filteredDevices = useMemo(() => {
    const list = rack.dependents?.devices ?? [];
    const q = deviceSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.device_code?.toLowerCase().includes(q) ||
        d.device_name?.toLowerCase().includes(q) ||
        d.device_type?.toLowerCase().includes(q)
    );
  }, [rack.dependents?.devices, deviceSearch]);

  const totalDevicePages = Math.ceil(filteredDevices.length / devicePerPage) || 1;
  const paginatedDevices = useMemo(() => {
    const start = (devicePage - 1) * devicePerPage;
    return filteredDevices.slice(start, start + devicePerPage);
  }, [filteredDevices, devicePage]);

  // Filter allocations
  const filteredAllocations = useMemo(() => {
    const list = rack.dependents?.allocations ?? [];
    const q = allocationSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.customer?.company_name?.toLowerCase().includes(q) ||
        a.contract?.contract_number?.toLowerCase().includes(q) ||
        `${a.start_u}-${a.end_u}`.includes(q)
    );
  }, [rack.dependents?.allocations, allocationSearch]);

  const totalAllocationPages = Math.ceil(filteredAllocations.length / allocationPerPage) || 1;
  const paginatedAllocations = useMemo(() => {
    const start = (allocationPage - 1) * allocationPerPage;
    return filteredAllocations.slice(start, start + allocationPerPage);
  }, [filteredAllocations, allocationPage]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── 1. Kartu Kapasitas & Penggunaan Daya (Live Telemetri) ── */}
      <RackCapacityTelemetryCard
        rack={rack}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      {/* ── 2. Banner Status Keamanan Hapus Rack ── */}
      {canDelete ? (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-800">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aman untuk Dihapus:</span> Rack ini tidak memiliki
            perangkat terpasang maupun alokasi kontrak customer aktif. Penghapusan rack dapat dilakukan secara aman.
          </div>
        </div>
      ) : (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Tidak Dapat Dihapus (Masih Terikat Dependensi):</span>{" "}
            Rack ini masih memiliki {devices.length} perangkat terpasang dan/atau {allocations.length} alokasi customer aktif di bawah ini. Selesaikan atau pindahkan dependensi sebelum menghapus rack.
          </div>
        </div>
      )}

      {/* ── 3. Sub-Tabel: Device Terpasang di Rack ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6 gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Server size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Device Terpasang
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Daftar server & perangkat jaringan fisik yang terpasang di unit U rack
              </p>
            </div>
            <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {filteredDevices.length} Device
            </span>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari device..."
              value={deviceSearch}
              onChange={(e) => {
                setDeviceSearch(e.target.value);
                setDevicePage(1);
              }}
              className="w-56 sm:w-64 pl-3.5 pr-9 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
            <Search size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Tabel */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDE8B3]/60 text-slate-800 font-bold border-b border-amber-200/40">
                <tr>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider">KODE PERANGKAT</th>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider">NAMA PERANGKAT</th>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider">TIPE</th>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider text-center">POSISI U</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedDevices.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      {deviceSearch ? "Tidak ada device yang sesuai pencarian." : "Belum ada device terpasang di rack ini."}
                    </td>
                  </tr>
                ) : (
                  paginatedDevices.map((d) => {
                    const typeConfig = DEVICE_TYPE_MAP[d.device_type] ?? {
                      label: d.device_type,
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                    };
                    const posText = d.rack_position_u
                      ? d.rack_position_u_end && d.rack_position_u_end !== d.rack_position_u
                        ? `U${d.rack_position_u}–U${d.rack_position_u_end}`
                        : `U${d.rack_position_u}`
                      : "—";

                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                          {d.device_code}
                        </td>
                        <td className="py-3.5 px-5 font-semibold text-slate-800">
                          {d.device_name}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${typeConfig.bg} ${typeConfig.text}`}>
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                            {posText}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginasi Device */}
        {totalDevicePages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Halaman {devicePage} dari {totalDevicePages}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={devicePage <= 1}
                onClick={() => setDevicePage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={devicePage >= totalDevicePages}
                onClick={() => setDevicePage((p) => Math.min(totalDevicePages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Sub-Tabel: Alokasi Customer & Kontrak ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col p-6 gap-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Alokasi Customer / Kontrak
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Reservasi dan penempatan unit U rack untuk penyewa colocation
              </p>
            </div>
            <span className="bg-amber-50 text-amber-700 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {filteredAllocations.length} Alokasi
            </span>
          </div>

          {/* Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Cari alokasi / customer..."
              value={allocationSearch}
              onChange={(e) => {
                setAllocationSearch(e.target.value);
                setAllocationPage(1);
              }}
              className="w-56 sm:w-64 pl-3.5 pr-9 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-2xs"
            />
            <Search size={14} className="absolute right-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Tabel */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDE8B3]/60 text-slate-800 font-bold border-b border-amber-200/40">
                <tr>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider">U-RANGE</th>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider">CUSTOMER</th>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider">NO. KONTRAK</th>
                  <th className="py-3 px-5 text-xs font-bold tracking-wider text-center">STATUS</th>
                  {canManage && <th className="py-3 px-5 text-xs font-bold tracking-wider text-center">AKSI</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="py-8 text-center text-slate-400">
                      {allocationSearch ? "Tidak ada alokasi yang sesuai pencarian." : "Belum ada alokasi customer di rack ini."}
                    </td>
                  </tr>
                ) : (
                  paginatedAllocations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-amber-700">
                        {a.start_u}–{a.end_u} U
                      </td>
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {a.customer?.company_name ?? "—"}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">
                        {a.contract?.contract_number ?? <span className="text-slate-400 italic">Tanpa Kontrak</span>}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            a.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                              : "bg-amber-50 text-amber-700 border-amber-200/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              a.status === "active" ? "bg-emerald-500" : "bg-amber-500"
                            }`}
                          />
                          <span>{a.status === "active" ? "Aktif" : "Reserved"}</span>
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-3.5 px-5 text-center">
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setReleaseTarget(a)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer active:scale-95"
                              title="Ajukan Release Alokasi"
                            >
                              <LogOut size={12} />
                              <span>Ajukan Release</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMoveTarget(a)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer active:scale-95"
                              title="Ajukan Pindah Alokasi"
                            >
                              <ArrowRightLeft size={12} />
                              <span>Ajukan Pindah</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginasi Alokasi */}
        {totalAllocationPages > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Halaman {allocationPage} dari {totalAllocationPages}</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={allocationPage <= 1}
                onClick={() => setAllocationPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={allocationPage >= totalAllocationPages}
                onClick={() => setAllocationPage((p) => Math.min(totalAllocationPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 5. Modals Terkait (Release & Move Alokasi) ── */}
      {releaseTarget && (
        <RackReleaseModal
          allocation={releaseTarget}
          onClose={() => setReleaseTarget(null)}
        />
      )}

      {moveTarget && (
        <RackMoveModal
          allocation={moveTarget}
          currentRackId={rack.id}
          onClose={() => setMoveTarget(null)}
        />
      )}
    </div>
  );
};

export default RackDependentsCard;
