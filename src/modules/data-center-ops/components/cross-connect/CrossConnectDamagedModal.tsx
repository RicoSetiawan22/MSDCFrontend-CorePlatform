import React, { useState, useEffect } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import type { CrossConnect } from "../../types/crossConnect";
import { CABLE_TYPE_LABELS } from "./CrossConnectToolbar";

export interface CrossConnectDamagedModalProps {
  cc: CrossConnect | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  isPending?: boolean;
}

export const CrossConnectDamagedModal: React.FC<CrossConnectDamagedModalProps> = ({
  cc,
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
}) => {
  const [reason, setReason] = useState(
    "Kabel putus / nilai atenuasi sinyal tinggi (High Loss)"
  );

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
    ? `${cc.destination_otb_port.otb?.tag_number ?? `OTB #${cc.destination_otb_port.otb_id}`} • Port ${cc.destination_otb_port.port_number}`
    : `${cc.destination_location ?? "—"}${cc.destination_port ? ` • Port ${cc.destination_port}` : ""}`;

  const currentStatusLabel =
    cc.status === "active"
      ? "Active / In-Use"
      : cc.status === "available"
      ? "Available"
      : "Damaged";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-2xs shrink-0">
              <AlertTriangle size={22} className="stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                Konfirmasi Tandai Kabel Rusak
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Apakah Anda yakin ingin menandai kabel{" "}
                <span className="font-mono font-bold bg-amber-50 border border-amber-300 text-amber-900 px-2 py-0.5 rounded text-xs mx-0.5">
                  {cc.tag_number ?? `#${cc.id}`}
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

        {/* ── Info Box Rincian Kabel ── */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 my-3.5 flex flex-col gap-2.5">
          {/* Row 1: Tag & ID Kabel */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium">Tag &amp; ID Kabel</span>
            <span className="font-mono font-bold text-slate-900">
              {cc.tag_number ?? `#${cc.id}`} ({CABLE_TYPE_LABELS[cc.cable_type] ?? cc.cable_type})
            </span>
          </div>

          {/* Row 2: Titik Sumber & Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs py-1">
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">
                Titik Asal (Sumber):
              </span>
              <span className="block font-bold text-slate-800 mt-0.5">
                {cc.source_location ?? "—"}
                {cc.source_port ? ` • Port ${cc.source_port}` : ""}
              </span>
            </div>
            <div>
              <span className="block text-[11px] text-slate-500 font-medium">
                Titik Tujuan:
              </span>
              <span className="block font-bold text-slate-800 mt-0.5">
                {destinationText}
              </span>
            </div>
          </div>

          {/* Row 3: Status Saat Ini */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium">Status Saat Ini:</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                cc.status === "active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  cc.status === "active" ? "bg-emerald-500" : "bg-blue-500"
                }`}
              />
              {currentStatusLabel}
            </span>
          </div>
        </div>

        {/* ── Kotak Dampak Operasional ── */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 flex items-start gap-2.5 my-1">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong className="font-bold">Dampak Operasional:</strong> Menandai kabel sebagai{" "}
            <span className="font-bold underline decoration-amber-500">Rusak</span> akan menonaktifkan rute cross-connect ini dan secara otomatis menerbitkan tiket investigasi tim NOC Data Center.
          </p>
        </div>

        {/* ── Input Penyebab Kerusakan ── */}
        <div className="mt-3 mb-2">
          <label className="block text-xs font-bold text-slate-800 mb-1.5">
            Penyebab Kerusakan (Opsional):
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
          >
            <option value="Kabel putus / nilai atenuasi sinyal tinggi (High Loss)">
              Kabel putus / nilai atenuasi sinyal tinggi (High Loss)
            </option>
            <option value="Konektor fisik patah / longgar">
              Konektor fisik patah / longgar
            </option>
            <option value="Kerusakan insulasi / bending berlebih">
              Kerusakan insulasi / bending berlebih
            </option>
            <option value="Port terbakar / korsleting listrik">
              Port terbakar / korsleting listrik
            </option>
            <option value="Lainnya / Perlu inspeksi teknisi">
              Lainnya / Perlu inspeksi teknisi
            </option>
          </select>
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
            onClick={() => onConfirm(reason)}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#E59B00] hover:bg-[#D48F00] text-white font-semibold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <AlertTriangle size={14} className="stroke-[2.5]" />
                <span>Ya, Tandai Rusak</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossConnectDamagedModal;
