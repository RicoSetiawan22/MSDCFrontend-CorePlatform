import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileDown } from "lucide-react";
import { useCostReport, useDownloadCostCenterReportPdf } from "../api/useCostCenters";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

/**
 * Wujud dari "Semua biaya dapat diketahui berasal dari mana" - 3 sudut
 * pandang sekaligus dari 1 angka total_cost yang SAMA:
 * 1. by_account   - biaya apa saja (sewa, listrik, gaji, dst)
 * 2. by_cost_center - dari cost center MANA (relevan kalau cost center ini
 *    punya turunan, mis. "Surabaya DC" pecah ke rack/ruangan di bawahnya)
 * 3. by_entry_type - jurnal manual vs otomatis dari modul lain
 */
export function CostCenterReportPage() {
  const params = useParams<{ costCenterId: string }>();
  const costCenterId = params.costCenterId ? Number(params.costCenterId) : undefined;
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const downloadPdfMutation = useDownloadCostCenterReportPdf();
  const { data, isLoading, isError, error } = useCostReport(
    costCenterId,
    dateFrom || undefined,
    dateTo || undefined,
    includeDescendants
  );

  return (
    <div>
      <style>{`
        @media print {
          @page { margin: 20mm 15mm; size: A4 landscape; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          table { font-size: 9pt; }
          th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <PageHeader
        title={data ? `Laporan Biaya — ${data.cost_center.name}` : "Laporan Biaya"}
        subtitle="Semua biaya dapat diketahui berasal dari mana - per akun, per cost center, dan per jenis entri."
      />

      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!costCenterId}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem",
              background: "var(--accent)", color: "white",
              border: "none", borderRadius: 8,
              cursor: costCenterId ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: "0.85rem",
              opacity: costCenterId ? 1 : 0.5,
            }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
          <Link
            to="/finance/cost-centers"
            style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center" }}
          >
            ← Kembali ke Cost Center
          </Link>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Dari Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Sampai Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--grey-dark)", paddingBottom: "0.25rem" }}>
            <input type="checkbox" checked={includeDescendants} onChange={(e) => setIncludeDescendants(e.target.checked)} />
            Termasuk sub-cost-center di bawahnya
          </label>
          {data && (
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Total Biaya</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{formatCurrency(data.total_cost)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="content-card">
        {isLoading && <LoadingState label="Menghitung..." />}
        {isError && <ErrorState message={extractErrorMessage(error)} />}

        {data && data.total_cost === 0 && (
          <EmptyState title="Tidak Ada Biaya Tercatat" subtitle="Belum ada jurnal posted yang menyentuh cost center ini pada rentang tanggal yang dipilih." />
        )}

        {data && data.total_cost !== 0 && (
          <div style={{ padding: "0 1.5rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="print-area">
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--grey-dark)", margin: "1rem 0 0.6rem" }}>PER AKUN BEBAN</div>
              <table className="table" style={{ margin: 0 }}>
                <tbody>
                  {data.by_account.map((row) => (
                    <tr key={row.account_code}>
                      <td style={{ fontSize: "0.85rem" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--grey)" }}>{row.account_code}</span>
                        {" "}{row.account_name}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--grey-dark)", margin: "1rem 0 0.6rem" }}>PER COST CENTER ASAL</div>
              <table className="table" style={{ margin: 0 }}>
                <tbody>
                  {data.by_cost_center.map((row) => (
                    <tr key={row.cost_center_id}>
                      <td style={{ fontSize: "0.85rem" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--grey)" }}>{row.code}</span>
                        {" "}{row.name}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(row.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--grey-dark)", margin: "1.5rem 0 0.6rem" }}>PER JENIS ENTRI</div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div className="card" style={{ flex: 1, padding: "0.85rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>Manual</div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(data.by_entry_type.manual)}</div>
                </div>
                <div className="card" style={{ flex: 1, padding: "0.85rem", textAlign: "center" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>Otomatis</div>
                  <div style={{ fontWeight: 700 }}>{formatCurrency(data.by_entry_type.automatic)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isPrintModalOpen && costCenterId && (
        <LetterheadPdfModal
          title="Cetak PDF — Cost Center Report"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) =>
            downloadPdfMutation.mutateAsync({
              organizationId: orgId,
              costCenterId,
              date_from: dateFrom || undefined,
              date_to: dateTo || undefined,
              include_descendants: includeDescendants,
            })
          }
        />
      )}
    </div>
  );
}
