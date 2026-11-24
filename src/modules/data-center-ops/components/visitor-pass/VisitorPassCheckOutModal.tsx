import React, { useState, useEffect } from "react";
import { LogOut, X, AlertCircle, Building2, Clock, MapPin, Loader2, ShieldCheck } from "lucide-react";
import type { VisitorPass } from "../../types/visitorPass";

interface VisitorPassCheckOutModalProps {
  pass: VisitorPass | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes?: string, exitGate?: string) => Promise<void> | void;
  isLoading?: boolean;
  defaultGate?: string;
}

export const VisitorPassCheckOutModal: React.FC<VisitorPassCheckOutModalProps> = ({
  pass,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  defaultGate = "Pos Resepsionis / Main Gate",
}) => {
  const [notes, setNotes] = useState("");
  const [exitGate, setExitGate] = useState(defaultGate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNotes("");
      setExitGate(defaultGate);
      setErrorMsg(null);
    }
  }, [isOpen, defaultGate]);

  if (!isOpen || !pass) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onConfirm(notes.trim() || undefined, exitGate);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal melakukan check-out pengunjung.");
    }
  };

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
    "Site MSDC Surabaya";

  const roomName = pass.room?.room_name || pass.room?.name || (pass as any)?.room_name;
  const rackCode = pass.rack?.code || (pass as any)?.rack_code;

  const locationDisplay = [siteName, roomName, rackCode ? `Rak ${rackCode}` : null]
    .filter(Boolean)
    .join(" • ");

  const checkInTime =
    pass.actual_check_in_at || pass.check_in_at || (pass as any)?.check_in_time;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200/70">
              <LogOut size={20} />
            </span>
            <div>
              <h3 id="checkout-modal-title" className="text-base font-semibold text-[#0A2140]">
                Konfirmasi Check-Out Tamu
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan waktu keluar dan pengembalian akses fisik data center
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

        {/* Ringkasan Pengunjung & Akses */}
        <div className="p-6">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-semibold text-amber-700">
                  {pass.pass_number}
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-0.5">
                  {pass.visitor_name}
                </h4>
                <p className="text-xs text-slate-600">
                  {pass.visitor_company || "Tamu Mandiri / Perorangan"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Di Fasilitas
              </span>
            </div>

            <dl className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/70 text-xs">
              <div>
                <dt className="text-slate-400 text-[0.7rem] flex items-center gap-1">
                  <Building2 size={12} className="text-slate-400" />
                  Penjamin (Customer CRM):
                </dt>
                <dd className="font-semibold text-slate-800 mt-0.5 truncate">{customerName}</dd>
              </div>

              <div>
                <dt className="text-slate-400 text-[0.7rem] flex items-center gap-1">
                  <Clock size={12} className="text-slate-400" />
                  Jam Masuk (Check-In):
                </dt>
                <dd className="font-mono font-semibold text-slate-800 mt-0.5">
                  {formatDateTime(checkInTime)}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-slate-400 text-[0.7rem] flex items-center gap-1">
                  <MapPin size={12} className="text-slate-400" />
                  Zona Akses:
                </dt>
                <dd className="font-medium text-slate-700 mt-0.5 truncate">{locationDisplay}</dd>
              </div>
            </dl>
          </div>

          {/* Form Pengaturan Check-Out */}
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 ring-1 ring-inset ring-rose-200">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div>
              <label htmlFor="exit-gate" className="block text-xs font-semibold text-slate-700 mb-1">
                Pintu / Gate Keluar
              </label>
              <input
                id="exit-gate"
                type="text"
                value={exitGate}
                onChange={(e) => setExitGate(e.target.value)}
                placeholder="Contoh: Pos Resepsionis / Main Gate"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label htmlFor="checkout-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Check-Out (Opsional)
              </label>
              <textarea
                id="checkout-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pekerjaan selesai, kartu identitas visitor fisik telah dikembalikan."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Checklist Pengingat SOP */}
            <div className="rounded-xl bg-amber-50/70 p-3 text-xs text-amber-900 ring-1 ring-inset ring-amber-200/60 flex items-start gap-2">
              <ShieldCheck size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[0.75rem]">
                Pastikan kalung/kartu fisik visitor telah dikembalikan ke pos jaga sebelum tamu keluar dari fasilitas.
              </p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={16} />
                    <span>Konfirmasi Check-Out</span>
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
