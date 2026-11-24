import React, { useState, useEffect } from "react";
import { X, Link2, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { useReleaseIpAddress } from "../../api/useIpam";
import { extractErrorMessage } from "@shared/types/api";
import type { IpAddress } from "../../types/ipam";

export interface ReleaseAddressModalProps {
  address: IpAddress;
  subnetCidr: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReleaseAddressModal: React.FC<ReleaseAddressModalProps> = ({
  address,
  subnetCidr,
  onClose,
  onSuccess,
}) => {
  const releaseMutation = useReleaseIpAddress();
  const [error, setError] = useState<string | null>(null);

  const isPending = releaseMutation.isPending;

  // Tutup dengan tombol Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isPending]);

  async function handleConfirm() {
    setError(null);
    try {
      await releaseMutation.mutateAsync(address.id);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  }

  // Label Tipe Alokasi
  const allocationTypeLabel =
    address.allocated_to_type === "customer"
      ? "Customer Public IP"
      : address.allocated_to_type === "device"
      ? "Device Infrastructure"
      : address.allocated_to_type === "internal"
      ? "Internal DC Infra"
      : "Customer Public IP";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header: Badge, Title & Close Button ── */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF9EE] border border-amber-200/80 text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
            <Link2 size={22} className="rotate-45" />
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Konfirmasi Lepas IP
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Lepas IP{" "}
            <span className="font-bold text-[#E59B00] font-mono">
              {address.ip_address}
            </span>{" "}
            ? IP kembali jadi stok tersedia.
          </p>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ── Details Container Box ── */}
        <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-4 space-y-3">
          {/* Row 1: Alamat IP */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Alamat IP</span>
            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
              {address.ip_address}
            </span>
          </div>

          {/* Row 2: Subnet & Tipe Alokasi */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-1 border-t border-slate-100">
            <div>
              <div className="text-slate-500 font-medium">Subnet:</div>
              <div className="font-mono font-bold text-slate-900 mt-0.5">
                {subnetCidr}
              </div>
            </div>
            <div>
              <div className="text-slate-500 font-medium">Tipe Alokasi:</div>
              <div className="font-bold text-slate-800 mt-0.5">
                {allocationTypeLabel}
              </div>
            </div>
          </div>

          {/* Row 3: Status Saat Ini */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500 font-medium">Status Saat Ini:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold bg-[#FFFBEB] text-[#D97706] border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
              Allocated (Terpakai)
            </span>
          </div>
        </div>

        {/* ── Operational Impact Alert ── */}
        <div className="bg-[#FEFCE8] border border-amber-200/90 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-amber-900">
            <span className="font-bold">Dampak Operasional:</span> Melepas IP
            ini akan menghapus alokasi ke pelanggan/server terkait dan
            mengembalikan status IP menjadi{" "}
            <span className="underline font-semibold">
              Available (stok tersedia)
            </span>
            .
          </p>
        </div>

        {/* ── Footer Buttons ── */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#c28100] text-white font-bold rounded-lg text-xs transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer active:scale-[0.99]"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Melepas IP...</span>
              </>
            ) : (
              <span>Oke, Lepas IP</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReleaseAddressModal;
