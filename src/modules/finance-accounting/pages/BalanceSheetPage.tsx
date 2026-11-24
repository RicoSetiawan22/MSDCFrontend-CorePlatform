import { useState } from "react";
import { FileDown, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useBalanceSheet, useDownloadBalanceSheetPdf } from "../api/useFinancialReporting";
import { FinancialGroupTable } from "../components/FinancialGroupTable";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";

const TODAY = new Date().toISOString().slice(0, 10);

export function BalanceSheetPage() {
  const [asOfDate, setAsOfDate] = useState(TODAY);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadBalanceSheetPdf();
  const { data, isLoading } = useBalanceSheet(asOfDate);

  const totalAset = data?.assets.total ?? 0;
  const totalLiabilitas = data?.liabilities.total ?? 0;
  const totalEkuitas = data?.equity.total ?? 0;
  const totalLiabEkuitas = data?.total_liabilities_and_equity ?? 0;
  const isBalanced = data?.is_balanced ?? false;

  return (
    <div>
      <PageHeader
        title="Balance Sheet (Neraca)"
        subtitle="Posisi keuangan — Aset = Kewajiban + Ekuitas, per tanggal tertentu."
      />

      <div style={{ padding: "0 2rem 2rem" }}>
        {/* ── Filter & PDF row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "1rem",
            marginBottom: "1.25rem",
            flexWrap: "wrap",
          }}
          className="no-print"
        >
          <div>
            <label className="input-label">Per Tanggal *</label>
            <input
              className="input"
              type="date"
              style={{ width: 180 }}
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
            />
          </div>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              background: "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              marginBottom: "0.5rem",
            }}
          >
            <FileDown size={15} />
            Cetak PDF
          </button>
        </div>

        {/* ── KPI 4-Box Row ── */}
        {data && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.75rem",
              marginBottom: "1.25rem",
            }}
          >
            {/* Total Aset — biru */}
            <div
              style={{
                background: "#eff6ff",
                border: "2px solid #1d4ed8",
                borderRadius: 10,
                padding: "0.85rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6b7280",
                  marginBottom: "0.3rem",
                }}
              >
                Total Aset
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#1d4ed8",
                  fontFamily: "monospace",
                }}
              >
                {formatCurrency(totalAset)}
              </div>
            </div>

            {/* Total Liabilitas — oranye */}
            <div
              style={{
                background: "#fff7ed",
                border: "2px solid #ea580c",
                borderRadius: 10,
                padding: "0.85rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6b7280",
                  marginBottom: "0.3rem",
                }}
              >
                Total Liabilitas
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#ea580c",
                  fontFamily: "monospace",
                }}
              >
                {formatCurrency(totalLiabilitas)}
              </div>
            </div>

            {/* Total Ekuitas — ungu */}
            <div
              style={{
                background: "#f5f3ff",
                border: "2px solid #7c3aed",
                borderRadius: 10,
                padding: "0.85rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6b7280",
                  marginBottom: "0.3rem",
                }}
              >
                Total Ekuitas
              </div>
              <div
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 800,
                  color: "#7c3aed",
                  fontFamily: "monospace",
                }}
              >
                {formatCurrency(totalEkuitas)}
              </div>
            </div>

            {/* Status Balance — hijau / merah */}
            <div
              style={{
                background: isBalanced ? "#f0fdf4" : "#fef2f2",
                border: `2px solid ${isBalanced ? "#16a34a" : "#dc2626"}`,
                borderRadius: 10,
                padding: "0.85rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#6b7280",
                  marginBottom: "0.3rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.25rem",
                }}
              >
                {isBalanced ? (
                  <CheckCircle2 size={10} color="#16a34a" />
                ) : (
                  <AlertTriangle size={10} color="#dc2626" />
                )}
                Status Balance
              </div>
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  color: isBalanced ? "#16a34a" : "#dc2626",
                  fontFamily: "monospace",
                  lineHeight: 1.3,
                }}
              >
                {isBalanced ? "✓ Seimbang" : "✗ Tidak Balance"}
              </div>
              {!isBalanced && (
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "#dc2626",
                    marginTop: "0.15rem",
                  }}
                >
                  Selisih {formatCurrency(Math.abs(totalAset - totalLiabEkuitas))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Balance strip ── */}
        {data && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
              padding: "0.6rem 1rem",
              background: isBalanced ? "#dcfce7" : "#fee2e2",
              border: `1px solid ${isBalanced ? "#16a34a" : "#dc2626"}`,
              borderRadius: 8,
              fontSize: "0.82rem",
            }}
          >
            {isBalanced ? (
              <CheckCircle2 size={14} color="#16a34a" />
            ) : (
              <AlertTriangle size={14} color="#dc2626" />
            )}
            <span style={{ fontWeight: 600, color: isBalanced ? "#15803d" : "#b91c1c" }}>
              {isBalanced
                ? "Laporan Neraca Seimbang — Total Aset = Total Liabilitas + Ekuitas"
                : `⚠ Laporan Tidak Seimbang — Selisih ${formatCurrency(Math.abs(totalAset - totalLiabEkuitas))}. Periksa jurnal penutup.`}
            </span>
          </div>
        )}

        {isLoading && <LoadingState label="Menghitung..." />}

        {data && (
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}
            className="print-area"
          >
            {/* ASET — biru */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                style={{
                  padding: "0.9rem 1.2rem",
                  fontWeight: 700,
                  background: "#1d4ed8",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <TrendingUp size={15} />
                ASET
              </div>
              <FinancialGroupTable
                groups={data.assets.groups}
                total={data.assets.total}
                totalLabel="TOTAL ASET"
                emptyMessage="Belum ada saldo aset pada tanggal ini."
              />
            </div>

            {/* KEWAJIBAN + EKUITAS */}
            <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
              {/* LIABILITAS — oranye */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  style={{
                    padding: "0.9rem 1.2rem",
                    fontWeight: 700,
                    background: "#ea580c",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <TrendingUp size={15} />
                  LIABILITAS
                </div>
                <FinancialGroupTable
                  groups={data.liabilities.groups}
                  total={data.liabilities.total}
                  totalLabel="TOTAL LIABILITAS"
                  emptyMessage="Belum ada saldo kewajiban pada tanggal ini."
                />
              </div>

              {/* EKUITAS — ungu */}
              <div className="card" style={{ padding: 0, overflow: "hidden" }}>
                <div
                  style={{
                    padding: "0.9rem 1.2rem",
                    fontWeight: 700,
                    background: "#7c3aed",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <TrendingUp size={15} />
                  EKUITAS
                </div>
                <FinancialGroupTable
                  groups={data.equity.groups}
                  total={data.equity.total - data.equity.current_year_earnings}
                  totalLabel="Subtotal Ekuitas (Modal)"
                  emptyMessage="Belum ada saldo ekuitas pada tanggal ini."
                />
                <table className="table" style={{ margin: 0, borderTop: "1px solid var(--border)" }}>
                  <tbody>
                    <tr>
                      <td style={{ fontSize: "0.85rem" }}>Laba Tahun Berjalan</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(data.equity.current_year_earnings)}
                      </td>
                    </tr>
                    <tr style={{ fontWeight: 700, background: "#fafbfd" }}>
                      <td>TOTAL EKUITAS</td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(data.equity.total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* TOTAL KEWAJIBAN + EKUITAS footer */}
              <div
                className="card"
                style={{
                  padding: "1rem 1.2rem",
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                  background: "#f5f3ff",
                  border: "2px solid #7c3aed",
                  borderRadius: 8,
                }}
              >
                <span>TOTAL KEWAJIBAN + EKUITAS</span>
                <span>{formatCurrency(data.total_liabilities_and_equity)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Balance Sheet"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) =>
            downloadPdfMutation.mutateAsync({ asOfDate, organizationId: orgId })
          }
        />
      )}
    </div>
  );
}
