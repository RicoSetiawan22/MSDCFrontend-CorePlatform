import React, { useState, useEffect } from "react";
import { X, Cable, Layers, Loader2, AlertCircle } from "lucide-react";
import { useCreateOtb } from "../api/useOtb";
import { extractErrorMessage } from "@shared/types/api";
import type { OtbFormValues } from "../types/otb";

export interface OtbFormModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function OtbFormModal({ onClose, onSuccess }: OtbFormModalProps) {
  const createMutation = useCreateOtb();

  const [location, setLocation] = useState("");
  const [portCount, setPortCount] = useState("256");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const saving = createMutation.isPending;

  // Tutup dialog dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const count = Number(portCount);
    if (!count || count < 1 || count > 1024) {
      setError("Jumlah port harus antara 1 sampai 1024.");
      return;
    }

    const payload: OtbFormValues = {
      location: location.trim() || undefined,
      port_count: count,
      notes: notes.trim() || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-150">
        {/* ── Header ── */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                Daftarkan OTB Baru
              </h2>
              <p className="text-xs text-slate-500">
                Optical Termination Box dan inisialisasi port fisik
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4 text-sm">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tag Number Notice */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tag Number
            </label>
            <div className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 italic">
              Auto-generated otomatis dari Number Sequence (mis. OTB-2026-0001)
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lokasi Penempatan
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="mis. Rack R01 — Lantai 1 MMR"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Jumlah Port */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Port <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              max={1024}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
              placeholder="mis. 256"
              value={portCount}
              onChange={(e) => setPortCount(e.target.value)}
            />
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Cable size={12} className="text-amber-600 shrink-0" />
              <span>
                Semua port individual ({portCount || "0"} port) akan dibuat otomatis saat OTB didaftarkan.
              </span>
            </div>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Tambahan
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              placeholder="Spesifikasi konektor adapter, jenis patch panel optik..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#E59B00] hover:bg-[#D48F00] text-white text-xs font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Membuat...</span>
                </>
              ) : (
                <span>Buat OTB</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OtbFormModal;
