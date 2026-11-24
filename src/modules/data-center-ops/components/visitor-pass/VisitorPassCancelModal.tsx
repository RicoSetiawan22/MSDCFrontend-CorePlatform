import React, { useState, useEffect } from "react";
import { Ban, X, AlertTriangle, Building2, Calendar, Loader2 } from "lucide-react";
import type { VisitorPass } from "../../types/visitorPass";

interface VisitorPassCancelModalProps {
  pass: VisitorPass | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  isLoading?: boolean;
}

const QUICK_REASONS = [
  "Tamu berhalangan hadir",
  "Jadwal maintenance server ditunda",
  "Perubahan PIC teknisi lapangan",
  "Kesalahan data pendaftaran",
];

export const VisitorPassCancelModal: React.FC<VisitorPassCancelModalProps> = ({
  pass,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !pass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setErrorMsg("Alasan pembatalan izin kunjungan wajib diisi.");
      return;
    }
    setErrorMsg(null);
    try {
      await onConfirm(cleanReason);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal membatalkan tiket izin kunjungan.");
    }
  };

  const customerName =
    pass.customer?.company_name ||
    pass.customer?.name ||
    (pass as any)?.customer_name ||
    (pass as any)?.company_name ||
    "-";

  const plannedTime =
    pass.valid_from || pass.planned_check_in_at;

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-200">
              <Ban size={20} />
            </span>
            <div>
              <h3 id="cancel-modal-title" className="text-base font-semibold text-[#0A2140]">
                Batalkan Izin Kunjungan?
              </h3>
              <p className="text-xs text-slate-500">
                Pencabutan tiket izin masuk fasilitas data center
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup modal"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-6">
          {/* Warning Banner */}
          <div className="rounded-xl bg-rose-50/80 p-3.5 text-xs text-rose-800 ring-1 ring-inset ring-rose-200/70 flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Tindakan ini akan <strong>membatalkan izin masuk</strong> dan menonaktifkan QR Code tiket{" "}
              <span className="font-mono font-bold">{pass.pass_number}</span> secara permanen.
            </p>
          </div>

          {/* Ringkasan Tamu */}
          <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-[0.7rem] font-semibold text-slate-400">
                  {pass.pass_number}
                </span>
                <h4 className="font-bold text-slate-900 mt-0.5 text-sm">
                  {pass.visitor_name}
                </h4>
                {pass.visitor_company && (
                  <p className="text-slate-500 text-[0.72rem]">{pass.visitor_company}</p>
                )}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[0.72rem]">
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Building2 size={11} /> Penjamin:
                </span>
                <span className="font-semibold text-slate-700 mt-0.5 block truncate">
                  {customerName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar size={11} /> Jadwal:
                </span>
                <span className="font-medium text-slate-700 mt-0.5 block truncate">
                  {formatDateTime(plannedTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Input Alasan */}
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200 font-medium">
                {errorMsg}
              </p>
            )}

            <div>
              <label htmlFor="cancel-reason-input" className="block text-xs font-semibold text-slate-700 mb-1">
                Alasan Pembatalan <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="cancel-reason-input"
                required
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Contoh: Tamu berhalangan hadir atau jadwal maintenance server ditunda..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            {/* Rekomendasi Alasan Cepat */}
            <div>
              <span className="block text-[0.7rem] text-slate-400 mb-1.5 font-medium">
                Pilih Alasan Cepat:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setReason(qr)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[0.7rem] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Membatalkan...</span>
                  </>
                ) : (
                  <>
                    <Ban size={15} />
                    <span>Ya, Batalkan Izin</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
