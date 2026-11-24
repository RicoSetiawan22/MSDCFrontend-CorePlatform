import { useState } from "react";
import { FileDown } from "lucide-react";
import { useApAgingReport, useDownloadAgingApPdf } from "../api/useApBills";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";

const TODAY = new Date().toISOString().slice(0, 10);

const BUCKET_COLS = [
  { key: "current",  label: "Belum Jatuh Tempo", bg: "#f0fdf4", border: "#16a34a", color: "#16a34a" },
  { key: "d1_30",   label: "1–30 Hari",        bg: "#fefce8", border: "#ca8a04", color: "#ca8a04" },
  { key: "d31_60",  label: "31–60 Hari",       bg: "#fff7ed", border: "#ea580c", color: "#ea580c" },
  { key: "d61_90",  label: "61–90 Hari",       bg: "#fef2f2", border: "#dc2626", color: "#dc2626" },
  { key: "d90_plus", label: "> 90 Hari",         bg: "#fff5f5", border: "#991b1b", color: "#991b1b" },
];

function RiskBadge({ overdue }: { overdue: number }) {
  if (overdue === 0) return <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 700, border: "1px solid #bbf7d0" }}>✓ Lancar</span>;
  if (overdue > 0) return <span style={{ background: "#fef9c3", color: "#a16207", padding: "2px 8px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 700, border: "1px solid #fde68a" }}>⚠ Perlu Perhatian</span>;
  return <span style={{ background: "#fee2e2", color: "#b91c1c", padding: "2px 8px", borderRadius: 12, fontSize: "0.68rem", fontWeight: 700, border: "1px solid #fecaca" }}>⚡ Mendesak</span>;
}

export function ApAgingReportPage() {
  const [asOfDate, setAsOfDate] = useState(TODAY);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const { data, isLoading } = useApAgingReport(asOfDate || undefined);
  const downloadPdfMutation = useDownloadAgingApPdf();

  const gt = data?.grand_total;
  const overdueTotal = (gt?.d1_30 ?? 0) + (gt?.d31_60 ?? 0) + (gt?.d61_90 ?? 0) + (gt?.d90_plus ?? 0);

  return (
    <div>
      <PageHeader
        title="Aging Hutang"
        subtitle="Hutang dikelompokkan per umur keterlambatan bayar — semakin merah, semakin mendesak untuk dibayar."
      />

      {/* KPI Row */}
      {data && gt && (
        <div style={{ padding: "0 2rem 1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.75rem", marginBottom: "0.875rem" }}>
            {BUCKET_COLS.map((b) => (
              <div key={b.key} style={{ background: b.bg, border: `2px solid ${b.border}`, borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.25rem" }}>{b.label}</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: b.color, fontFamily: "monospace" }}>
                  {formatCurrency((gt[b.key as keyof typeof gt] as number) ?? 0)}
                </div>
              </div>
            ))}
            {/* Total Outstanding */}
            <div style={{ background: "#eff6ff", border: "2px solid #1d4ed8", borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.25rem" }}>Total Hutang</div>
              <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#1d4ed8", fontFamily: "monospace" }}>{formatCurrency(gt.total)}</div>
            </div>
          </div>

          {/* Summary Banner */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ background: "#fff7ed", border: "2px solid #ea580c", borderRadius: 10, padding: "0.875rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666" }}>Total Hutang Outstanding</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a1a1a", fontFamily: "monospace", marginTop: "0.2rem" }}>{formatCurrency(gt.total)}</div>
              </div>
            </div>
            <div style={{ background: overdueTotal > 0 ? "#fef2f2" : "#f0fdf4", border: `2px solid ${overdueTotal > 0 ? "#dc2626" : "#16a34a"}`, borderRadius: 10, padding: "0.875rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666" }}>Total Jatuh Tempo</div>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: overdueTotal > 0 ? "#dc2626" : "#16a34a", fontFamily: "monospace", marginTop: "0.2rem" }}>{formatCurrency(overdueTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Per Tanggal</label>
            <input className="input" type="date" style={{ width: 200 }} value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} />
          </div>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!data}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, cursor: data ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.85rem", opacity: data ? 1 : 0.5 }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "0 2rem 2rem" }} className="print-area">
        {!data && isLoading && <LoadingState label="Memuat..." />}
        {data && data.vendors.length === 0 && (
          <EmptyState title="Tidak Ada Hutang Outstanding" subtitle="Semua bill sudah lunas per tanggal yang dipilih." />
        )}
        {data && data.vendors.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Table header */}
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Vendor</th>
                  {BUCKET_COLS.map((b) => (
                    <th key={b.key} style={{ textAlign: "right", color: b.color }}>{b.label}</th>
                  ))}
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.vendors.map((v) => {
                  const overdue = (v.d1_30 || 0) + (v.d31_60 || 0) + (v.d61_90 || 0) + (v.d90_plus || 0);
                  return (
                    <tr key={v.vendor_id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#1a1a1a" }}>{v.vendor_name}</div>
                        <RiskBadge overdue={overdue} />
                      </td>
                      {BUCKET_COLS.map((b) => (
                        <td key={b.key} style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.85rem", color: (v[b.key as keyof typeof v] as number) > 0 ? b.color : "var(--grey)" }}>
                          {(v[b.key as keyof typeof v] as number) > 0 ? formatCurrency(v[b.key as keyof typeof v] as number) : "—"}
                        </td>
                      ))}
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700 }}>{formatCurrency(v.total)}</td>
                    </tr>
                  );
                })}
                {/* Grand Total */}
                {gt && (
                  <tr style={{ background: "#1a1a1a", color: "white" }}>
                    <td style={{ fontWeight: 800, fontSize: "0.9rem" }}>GRAND TOTAL</td>
                    {BUCKET_COLS.map((b) => (
                      <td key={b.key} style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: b.color === "#16a34a" ? "#86efac" : b.color === "#ca8a04" ? "#fde047" : b.color === "#ea580c" ? "#fdba74" : "#fca5a5" }}>
                        {formatCurrency((gt[b.key as keyof typeof gt] as number) ?? 0)}
                      </td>
                    ))}
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#93c5fd", fontSize: "1rem" }}>{formatCurrency(gt.total)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Summary footer */}
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border)", background: "#f9fafb", display: "flex", gap: "2rem", fontSize: "0.78rem", color: "var(--grey)" }}>
              <span>✓ {data.vendors.length} vendor dengan hutang outstanding</span>
              {overdueTotal > 0 && <span style={{ color: "#dc2626" }}>⚠ Total jatuh tempo: {formatCurrency(overdueTotal)}</span>}
            </div>
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Aging Hutang"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ asOfDate, organizationId: orgId })}
        />
      )}
    </div>
  );
}
