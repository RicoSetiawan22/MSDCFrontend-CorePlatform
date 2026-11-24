import React, { useState, useEffect } from "react";
import { X, Loader2, ArrowRightLeft, AlertCircle } from "lucide-react";
import { useMoveDevice } from "../api/useDevices";
import { useSiteList } from "../api/useSites";
import { useRoomList } from "../api/useRooms";
import { useRackList } from "../api/useRacks";
import { extractErrorMessage } from "@shared/types/api";
import type { Device } from "../types/device";

export interface DeviceMoveModalProps {
  device: Device;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DeviceMoveModal({ device, onClose, onSuccess }: DeviceMoveModalProps) {
  const [siteId, setSiteId] = useState(device.site_id ? String(device.site_id) : "");
  const [roomId, setRoomId] = useState(device.site_room_id ? String(device.site_room_id) : "");
  const [rackId, setRackId] = useState(device.rack_id ? String(device.rack_id) : "");
  const [positionU, setPositionU] = useState(device.rack_position_u ? String(device.rack_position_u) : "");
  const [positionUEnd, setPositionUEnd] = useState(device.rack_position_u_end ? String(device.rack_position_u_end) : "");
  const [error, setError] = useState<string | null>(null);

  const { data: sitesPage, isLoading: sitesLoading } = useSiteList({ per_page: 100 });
  const { data: rooms, isLoading: roomsLoading } = useRoomList(siteId ? Number(siteId) : undefined);
  const { data: racksPage, isLoading: racksLoading } = useRackList({ site_room_id: roomId ? Number(roomId) : undefined, per_page: 100 });

  const move = useMoveDevice(device.id);

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !move.isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, move.isPending]);

  function handleSiteChange(value: string) {
    setSiteId(value);
    setRoomId("");
    setRackId("");
    setPositionU("");
    setPositionUEnd("");
  }

  function handleRoomChange(value: string) {
    setRoomId(value);
    setRackId("");
    setPositionU("");
    setPositionUEnd("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (positionUEnd && positionU && Number(positionUEnd) < Number(positionU)) {
      setError("Posisi U Akhir tidak boleh lebih kecil dari Posisi U.");
      return;
    }
    setError(null);

    try {
      await move.mutateAsync({
        site_id: siteId ? Number(siteId) : null,
        site_room_id: roomId ? Number(roomId) : null,
        rack_id: rackId ? Number(rackId) : null,
        rack_position_u: positionU ? Number(positionU) : null,
        rack_position_u_end: positionUEnd ? Number(positionUEnd) : null,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={move.isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[520px] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-move-modal-title"
      >
        {/* ── Modal Header ── */}
        <div className="px-7 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h2
                id="device-move-modal-title"
                className="text-base font-bold text-[#0A2140] tracking-tight leading-tight"
              >
                Pindahkan Lokasi Perangkat
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {device.device_code} — {device.device_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={move.isPending}
            aria-label="Tutup modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-7 py-5 flex flex-col gap-4 overflow-y-auto">
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-800 leading-relaxed">
              📍 Pilih lokasi fisik baru. Kosongkan Room atau Rack jika perangkat hanya disimpan sementara di gudang tanpa alokasi rack unit spesifik.
            </div>

            {/* Site Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Site Data Center
              </label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50"
                value={siteId}
                disabled={sitesLoading || move.isPending}
                onChange={(e) => handleSiteChange(e.target.value)}
              >
                <option value="">— Tanpa site (Unassigned) —</option>
                {(sitesPage?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_code} — {s.site_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Room Picker */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Room / Ruang Server
              </label>
              <select
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={roomId}
                disabled={!siteId || roomsLoading || move.isPending}
                onChange={(e) => handleRoomChange(e.target.value)}
              >
                <option value="">— Tanpa room spesifik —</option>
                {(rooms ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.room_code} — {r.room_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rack & U-position Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Rack Unit
                </label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  value={rackId}
                  disabled={!roomId || racksLoading || move.isPending}
                  onChange={(e) => {
                    setRackId(e.target.value);
                    setPositionU("");
                    setPositionUEnd("");
                  }}
                >
                  <option value="">— Tanpa rack spesifik —</option>
                  {(racksPage?.data ?? []).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.rack_code} {r.rack_name ? `— ${r.rack_name}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  Posisi U
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="mis. 6"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  value={positionU}
                  onChange={(e) => setPositionU(e.target.value)}
                  disabled={!rackId || move.isPending}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  s/d U
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder={positionU || "—"}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                  value={positionUEnd}
                  onChange={(e) => setPositionUEnd(e.target.value)}
                  disabled={!rackId || move.isPending}
                />
              </div>
            </div>

            {error ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
                <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            ) : null}
          </div>

          {/* ── Modal Footer ── */}
          <div className="px-7 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={move.isPending}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={move.isPending}
              className="px-5 py-2.5 text-sm font-bold text-white bg-[#E59B00] hover:bg-[#D48F00] active:scale-98 rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {move.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memindahkan...</span>
                </>
              ) : (
                <span>Simpan Lokasi Baru</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeviceMoveModal;
