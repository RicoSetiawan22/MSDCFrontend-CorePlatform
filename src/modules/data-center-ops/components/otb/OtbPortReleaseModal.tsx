import React, { useEffect } from "react";
import { Lock, X, Loader2, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Otb, OtbPort } from "../../types/otb";

export interface OtbPortReleaseModalProps {
  port: OtbPort | null;
  otb: Otb;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export const OtbPortReleaseModal: React.FC<OtbPortReleaseModalProps> = ({
  port,
  otb,
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen || !port) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80 shadow-2xs shrink-0">
              <Lock size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 text-[10px] font-bold tracking-wider text-blue-700 uppercase mb-1">
                Lepas Alokasi Port
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Lepas Port #{port.port_number}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Lepas port #{port.port_number}? Port kembali jadi stok tersedia.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Tutup dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Info Box Rincian Port ── */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 my-4 flex flex-col gap-2.5">
          {/* Row 1: Nomor Port & OTB */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium">Port &amp; OTB Terpilih</span>
            <span className="font-mono font-bold text-slate-900">
              Port #{port.port_number} • {otb.tag_number}
            </span>
          </div>

          {/* Row 2: Lokasi OTB & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs py-1">
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Lokasi Rak OTB:</span>
              <span className="block font-bold text-slate-800 mt-0.5">
                {otb.location ?? "—"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Customer Terkait:</span>
              <span className="block font-bold text-slate-800 mt-0.5 truncate">
                {port.customer?.company_name ?? "—"}
              </span>
            </div>
          </div>

          {/* Row 3: Transisi Status */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-medium mb-1">Status Saat Ini</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Allocated
              </span>
            </div>

            <ArrowRight size={16} className="text-slate-400 mt-3" />

            <div className="flex flex-col items-end">
              <span className="text-[11px] text-slate-500 font-medium mb-1">Status Setelah Dilepas</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} className="text-emerald-600" />
                Available (Tersedia)
              </span>
            </div>
          </div>
        </div>

        {/* ── Catatan Operasional (Blue Theme) ── */}
        <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3.5 flex items-start gap-2.5 mb-5">
          <Info size={16} className="text-sky-600 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-900 leading-relaxed">
            <strong className="font-semibold">Catatan Operasional:</strong> Melepas alokasi port akan memutus relasi port fisik dengan pelanggan dan nomor kontrak terkait. Port akan kembali berstatus <em>Available</em> dan siap dialokasikan kembali.
          </p>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-w-[130px]"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Lock size={14} className="stroke-[2.2]" />
                <span>Ya, Lepas Port</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
