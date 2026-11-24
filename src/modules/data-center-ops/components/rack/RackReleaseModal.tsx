import React, { useState } from "react";
import { X, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { extractErrorMessage } from "@shared/types/api";
import { useRequestReleaseAllocation } from "../../api/useRacks";
import type { RackDependentAllocation } from "../../types/rack";

interface RackReleaseModalProps {
  allocation: RackDependentAllocation;
  onClose: () => void;
}

export const RackReleaseModal: React.FC<RackReleaseModalProps> = ({
  allocation,
  onClose,
}) => {
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const requestRelease = useRequestReleaseAllocation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    requestRelease.mutate(
      {
        allocationId: allocation.id,
        reason: reason.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setSuccessMessage(
            res.message || "Pengajuan release alokasi berhasil dikirim ke Manager."
          );
        },
        onError: (err) => {
          setErrorMessage(extractErrorMessage(err));
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={requestRelease.isPending ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden flex flex-col scale-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FEF9EE]">
          <h3 className="text-base font-bold text-slate-900">
            Ajukan Release Alokasi
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={requestRelease.isPending}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        {successMessage ? (
          <div className="p-6 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-2xs">
              <CheckCircle2 size={24} className="stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Pengajuan Berhasil Dikirim
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {successMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full px-4 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Selesai
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {/* Inline Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 flex items-start gap-2.5 text-xs animate-in fade-in duration-150"
              >
                <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span className="font-semibold text-rose-900">Gagal mengajukan release: </span>
                  {errorMessage}
                </div>
              </div>
            )}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col gap-1 text-xs">
            <div className="font-bold text-slate-800">
              U-Range: <span className="font-mono text-amber-600">{allocation.start_u}–{allocation.end_u} U</span>
            </div>
            <div className="text-slate-600">
              Customer: <span className="font-semibold text-slate-800">{allocation.customer?.company_name ?? "—"}</span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Kontrak: {allocation.contract?.contract_number ?? "Tanpa Kontrak"}
            </div>
          </div>

          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-800">
            <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              Pengajuan ini akan dikirim ke <strong>Manager</strong> untuk approval melalui menu <em>My Approvals</em>. Alokasi slot baru dilepas secara permanen setelah disetujui.
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Alasan Pengajuan <span className="text-slate-400 font-normal">(opsional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Customer downsize kapasitas, pemindahan perangkat..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800 placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={requestRelease.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#E59B00] hover:bg-[#D48F00] rounded-xl transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Send size={13} />
              <span>{requestRelease.isPending ? "Mengajukan..." : "Kirim Pengajuan"}</span>
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default RackReleaseModal;
