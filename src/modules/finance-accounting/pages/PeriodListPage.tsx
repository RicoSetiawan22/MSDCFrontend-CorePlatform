import { useState } from "react";
import { Lock, Unlock, PlayCircle } from "lucide-react";
import { usePeriodList, useGeneratePeriods, useClosePeriod, useReopenPeriod } from "../api/useGlPeriods";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

/**
 * Periode Akuntansi - kontrol utama "posting". Begitu 1 periode DITUTUP,
 * backend (GeneralLedgerService::assertPeriodOpen()) MENOLAK semua jurnal
 * baru/posting draft/reversal bertanggal di periode itu, dari MODUL
 * MANAPUN (AR, AP, Cash & Bank, Fixed Asset, GL manual) - bukan cuma
 * larangan di UI ini saja.
 */
export function PeriodListPage() {
  const [fiscalYear, setFiscalYear] = useState(CURRENT_YEAR);
  const [error, setError] = useState<string | null>(null);

  const { data: periods, isLoading } = usePeriodList(fiscalYear);
  const generateMutation = useGeneratePeriods();
  const closeMutation = useClosePeriod();
  const reopenMutation = useReopenPeriod();

  async function handleGenerate() {
    setError(null);
    try {
      await generateMutation.mutateAsync(fiscalYear);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  async function handleToggle(periodId: number, currentStatus: "open" | "closed") {
    setError(null);
    try {
      if (currentStatus === "open") {
        if (!confirm("Tutup periode ini? Setelah ditutup, tidak ada jurnal baru (dari modul manapun) yang bisa di-posting bertanggal di periode ini sampai dibuka kembali.")) return;
        await closeMutation.mutateAsync(periodId);
      } else {
        await reopenMutation.mutateAsync(periodId);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Periode Akuntansi" subtitle="Kunci periode yang sudah final - jurnal baru/posting ditolak otomatis di periode tertutup." />

      <div className="content-card">
        <div className="toolbar">
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Tahun Fiskal</label>
            <input className="input" type="number" style={{ width: 130 }} value={fiscalYear} onChange={(e) => setFiscalYear(Number(e.target.value))} />
          </div>
          <Button style={{ marginLeft: "auto" }} onClick={handleGenerate} disabled={generateMutation.isPending}>
            <PlayCircle size={15} /> {generateMutation.isPending ? "Memproses..." : "Generate 12 Periode"}
          </Button>
        </div>

        {error && <div className="input-error" style={{ padding: "0 1.5rem 1rem" }}>{error}</div>}

        {isLoading && <LoadingState label="Memuat periode..." />}

        {periods && periods.length === 0 && (
          <EmptyState title="Belum Ada Periode untuk Tahun Ini" subtitle="Klik 'Generate 12 Periode' untuk membuat periode Januari-Desember tahun fiskal ini." />
        )}

        {periods && periods.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Periode</th>
                <th>Rentang Tanggal</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const isCurrentMonth = p.fiscal_year === CURRENT_YEAR && p.month === CURRENT_MONTH;
                const isBusy = closeMutation.isPending || reopenMutation.isPending;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>
                      {p.period_name}
                      {isCurrentMonth && <span className="badge badge-prospect" style={{ marginLeft: "0.5rem" }}>Bulan Ini</span>}
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "var(--grey)" }}>{formatDate(p.start_date)} s/d {formatDate(p.end_date)}</td>
                    <td>
                      <span className={`badge badge-${p.status === "open" ? "active" : "churned"}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        {p.status === "open" ? <Unlock size={11} /> : <Lock size={11} />}
                        {p.status === "open" ? "Terbuka" : "Tertutup"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggle(p.id, p.status as "open" | "closed")}
                        disabled={isBusy}
                        style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600, color: p.status === "open" ? "var(--bad)" : "var(--accent)" }}
                      >
                        {p.status === "open" ? <><Lock size={13} /> Tutup Periode</> : <><Unlock size={13} /> Buka Kembali</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
