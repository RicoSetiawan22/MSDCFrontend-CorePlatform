import React, { useEffect } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import type { Otb, OtbPort } from "../../types/otb";

export interface OtbPortDamagedModalProps {
  port: OtbPort | null;
  otb?: Otb;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export const OtbPortDamagedModal: React.FC<OtbPortDamagedModalProps> = ({
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
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/80 shadow-2xs shrink-0">
              <AlertTriangle size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200/80 text-[10px] font-bold tracking-wider text-rose-700 uppercase mb-1">
                Konfirmasi Port Rusak
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Konfirmasi Tandai Port Rusak
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Apakah Anda yakin ingin menandai port{" "}
                <span className="font-mono font-bold bg-rose-50 border border-rose-300 text-rose-900 px-1.5 py-0.5 rounded text-xs">
                  #{port.port_number}
                </span>{" "}
                sebagai rusak?
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
            <span className="text-[11px] text-slate-500 font-medium">Nomor Port &amp; OTB</span>
            <span className="font-mono font-bold text-slate-900">
              Port #{port.port_number} {otb ? `• ${otb.tag_number}` : ""}
            </span>
          </div>

          {/* Row 2: Lokasi OTB & Customer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs py-1">
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Lokasi Rak OTB:</span>
              <span className="block font-bold text-slate-800 mt-0.5">
                {otb?.location ?? "—"}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">Pelanggan Terkait:</span>
              <span className="block font-bold text-slate-800 mt-0.5 truncate">
                {port.customer?.company_name ?? "Tidak terhubung pelanggan"}
              </span>
            </div>
          </div>

          {/* Row 3: Status Saat Ini */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium">Status Saat Ini:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                port.status === "allocated"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  port.status === "allocated" ? "bg-blue-500" : "bg-emerald-500"
                }`}
              />
              {port.status === "allocated" ? "Allocated" : "Available"}
            </span>
          </div>
        </div>

        {/* ── Banner Peringatan Risiko Kerusakan (Red Theme) ── */}
        <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3.5 flex items-start gap-2.5 mb-5">
          <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-900 leading-relaxed">
            <strong className="font-semibold">Perhatian:</strong> Port yang ditandai rusak tidak dapat dialokasikan ke pelanggan dan akan dinonaktifkan dari sistem transmisi aktif hingga dilakukan perbaikan oleh tim teknisi.
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
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-w-[140px]"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} className="stroke-[2.2]" />
                <span>Ya, Tandai Rusak</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
