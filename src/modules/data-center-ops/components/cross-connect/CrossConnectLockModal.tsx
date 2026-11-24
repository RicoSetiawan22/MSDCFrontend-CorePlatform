import React, { useEffect } from "react";
import { Lock, X, Info, Check, Loader2 } from "lucide-react";
import type { CrossConnect } from "../../types/crossConnect";
import { CABLE_TYPE_LABELS } from "./CrossConnectToolbar";

export interface CrossConnectLockModalProps {
  cc: CrossConnect | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending?: boolean;
}

export const CrossConnectLockModal: React.FC<CrossConnectLockModalProps> = ({
  cc,
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

  if (!isOpen || !cc) return null;

  const destinationText = cc.destination_otb_port
    ? `${cc.destination_otb_port.otb?.tag_number ?? `OTB #${cc.destination_otb_port.otb_id}`} · Port ${cc.destination_otb_port.port_number}`
    : `${cc.destination_location ?? "—"}${cc.destination_port ? ` · Port ${cc.destination_port}` : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs shrink-0">
              <Lock size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100/60 mb-1">
                Cross-Connect Activation
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Konfirmasi Pasang &amp; Kunci Kabel
              </h2>
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

        {/* ── Garis Pemisah Bergaris Putus-Putus Sesuai Desain ── */}
        <div className="border-t border-dashed border-blue-200/80 my-4" />

        {/* ── Narasi Pertanyaan ── */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Pasang dan kunci kabel tag{" "}
          <span className="font-mono font-bold bg-slate-100 border border-slate-200 text-slate-900 px-2 py-0.5 rounded text-xs mx-0.5">
            {cc.tag_number ?? `#${cc.id}`}
          </span>
          ? Status sambungan fisik cross-connect akan otomatis diubah menjadi{" "}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 ml-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        </p>

        {/* ── Info Box Rincian Kabel (Sesuai Desain Mockup) ── */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 my-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
            {/* Port Sumber */}
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">
                Port Sumber (Origin)
              </span>
              <span className="block text-xs font-bold text-slate-800 mt-0.5">
                {cc.source_location ?? "—"}
                {cc.source_port ? ` · Port ${cc.source_port}` : ""}
              </span>
            </div>

            {/* Port Tujuan */}
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">
                Port Tujuan (Destination)
              </span>
              <span className="block text-xs font-bold text-slate-800 mt-0.5">
                {destinationText}
              </span>
            </div>

            {/* Tipe Media */}
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">
                Tipe Media Patch Cord
              </span>
              <span className="block text-xs font-bold text-slate-800 mt-0.5">
                {CABLE_TYPE_LABELS[cc.cable_type] ?? cc.cable_type}
              </span>
            </div>

            {/* Alokasi Pelanggan */}
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">
                Alokasi Kontrak / Pelanggan
              </span>
              <span className="block text-xs font-bold text-slate-800 mt-0.5 truncate" title={cc.customer?.company_name ?? "—"}>
                {cc.customer?.company_name ?? "—"}
                {cc.contract?.contract_number ? ` (${cc.contract.contract_number})` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ── Kotak Catatan Operasional ── */}
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5 flex items-start gap-2.5 my-1">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong className="font-bold">Catatan Operasional:</strong> Penguncian kabel akan mencegah pencabutan port secara tak sengaja di diagram topologi rack. Tindakan ini akan dicatat ke <span className="font-semibold italic">Audit Trail Log</span> atas nama operator saat ini.
          </p>
        </div>

        {/* ── Garis Pemisah Bawah ── */}
        <div className="border-t border-dashed border-blue-200/80 my-4" />

        {/* ── Tombol Aksi Footer ── */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Check size={14} className="stroke-[2.5]" />
                <span>Ya, Pasang &amp; Kunci Kabel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossConnectLockModal;
