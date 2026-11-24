import { useState } from "react";
import { FileDown, TrendingUp, TrendingDown } from "lucide-react";
import { useCashFlowReport, useDownloadCashFlowPdf } from "../api/useCbAccounts";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";

function firstDayOfMonth(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
const TODAY = new Date().toISOString().slice(0, 10);

export function CbCashFlowPage() {
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(TODAY);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadCashFlowPdf();
  const { data, isLoading } = useCashFlowReport(dateFrom || undefined, dateTo || undefined);

  return (
    <div>
      <PageHeader
        title="Laporan Arus Kas"
        subtitle="Saldo awal, kas masuk & keluar per kategori, dan saldo akhir — per akun kas/bank."
      />

      {/* KPI Summary Row */}
      {data && (
        <div style={{ padding: "0 2rem 1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "Saldo Awal", value: data.grand_total.opening_balance, color: "#374151", bg: "#f5f5f5", border: "#1a1a1a" },
              { label: "Total Kas Masuk", value: data.grand_total.total_inflow, color: "#16a34a", bg: "#f0fdf4", border: "#16a34a", icon: "↑" },
              { label: "Total Kas Keluar", value: data.grand_total.total_outflow, color: "#dc2626", bg: "#fef2f2", border: "#dc2626", icon: "↓" },
              { label: "Saldo Akhir", value: data.grand_total.closing_balance, color: "#1d4ed8", bg: "#eff6ff", border: "#1d4ed8" },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: kpi.bg, border: `2px solid ${kpi.border}`, borderRadius: 12, padding: "0.9rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.3rem" }}>
                  {"icon" in kpi ? (kpi.icon === "↑" ? <TrendingUp size={12} style={{ display: "inline", marginRight: 2 }} /> : <TrendingDown size={12} style={{ display: "inline", marginRight: 2 }} />) : null}
                  {kpi.label}
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: kpi.color, fontFamily: "monospace" }}>
                  {formatCurrency(kpi.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
          <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Dari Tanggal</label>
              <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Sampai Tanggal</label>
              <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* Account Cards */}
      <div style={{ padding: "0 2rem 2rem" }}>
        {isLoading && <LoadingState label="Menghitung arus kas..." />}

        {data && data.accounts.length === 0 && (
          <EmptyState title="Belum Ada Akun Kas/Bank" subtitle="Daftarkan akun kas/bank dulu untuk melihat laporan arus kas." />
        )}

        {data && data.accounts.length > 0 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            {data.accounts.map((acc) => (
              <div key={acc.account_id} className="card" style={{ padding: "1.5rem" }}>
                {/* Account header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#1a1a1a" }}>{acc.account_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--grey)", fontFamily: "monospace", marginTop: 3 }}>{acc.account_code}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--grey)", marginBottom: 3 }}>Saldo Akhir</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--accent)", fontFamily: "monospace" }}>{formatCurrency(acc.closing_balance)}</div>
                  </div>
                </div>

                {/* Flow stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: acc.by_category.length > 0 ? "1.25rem" : 0 }}>
                  {[
                    { label: "Saldo Awal", value: acc.opening_balance, color: "#374151" },
                    { label: "Kas Masuk", value: acc.total_inflow, color: "#16a34a" },
                    { label: "Kas Keluar", value: acc.total_outflow, color: "#dc2626" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: s.color === "#16a34a" ? "#f0fdf4" : s.color === "#dc2626" ? "#fef2f2" : "#f5f5f5", borderRadius: 10, padding: "0.75rem 1rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{formatCurrency(s.value)}</div>
                    </div>
                  ))}
                </div>

                {/* Category breakdown */}
                {acc.by_category.length > 0 && (
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--grey)", marginBottom: "0.6rem" }}>Rincian per Kategori</div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: "left", padding: "4px 8px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey)", borderBottom: "1px solid var(--border)" }}>Kategori</th>
                          <th style={{ textAlign: "right", padding: "4px 8px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#16a34a", borderBottom: "1px solid var(--border)" }}>Masuk</th>
                          <th style={{ textAlign: "right", padding: "4px 8px", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#dc2626", borderBottom: "1px solid var(--border)" }}>Keluar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {acc.by_category.map((cat) => (
                          <tr key={cat.category} style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td style={{ padding: "6px 8px", color: "#374151" }}>{cat.category}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#16a34a" }}>{cat.inflow > 0 ? formatCurrency(cat.inflow) : <span style={{ color: "#d1d5db" }}>—</span>}</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: "#dc2626" }}>{cat.outflow > 0 ? formatCurrency(cat.outflow) : <span style={{ color: "#d1d5db" }}>—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Laporan Arus Kas"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ organizationId: orgId, date_from: dateFrom || undefined, date_to: dateTo || undefined })}
        />
      )}
    </div>
  );
}
