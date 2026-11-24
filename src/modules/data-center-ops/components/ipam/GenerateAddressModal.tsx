import React, { useEffect, useState } from "react";
import { X, Zap, Loader2, AlertCircle } from "lucide-react";
import { useGenerateIpAddresses } from "../../api/useIpam";
import { extractErrorMessage } from "@shared/types/api";

export interface GenerateAddressModalProps {
  subnetId: number;
  subnetCidr: string;
  onClose: () => void;
  onSuccess?: (message?: string) => void;
}

export const GenerateAddressModal: React.FC<GenerateAddressModalProps> = ({
  subnetId,
  subnetCidr,
  onClose,
  onSuccess,
}) => {
  const generateMutation = useGenerateIpAddresses();
  const [error, setError] = useState<string | null>(null);

  const isPending = generateMutation.isPending;

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
      const message = await generateMutation.mutateAsync(subnetId);
      onSuccess?.(message);
      onClose();
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header: Badge & Close Button ── */}
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF9EE] border border-amber-200/80 text-[#D97706] flex items-center justify-center shrink-0 shadow-2xs">
            <Zap size={22} />
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
            Generate Seluruh Alamat IP
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Buat seluruh entri alamat IP yang tersedia dalam subnet{" "}
            <span className="font-bold text-[#E59B00] font-mono">
              {subnetCidr}
            </span>
            .
          </p>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ── Notice Card ── */}
        <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
          <p className="font-semibold text-slate-800">
            Catatan Pembuatan Alamat:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-500 text-[0.72rem]">
            <li>Alamat yang sudah dibuat sebelumnya tidak akan diduplikasi.</li>
            <li>Status alamat baru akan di-set menjadi <strong>Available</strong>.</li>
            <li>Maksimum prefix yang didukung adalah /22 (hingga 1.024 alamat).</li>
          </ul>
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
                <span>Membuat Alamat...</span>
              </>
            ) : (
              <>
                <Zap size={14} />
                <span>Mulai Generate</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateAddressModal;
