import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileDown } from "lucide-react";
import { useProfitReport, useDownloadProfitCenterReportPdf } from "../api/useProfitCenters";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

export function ProfitCenterReportPage() {
  const params = useParams<{ profitCenterId: string }>();
  const profitCenterId = params.profitCenterId ? Number(params.profitCenterId) : undefined;
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [includeDescendants, setIncludeDescendants] = useState(true);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const downloadPdfMutation = useDownloadProfitCenterReportPdf();
  const { data, isLoading, isError, error } = useProfitReport(
    profitCenterId,
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
        title={data ? `Laporan Laba — ${data.profit_center.name}` : "Laporan Laba"}
        subtitle="Rincian pendapatan & beban lini layanan ini."
      />

      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!profitCenterId}
            style={{
              display: "flex", alignItems: "center", gap: "0.4rem",
              padding: "0.5rem 1rem",
              background: "var(--accent)", color: "white",
              border: "none", borderRadius: 8,
              cursor: profitCenterId ? "pointer" : "not-allowed",
              fontWeight: 600, fontSize: "0.85rem",
              opacity: profitCenterId ? 1 : 0.5,
            }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
          <Link
            to="/finance/profit-centers"
            style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center" }}
          >
            ← Kembali ke Profit Center
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
            Termasuk sub-profit-center
          </label>
        </div>
      </div>

      {isLoading && <LoadingState />}
      {isError && <ErrorState message={extractErrorMessage(error)} />}

      {data && (
        <div style={{ padding: "0 2rem 2rem" }}>
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "1.25rem" }} className="no-print">
              <div>
                <label className="input-label" style={{ marginBottom: "0.2rem" }}>Dari Tanggal</label>
                <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="input-label" style={{ marginBottom: "0.2rem" }}>Sampai Tanggal</label>
                <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--grey-dark)" }}>
                <input type="checkbox" checked={includeDescendants} onChange={(e) => setIncludeDescendants(e.target.checked)} />
                Termasuk sub-profit-center
              </label>
            </div>

            <div className="stat-grid print-area" style={{ border: "1px solid var(--border)", borderRadius: 8 }}>
              <div className="stat-cell">
                <div className="stat-cell__label">Total Pendapatan</div>
                <div className="stat-cell__value" style={{ color: "var(--good)" }}>{formatCurrency(data.total_revenue)}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell__label">Total Beban</div>
                <div className="stat-cell__value" style={{ color: "var(--bad)" }}>{formatCurrency(data.total_expense)}</div>
              </div>
              <div className="stat-cell">
                <div className="stat-cell__label">Laba Bersih {data.margin_pct !== null ? `(${data.margin_pct}% margin)` : ""}</div>
                <div className="stat-cell__value" style={{ color: data.net_profit >= 0 ? "var(--good)" : "var(--bad)" }}>{formatCurrency(data.net_profit)}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }} className="print-area">
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "0.9rem 1.2rem", fontWeight: 700, fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>Rincian Pendapatan</div>
              <table className="table" style={{ margin: 0 }}>
                <tbody>
                  {data.revenue_by_account.map((row) => (
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

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "0.9rem 1.2rem", fontWeight: 700, fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>Rincian Beban</div>
              <table className="table" style={{ margin: 0 }}>
                <tbody>
                  {data.expense_by_account.map((row) => (
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
          </div>
        </div>
      )}

      {isPrintModalOpen && profitCenterId && (
        <LetterheadPdfModal
          title={`Cetak PDF — ${data?.profit_center.name ?? "Profit Center"}`}
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) =>
            downloadPdfMutation.mutateAsync({
              organizationId: orgId,
              profitCenterId,
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
