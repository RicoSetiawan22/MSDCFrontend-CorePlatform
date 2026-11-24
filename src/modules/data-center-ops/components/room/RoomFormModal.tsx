import React, { useState, useEffect, type FormEvent } from "react";
import { X, Loader2, AlertCircle, Building2 } from "lucide-react";
import { useCreateRoom, useUpdateRoom } from "../../api/useRooms";
import { useSiteList } from "../../api/useSites";
import { extractErrorMessage } from "@shared/types/api";
import { generateRoomCode } from "../../utils/roomCodeGenerator";
import type { RoomItem } from "./RoomTable";

export interface RoomFormModalProps {
  room?: RoomItem | null;
  defaultSiteId?: number;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  room,
  defaultSiteId,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return (
    <RoomFormModalContent
      key={room?.id ?? `new-${defaultSiteId ?? "general"}`}
      room={room}
      defaultSiteId={defaultSiteId}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

interface RoomFormModalContentProps {
  room?: RoomItem | null;
  defaultSiteId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

function RoomFormModalContent({
  room,
  defaultSiteId,
  onClose,
  onSuccess,
}: RoomFormModalContentProps) {
  const isEdit = Boolean(room);

  // Initial siteId
  const initialSiteId = room?.site_id
    ? String(room.site_id)
    : defaultSiteId
    ? String(defaultSiteId)
    : "";

  const [siteId, setSiteId] = useState<string>(initialSiteId);
  const [form, setForm] = useState({
    room_name: room?.room_name ?? "",
    floor: room?.floor ?? "",
    zone: room?.zone ?? "",
    room_type: room?.room_type ?? "server_room",
    area_sqm: room?.area_sqm != null ? String(room.area_sqm) : "",
  });

  const [isCustomCode, setIsCustomCode] = useState(false);
  const [roomCode, setRoomCode] = useState(() =>
    isEdit ? (room?.room_code ?? "") : generateRoomCode(room?.floor ?? "", room?.room_type ?? "server_room")
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: sitesPage, isLoading: isSitesLoading } = useSiteList({ per_page: 100 });

  const activeSiteIdNumber = isEdit ? Number(room?.site_id) : Number(siteId);

  const createMutation = useCreateRoom(activeSiteIdNumber || 0);
  const updateMutation = useUpdateRoom(activeSiteIdNumber || 0, room?.id ?? 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Handle ESC key to dismiss modal safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!isEdit && !isCustomCode && (key === "floor" || key === "room_type")) {
        const auto = generateRoomCode(
          key === "floor" ? value : next.floor,
          key === "room_type" ? value : next.room_type
        );
        setRoomCode(auto);
      }
      return next;
    });

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCustomCodeChange = (val: string) => {
    setRoomCode(val.toUpperCase());
    setIsCustomCode(true);
  };

  const handleResetToAutoCode = () => {
    const auto = generateRoomCode(form.floor, form.room_type);
    setRoomCode(auto);
    setIsCustomCode(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEdit && !siteId) {
      newErrors.siteId = "Silakan pilih Site terlebih dahulu.";
    }

    if (!form.room_name.trim()) {
      newErrors.room_name = "Nama room wajib diisi.";
    } else if (form.room_name.trim().length < 2) {
      newErrors.room_name = "Nama room minimal 2 karakter.";
    }

    if (form.area_sqm && isNaN(Number(form.area_sqm))) {
      newErrors.area_sqm = "Luas harus berupa angka valid.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validate()) return;

    try {
      const payload = {
        room_code: isEdit ? undefined : (roomCode.trim() || undefined),
        room_name: form.room_name.trim(),
        floor: form.floor.trim() || undefined,
        zone: form.zone.trim() || undefined,
        room_type: form.room_type,
        area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined,
      };

      if (isEdit) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setApiError(extractErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[520px] p-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-form-title"
      >
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Tutup"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X size={18} />
        </button>

        {/* ── Header Modal ── */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#E59B00] shrink-0">
            <Building2 size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3 id="room-form-title" className="text-base font-bold text-slate-900 leading-tight">
              {isEdit ? "Edit Room" : "Tambah Room Baru"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? `Perbarui informasi ruangan ${room?.room_code ?? ""}`
                : "Daftarkan ruangan data center baru pada site yang dipilih"}
            </p>
          </div>
        </div>

        {/* ── Form Content ── */}
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          {/* Site Selector / Site Info */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Data Center Site <span className="text-rose-500">*</span>
            </label>
            {isEdit ? (
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>{room?.site_name ?? `Site ID: ${room?.site_id}`}</span>
                {room?.site_code && (
                  <span className="font-mono text-slate-500">{room.site_code}</span>
                )}
              </div>
            ) : (
              <select
                value={siteId}
                onChange={(e) => {
                  setSiteId(e.target.value);
                  if (errors.siteId) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.siteId;
                      return next;
                    });
                  }
                }}
                disabled={isSitesLoading || isPending}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer ${
                  errors.siteId ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
                }`}
              >
                <option value="">— Pilih Data Center Site —</option>
                {(sitesPage?.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.site_name} ({s.site_code})
                  </option>
                ))}
              </select>
            )}
            {errors.siteId && (
              <p className="text-[11px] text-rose-500 mt-1">{errors.siteId}</p>
            )}
          </div>

          {/* Kode Room Field (Auto-generate dengan opsi penyesuaian manual) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Kode Room {isEdit ? "" : "(Auto-generate)"}
              </label>
              {!isEdit && isCustomCode && (
                <button
                  type="button"
                  onClick={handleResetToAutoCode}
                  className="text-[11px] text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline transition-colors"
                >
                  Reset ke Auto ({generateRoomCode(form.floor, form.room_type)})
                </button>
              )}
            </div>
            <input
              type="text"
              value={isEdit ? (room?.room_code ?? "") : roomCode}
              onChange={isEdit ? undefined : (e) => handleCustomCodeChange(e.target.value)}
              disabled={isEdit || isPending}
              placeholder="mis. R2-SRV"
              className={`w-full px-3 py-2 text-xs font-mono font-bold rounded-xl transition-all ${
                isEdit
                  ? "bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed"
                  : "bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              }`}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              {isEdit
                ? "Kode room bersifat permanen dan diatur otomatis oleh sistem."
                : isCustomCode
                ? "Kode room disesuaikan secara manual. Klik 'Reset ke Auto' untuk kembali ke format standar."
                : "Kode otomatis mengikuti Lantai & Tipe Room: R{lantai}-{tipe} (mis. R2-SRV, R2-NET)."}
            </p>
          </div>

          {/* Tipe Room & Nama Room */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tipe Room
              </label>
              <select
                value={form.room_type}
                onChange={(e) => setField("room_type", e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="server_room">Server Room</option>
                <option value="network_room">Network Room</option>
                <option value="ups_room">UPS & Power Room</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Room <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="mis. Server Room Utama"
                value={form.room_name}
                onChange={(e) => setField("room_name", e.target.value)}
                disabled={isPending}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all ${
                  errors.room_name ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.room_name && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.room_name}</p>
              )}
            </div>
          </div>

          {/* Lantai, Zone, Luas */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lantai
              </label>
              <input
                type="text"
                placeholder="mis. 3"
                value={form.floor}
                onChange={(e) => setField("floor", e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Zone
              </label>
              <input
                type="text"
                placeholder="mis. A"
                value={form.zone}
                onChange={(e) => setField("zone", e.target.value)}
                disabled={isPending}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Luas (m²)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="mis. 200"
                value={form.area_sqm}
                onChange={(e) => setField("area_sqm", e.target.value)}
                disabled={isPending}
                className={`w-full px-3 py-2 text-xs bg-white border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all ${
                  errors.area_sqm ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.area_sqm && (
                <p className="text-[11px] text-rose-500 mt-1">{errors.area_sqm}</p>
              )}
            </div>
          </div>

          {/* API Error Notification */}
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-start gap-2 text-xs animate-in fade-in duration-150">
              <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold text-rose-900">Gagal menyimpan: </span>
                {apiError}
              </div>
            </div>
          )}

          {/* ── Footer Tombol ── */}
          <div className="flex items-center justify-end gap-2.5 pt-3 mt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#E59B00] hover:bg-[#D48F00] rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{isEdit ? "Simpan Perubahan" : "Simpan Room"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RoomFormModal;
