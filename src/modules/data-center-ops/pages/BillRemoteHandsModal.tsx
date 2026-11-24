import React, { useState } from "react";
import { Wrench, Calendar, Clock, AlertCircle, Loader2, ArrowRight, FileText, User } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { useBillRemoteHands } from "../api/useUsage";
import { extractErrorMessage } from "@shared/types/api";
import type { UsageRecord } from "../types/usage";

export interface BillRemoteHandsModalProps {
  record: UsageRecord;
  onClose: () => void;
}

/**
 * Modal pembuatan AR Invoice DRAFT dari usage record remote_hands.
 * Belum masuk piutang / jurnal GL sampai direview dan disetujui
 * oleh tim Finance di menu Finance > AR Invoices / Integration.
 */
export function BillRemoteHandsModal({ record, onClose }: BillRemoteHandsModalProps) {
  const [rate, setRate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bill = useBillRemoteHands(record.id);

  const quantityNum = Number(record.quantity) || 0;
  const rateNum = Number(rate) || 0;
  const totalAmount = rateNum * quantityNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rate || rateNum <= 0) {
      setError("Tarif per jam wajib diisi dengan nominal lebih besar dari 0.");
      return;
    }
    setError(null);

    try {
      await bill.mutateAsync(rateNum);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal
      title="Penagihan Remote Hands"
      onClose={bill.isPending ? () => {} : onClose}
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* ── Ringkasan Data Usage Record ── */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-200/60 pb-2">
            <Wrench size={14} className="text-amber-500" />
            <span>Detail Pekerjaan & Kuantitas</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <span>Periode:</span>
              <strong className="text-slate-900 font-mono">
                {record.period_year}/{String(record.period_month).padStart(2, "0")}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock size={13} className="text-slate-400 shrink-0" />
              <span>Durasi:</span>
              <strong className="text-slate-900 font-bold">
                {quantityNum} {record.unit || "Jam"}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 col-span-2">
              <User size={13} className="text-slate-400 shrink-0" />
              <span>Customer:</span>
              <strong className="text-slate-900">
                {record.customer_id ? `#CUST-${record.customer_id}` : "Pelanggan Terkait"}
              </strong>
            </div>
          </div>
        </div>

        {/* ── Input Tarif per Jam ── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700">
            Tarif per Jam (IDR) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
              Rp
            </span>
            <input
              type="number"
              min={0}
              step="any"
              autoFocus
              placeholder="mis. 200000"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              disabled={bill.isPending}
              className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* ── Kalkulasi Total Tagihan Real-time ── */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Total Tagihan
            </span>
            <span className="text-xs text-amber-700">
              {rateNum > 0
                ? `Rp ${rateNum.toLocaleString("id-ID")} × ${quantityNum} ${record.unit || "Jam"}`
                : "Masukkan tarif per jam"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-extrabold text-amber-900 font-mono">
              Rp {totalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* ── Keterangan Alur Finance ── */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px]">
          <FileText size={15} className="text-sky-600 shrink-0 mt-0.5" />
          <span>
            Data akan dikirim ke modul <strong>Finance & Accounting</strong> sebagai <strong>AR Invoice Draft</strong> untuk ditinjau oleh staf finance sebelum dibukukan.
          </span>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* ── Tombol Aksi ── */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            type="submit"
            disabled={bill.isPending || rateNum <= 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#C28100] text-white text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed h-[42px]"
          >
            {bill.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Membuat AR Invoice...</span>
              </>
            ) : (
              <>
                <span>Buat AR Invoice Draft</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={bill.isPending}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 disabled:opacity-50 h-[42px]"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default BillRemoteHandsModal;
