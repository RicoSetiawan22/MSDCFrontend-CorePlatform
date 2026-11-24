import React, { useEffect, useState } from "react";
import { CheckCircle2, X, Building2, Calendar, User, Mail, ShieldCheck, Loader2, AlertTriangle, ClipboardCheck } from "lucide-react";
import type { VisitorPass } from "../../types/visitorPass";

export interface VisitorPassApproveModalProps {
  pass: VisitorPass | null;
  isOpen: boolean;
  onClose: () => void;
  /** Dipanggil dengan catatan persetujuan opsional (sudah di-trim; undefined bila kosong). */
  onConfirm: (notes?: string) => Promise<void> | void;
  isLoading?: boolean;
  /** Pesan penolakan dari backend (mis. 422) - ditampilkan di atas tombol aksi. */
  errorMessage?: string | null;
}

export const VisitorPassApproveModal: React.FC<VisitorPassApproveModalProps> = ({
  pass,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  errorMessage = null,
}) => {
  const [notes, setNotes] = useState("");
  const [identityVerified, setIdentityVerified] = useState(false);
  const [itemsScheduleVerified, setItemsScheduleVerified] = useState(false);

  // Form vetting selalu mulai kosong untuk setiap tiket / setiap modal dibuka
  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setIdentityVerified(false);
      setItemsScheduleVerified(false);
    }
  }, [isOpen, pass?.id]);

  if (!isOpen || !pass) return null;

  const isChecklistComplete = identityVerified && itemsScheduleVerified;

  const visitorName = pass.visitor_name || "Tamu";
  const customerName =
    pass.customer?.company_name ||
    pass.customer?.name ||
    (pass as any)?.customer_name ||
    (pass as any)?.company_name ||
    "-";

  const siteName =
    pass.site?.site_name ||
    pass.site?.name ||
    (pass as any)?.site_name ||
    "Data Center MSDC Surabaya";

  const plannedIn = pass.planned_check_in_at || pass.valid_from;
  const plannedOut = pass.planned_check_out_at || pass.valid_until || pass.valid_to;

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const dateFormatted = d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const timeFormatted = d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).replace(".", ":");
      return `${dateFormatted}, ${timeFormatted} WIB`;
    } catch {
      return String(dateStr);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !isChecklistComplete) return;
    await onConfirm(notes.trim() || undefined);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approve-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-emerald-50/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-1 ring-inset ring-emerald-300/60">
              <CheckCircle2 size={22} className="stroke-[2.2]" />
            </span>
            <div>
              <h3 id="approve-modal-title" className="text-base font-bold text-[#0A2140]">
                Setujui Izin Kunjungan?
              </h3>
              <p className="text-xs text-slate-500">
                Verifikasi & persetujuan izin masuk fasilitas data center
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Tutup modal"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {/* Pertanyaan Konfirmasi */}
          <div className="text-sm text-slate-700 leading-relaxed">
            Setujui izin kunjungan untuk{" "}
            <strong className="text-slate-900 font-extrabold">{visitorName}</strong>?
          </div>

          {/* Kartu Ringkasan Tiket */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">
                NOMOR TIKET
              </span>
              <span className="font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                {pass.pass_number}
              </span>
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User size={13} className="text-slate-400" />
                  Instansi / Penjamin:
                </span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
                  {customerName}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Building2 size={13} className="text-slate-400" />
                  Lokasi Fasilitas:
                </span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[190px]">
                  {siteName}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Calendar size={13} className="text-slate-400" />
                  Rencana Masuk:
                </span>
                <span className="font-semibold text-slate-800 text-right">
                  {formatDateTime(plannedIn)}
                </span>
              </div>

              {plannedOut && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={13} className="text-slate-400" />
                    Estimasi Selesai:
                  </span>
                  <span className="font-semibold text-slate-800 text-right">
                    {formatDateTime(plannedOut)}
                  </span>
                </div>
              )}

              {(pass.visitor_email || pass.recipient_email) && (
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail size={13} className="text-slate-400" />
                    Email Tamu:
                  </span>
                  <span className="font-medium text-slate-700 text-right truncate max-w-[190px]">
                    {pass.visitor_email || pass.recipient_email}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notifikasi Informasional */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-start gap-2 leading-relaxed">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Setelah disetujui, QR Code e-badge resmi akan langsung aktif dan tautan tiket akan dikirimkan otomatis ke email tamu.
            </span>
          </div>

          {/* Checklist Vetting Kepatuhan (ISO 27001 - Physical Access Control) */}
          <fieldset className="rounded-xl border border-slate-200 p-3.5 space-y-2.5" disabled={isLoading}>
            <legend className="px-1 text-[0.68rem] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ClipboardCheck size={13} className="text-slate-400" />
              Checklist Vetting Kepatuhan
            </legend>
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={identityVerified}
                onChange={(e) => setIdentityVerified(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Kesesuaian identitas fisik tamu &amp; NDA telah diperiksa</span>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={itemsScheduleVerified}
                onChange={(e) => setItemsScheduleVerified(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Daftar barang bawaan &amp; jadwal kunjungan sesuai ketentuan fasilitas</span>
            </label>
          </fieldset>

          {/* Catatan Persetujuan */}
          <div className="space-y-1.5">
            <label htmlFor="approve-notes" className="block text-xs font-semibold text-slate-700">
              Catatan Persetujuan{" "}
              <span className="font-normal text-slate-400">(Opsional, mis. nomor memo / referensi tiket NOC)</span>
            </label>
            <textarea
              id="approve-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
              rows={2}
              maxLength={500}
              placeholder="Contoh: Memo NOC-2026-1042, KTP dicocokkan oleh Supervisor"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
            />
          </div>

          {/* Pesan Error Persetujuan */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 leading-relaxed"
            >
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong className="block font-bold">Persetujuan gagal</strong>
                {errorMessage}
              </span>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading || !isChecklistComplete}
              title={isChecklistComplete ? undefined : "Lengkapi checklist vetting kepatuhan terlebih dahulu"}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Setujui Izin Kunjungan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
