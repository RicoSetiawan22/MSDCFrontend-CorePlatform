import React, { useState, useEffect } from "react";
import { Trash2, AlertTriangle, X, Loader2, AlertCircle } from "lucide-react";
import { useDeleteDevice } from "../../api/useDevices";
import { extractErrorMessage } from "@shared/types/api";
import type { Device } from "../../types/device";

export interface DeviceDeleteConfirmModalProps {
  device: Device | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  siteName?: string;
  rackCode?: string;
}

export const DeviceDeleteConfirmModal: React.FC<DeviceDeleteConfirmModalProps> = ({
  device,
  isOpen = true,
  onClose,
  onSuccess,
  siteName,
  rackCode,
}) => {
  if (!isOpen || !device) return null;

  return (
    <DeviceDeleteConfirmContent
      key={device.id}
      device={device}
      onClose={onClose}
      onSuccess={onSuccess}
      siteName={siteName}
      rackCode={rackCode}
    />
  );
};

interface DeviceDeleteConfirmContentProps {
  device: Device;
  onClose: () => void;
  onSuccess?: () => void;
  siteName?: string;
  rackCode?: string;
}

function DeviceDeleteConfirmContent({
  device,
  onClose,
  onSuccess,
  siteName,
  rackCode,
}: DeviceDeleteConfirmContentProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const deleteMutation = useDeleteDevice();
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
    deleteMutation.mutate(device.id, {
      onSuccess: () => {
        onClose();
        if (onSuccess) onSuccess();
      },
      onError: (err) => {
        setErrorMessage(extractErrorMessage(err));
      },
    });
  };

  const locationText = [
    siteName,
    rackCode ? `Rack ${rackCode}` : undefined,
    device.rack_position_u ? `U${device.rack_position_u}${device.rack_position_u_end && device.rack_position_u_end !== device.rack_position_u ? `-U${device.rack_position_u_end}` : ""}` : undefined,
  ].filter(Boolean).join(" • ") || "Belum ditentukan / Gudang";

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
        aria-labelledby="device-delete-dialog-title"
        aria-describedby="device-delete-dialog-description"
      >
        {/* Tombol Tutup (X) */}
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Tutup dialog"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer disabled:opacity-40"
        >
          <X size={18} />
        </button>

        {/* ── Header: Badge Ikon Sampah + Teks Konfirmasi ── */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
            <Trash2 size={20} strokeWidth={2.2} />
          </div>
          <div>
            <h3
              id="device-delete-dialog-title"
              className="text-base font-bold text-slate-900 leading-snug"
            >
              Hapus Perangkat Inventory
            </h3>
            <p
              id="device-delete-dialog-description"
              className="text-xs text-slate-500 mt-1"
            >
              Apakah Anda yakin ingin menghapus data perangkat berikut? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        {/* ── Kotak Ringkasan Perangkat Target ── */}
        <div className="my-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs border-b border-slate-200/60 pb-2">
            <span className="text-slate-500">Kode Perangkat</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {device.device_code}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Nama Device</span>
            <span className="font-semibold text-slate-800 text-right">
              {device.device_name}
            </span>
          </div>
          {(device.manufacturer || device.model) && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Vendor &amp; Model</span>
              <span className="font-medium text-slate-700 text-right">
                {[device.manufacturer, device.model].filter(Boolean).join(" ")}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Lokasi Fisik</span>
            <span className="font-medium text-slate-600 text-right truncate max-w-[240px]">
              {locationText}
            </span>
          </div>
        </div>

        {/* ── Kotak Peringatan Bahaya ── */}
        <div className="p-3 bg-amber-50 border border-amber-200/70 rounded-xl flex items-start gap-2.5 mb-5 text-amber-900">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            Perangkat akan dihapus dari alokasi slot rack dan kapasitas daya. Pastikan perangkat sudah dinonaktifkan atau dipindahkan terlebih dahulu jika masih beroperasi.
          </p>
        </div>

        {/* ── Error Banner dari Server jika Ada ── */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs">
            <AlertCircle size={15} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* ── Tombol Aksi ── */}
        <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmDelete}
            disabled={isPending}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-98 rounded-lg shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={13} />
                <span>Hapus Perangkat</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeviceDeleteConfirmModal;
