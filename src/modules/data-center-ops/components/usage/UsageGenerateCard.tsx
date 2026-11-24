import React, { useState } from "react";
import { Cpu, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { useGenerateUsage } from "../../api/useUsage";
import { extractErrorMessage } from "@shared/types/api";

const MONTH_OPTIONS = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

export interface UsageGenerateCardProps {
  onSuccess?: () => void;
}

export const UsageGenerateCard: React.FC<UsageGenerateCardProps> = ({ onSuccess }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const generate = useGenerateUsage(month, year);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      const res = await generate.mutateAsync();
      const summary = res?.data as Record<string, number> | undefined;
      setResult(
        summary
          ? `Sinkronisasi berhasil: ${summary.rack_space ?? 0} rack space, ${summary.power ?? 0} power, ${summary.bandwidth ?? 0} bandwidth, ${summary.remote_hands ?? 0} remote hands.`
          : "Usage record periode ini berhasil digenerate dan diperbarui."
      );
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      {/* ── Header Kartu Generate ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Generate & Sinkronisasi Usage Record</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Agregasi konsumsi daya (power), ruang rack, bandwidth, dan jam kerja remote hands dari aktivitas tiket bulanan.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Pemilihan Periode ── */}
      <form onSubmit={handleGenerate} className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end gap-3 sm:gap-4">
          {/* Pilih Bulan */}
          <div className="flex flex-col gap-1.5 min-w-[160px] flex-1 sm:flex-initial">
            <label className="text-xs font-bold text-slate-700">
              Bulan Periode
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              disabled={generate.isPending}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer disabled:opacity-50"
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pilih Tahun */}
          <div className="flex flex-col gap-1.5 w-28">
            <label className="text-xs font-bold text-slate-700">
              Tahun
            </label>
            <input
              type="number"
              min={2020}
              max={2035}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={generate.isPending}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all disabled:opacity-50"
            />
          </div>

          {/* Tombol Eksekusi */}
          <button
            type="submit"
            disabled={generate.isPending}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#E59B00] hover:bg-[#D48F00] active:bg-[#C28100] text-white text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-xs disabled:opacity-60 disabled:cursor-not-allowed h-[42px]"
          >
            {generate.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Mengagregasi Data...</span>
              </>
            ) : (
              <>
                <Cpu size={16} />
                <span>Generate Usage Record</span>
              </>
            )}
          </button>
        </div>

        {/* ── Feedback Banner: Sukses ── */}
        {result && (
          <div className="flex items-start justify-between gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span className="font-medium">{result}</span>
            </div>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="text-emerald-600 hover:text-emerald-800 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Feedback Banner: Error ── */}
        {error && (
          <div className="flex items-start justify-between gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-rose-600 hover:text-rose-800 p-0.5 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default UsageGenerateCard;
