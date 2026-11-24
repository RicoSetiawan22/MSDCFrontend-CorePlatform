import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, X, Loader2, AlertCircle } from "lucide-react";
import { useDeleteRoom } from "../../api/useRooms";
import { extractErrorMessage } from "@shared/types/api";
import type { RoomItem } from "./RoomTable";

export interface RoomDeleteConfirmModalProps {
  room: RoomItem | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RoomDeleteConfirmModal: React.FC<RoomDeleteConfirmModalProps> = ({
  room,
  isOpen = true,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !room) return null;

  return (
    <RoomDeleteConfirmContent
      key={room.id}
      room={room}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

interface RoomDeleteConfirmContentProps {
  room: RoomItem;
  onClose: () => void;
  onSuccess?: () => void;
}

function RoomDeleteConfirmContent({
  room,
  onClose,
  onSuccess,
}: RoomDeleteConfirmContentProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const siteId = Number(room.site_id ?? 0);
  const deleteMutation = useDeleteRoom(siteId, room.id);
  const isPending = deleteMutation.isPending;

  // Handle ESC key to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  const handleConfirmDelete = () => {
    setErrorMessage(null);
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        setErrorMessage(extractErrorMessage(err));
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-[480px] p-6 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="room-delete-dialog-title"
        aria-describedby="room-delete-dialog-description"
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

        {/* ── Header: Badge Ikon Sampah + Teks Konfirmasi ── */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <Trash2 size={20} strokeWidth={2.2} />
          </div>

          <div className="flex flex-col">
            <h3
              id="room-delete-dialog-title"
              className="text-base font-bold text-slate-900 leading-snug"
            >
              Konfirmasi Hapus Room
            </h3>
            <p
              id="room-delete-dialog-description"
              className="text-xs text-slate-600 mt-1 leading-relaxed"
            >
              Apakah anda yakin ingin menghapus room{" "}
              <span className="font-semibold text-slate-900">
                {room.room_name} ({room.room_code})
              </span>
              {room.site_name ? ` di site ${room.site_name}` : ""} ?
            </p>
          </div>
        </div>

        {/* ── Alert Box: Peringatan Hubungan Antar Rak/Infrastruktur ── */}
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3.5 mt-4 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-700 leading-relaxed">
            <span className="font-bold text-rose-800">
              Peringatan:
            </span>{" "}
            Semua rack yang berada di dalam ruangan ini akan kehilangan referensi ruangan.
            Pastikan tidak ada perangkat kritis yang terdampak sebelum melanjutkan.
          </p>
        </div>

        {/* ── Error Banner jika API Menolak Penghapusan ── */}
        {errorMessage && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 mt-3.5 flex items-start gap-2 text-xs animate-in fade-in duration-150">
            <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-amber-900">Gagal menghapus: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* ── Footer: Tombol Batal & Ya, Hapus Room ── */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} strokeWidth={2.2} />
                <span>Ya, Hapus Room</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomDeleteConfirmModal;
