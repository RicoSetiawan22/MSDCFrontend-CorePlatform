import { useState } from "react";
import { FileDown, TrendingUp, TrendingDown, Receipt, Wallet, BarChart2 } from "lucide-react";
import { useExecutiveSummary, useDownloadExecutiveSummaryPdf } from "../api/useFinanceDashboard";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency } from "@shared/lib/format";

const MONTH_LABEL = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

function kpiCard(label: string, value: string, sub: string, bg: string, border: string, textColor: string, Icon?: React.ElementType) {
  return (
    <div style={{ background: bg, border: `2px solid ${border}`, borderRadius: 10, padding: "1rem", textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: "0.3rem" }}>
        {Icon && <Icon size={16} color={textColor} />}
        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666" }}>{label}</span>
      </div>
      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: textColor, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.72rem", color: "#888", marginTop: "0.2rem" }}>{sub}</div>}
    </div>
  );
}

function arAgingBar(label: string, amount: number, pct: number, bg: string, textColor: string, count: number) {
  if (amount <= 0 && count <= 0) return null;
  return (
    <div style={{ flex: pct > 0 ? pct : 0.5, background: bg, borderRadius: 8, padding: "0.75rem", minWidth: 120, border: `2px solid ${bg.replace("33", "66")}` }}>
      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: textColor, letterSpacing: "0.04em", fontWeight: 700, marginBottom: "0.2rem" }}>{label}</div>
      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: textColor, fontFamily: "monospace" }}>{formatCurrency(amount)}</div>
      <div style={{ fontSize: "0.68rem", color: "#888", marginTop: "0.15rem" }}>{count} invoice</div>
      <div style={{ height: 4, background: `${textColor}33`, borderRadius: 2, marginTop: "0.4rem", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct * 2, 100)}%`, background: textColor, borderRadius: 2 }} />
      </div>
    </div>
  );
}

export function ExecutiveSummaryPage() {
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadExecutiveSummaryPdf();
  const { data, isLoading } = useExecutiveSummary();

  if (isLoading) return <LoadingState label="Memuat..." />;

  const kpis = data?.kpis;
  const arAging = data?.ar_aging;
  const invoiceMetrics = data?.invoice_metrics;
  const cashMetrics = data?.cash_metrics;

  const cashBalance = kpis?.cash_balance?.value ?? 0;
  const arOutstanding = kpis?.ar_outstanding?.value ?? 0;
  const apOutstanding = kpis?.ap_outstanding?.value ?? 0;
  const revenueMtd = kpis?.revenue_mtd?.value ?? kpis?.revenue_this_month?.value ?? 0;
  const netProfit = kpis?.net_profit_mtd ?? kpis?.net_profit ?? { value: 0, is_positive: true };
  const arOutstandingCount = kpis?.ar_outstanding?.count ?? 0;
  const isProfit = (netProfit?.is_positive !== false) && (netProfit?.value ?? 0) >= 0;

  const arTotal = arAging
    ? (arAging.current?.amount ?? 0) + (arAging.days_1_30?.amount ?? 0) +
      (arAging.days_31_60?.amount ?? 0) + (arAging.days_61_90?.amount ?? 0) +
      (arAging.days_90plus?.amount ?? 0)
    : 0;

  const overdueCount = invoiceMetrics?.overdue?.count ?? 0;
  const overdueAmount = invoiceMetrics?.overdue?.amount ?? 0;
  const pendingCount = invoiceMetrics?.pending?.count ?? 0;
  const pendingAmount = invoiceMetrics?.pending?.amount ?? 0;
  const dueTodayCount = invoiceMetrics?.due_today?.count ?? 0;

  const cashAccounts = cashMetrics?.accounts ?? [];
  const totalCash = cashMetrics?.total_cash ?? cashBalance;

  return (
    <div>
      <PageHeader
        title="Executive Financial Summary"
        subtitle="Snapshot keuangan terkini — Revenue, AR/AP Outstanding, Cash Position, AR Aging, dan Laba Rugi."
      />

      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <button
          onClick={() => setIsPrintModalOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem" }}
        >
          <FileDown size={15} /> Cetak PDF
        </button>
      </div>

      <div style={{ padding: "0 2rem 2rem" }} className="print-area">

        {/* ---- REPORT HEADER ---- */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem", padding: "1rem 2rem", border: "2px solid var(--border)", borderRadius: 10, background: "linear-gradient(135deg, #f8fafc, #f1f5f9)" }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1a1a1a", letterSpacing: "0.03em", marginBottom: "0.2rem" }}>PT MSDC INDONESIA</div>
          <div style={{ fontSize: "1rem", fontWeight: 600, color: "#374151", marginBottom: "0.2rem" }}>Executive Financial Summary</div>
          <div style={{ fontSize: "0.8rem", color: "#666" }}>Periode: {MONTH_LABEL} &nbsp;|&nbsp; Dicetak: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</div>
        </div>

        {/* ---- KPI ROW ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {kpiCard("Revenue MTD", formatCurrency(revenueMtd), MONTH_LABEL, "#f0fdf4", "#16a34a", "#16a34a", TrendingUp)}
          {kpiCard("AR Outstanding", formatCurrency(arOutstanding), `${arOutstandingCount} invoice belum lunas`, "#fef2f2", "#dc2626", "#dc2626", Receipt)}
          {kpiCard("AP Outstanding", formatCurrency(apOutstanding), "Hutang usaha", "#fef3c7", "#b45309", "#b45309", Wallet)}
          {kpiCard("Cash Balance", formatCurrency(totalCash), "Kas & Bank", "#eff6ff", "#1d4ed8", "#1d4ed8", BarChart2)}
          {kpiCard(
            isProfit ? "Net Profit MTD" : "Net Loss MTD",
            formatCurrency(Math.abs(netProfit?.value ?? 0)),
            isProfit ? "✅ Laba" : "⚠️ Rugi",
            isProfit ? "#f5f3ff" : "#fef2f2",
            isProfit ? "#7c3aed" : "#dc2626",
            isProfit ? "#7c3aed" : "#dc2626",
            isProfit ? TrendingUp : TrendingDown
          )}
        </div>

        {/* ---- TWO-COLUMN: Balance Sheet + Cash Position ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>

          {/* LEFT: Balance Sheet Summary */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#1a1a1a", color: "white", padding: "0.6rem 1rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              📋 Neraca (Balance Sheet)
            </div>
            <div style={{ padding: "0.75rem" }}>
              {/* Assets */}
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem", paddingBottom: "0.3rem", borderBottom: "1px solid #e5e7eb" }}>ASET</div>
              {[
                { label: "Total Aset (dari GL)", value: kpis?.cash_balance?.value ?? 0, bold: true },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px dashed #f3f4f6" }}>
                  <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: r.bold ? 700 : 400 }}>{r.label}</span>
                  <span style={{ fontSize: "0.82rem", fontFamily: "monospace", fontWeight: r.bold ? 700 : 500, color: r.bold ? "#1a1a1a" : "#374151" }}>{formatCurrency(r.value)}</span>
                </div>
              ))}

              {/* Liabilities */}
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem", paddingTop: "0.6rem", paddingBottom: "0.3rem", borderBottom: "1px solid #e5e7eb" }}>KEWAJIBAN (LIABILITAS)</div>
              {[
                { label: "Total Kewajiban", value: apOutstanding, bold: true },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0", borderBottom: "1px dashed #f3f4f6" }}>
                  <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: r.bold ? 700 : 400 }}>{r.label}</span>
                  <span style={{ fontSize: "0.82rem", fontFamily: "monospace", fontWeight: r.bold ? 700 : 500, color: "#b45309" }}>{formatCurrency(r.value)}</span>
                </div>
              ))}

              {/* Equity */}
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem", paddingTop: "0.6rem", paddingBottom: "0.3rem", borderBottom: "1px solid #e5e7eb" }}>EKUITAS</div>
              {[
                { label: "Total Ekuitas", value: Math.max(0, (kpis?.cash_balance?.value ?? 0) - apOutstanding), bold: true, color: "#16a34a" },
              ].map((r) => (
                <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.35rem 0" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#374151" }}>{r.label}</span>
                  <span style={{ fontSize: "0.82rem", fontFamily: "monospace", fontWeight: 700, color: r.color ?? "#374151" }}>{formatCurrency(r.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Cash Position */}
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: "#1d4ed8", color: "white", padding: "0.6rem 1rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              💰 Posisi Kas &amp; Bank
            </div>
            {cashAccounts.length > 0 ? (
              <>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "#f5f5f5" }}>
                      <th style={{ padding: "0.4rem 0.75rem", textAlign: "left", fontSize: "0.7rem", color: "#666", textTransform: "uppercase" }}>Akun</th>
                      <th style={{ padding: "0.4rem 0.75rem", textAlign: "right", fontSize: "0.7rem", color: "#666", textTransform: "uppercase" }}>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cashAccounts.slice(0, 5).map((acc: any, i: number) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.4rem 0.75rem" }}>
                          <div style={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 600 }}>{acc.account_code}</div>
                          <div style={{ fontSize: "0.7rem", color: "#666" }}>{acc.account_name}</div>
                        </td>
                        <td style={{ padding: "0.4rem 0.75rem", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: (acc.net_balance ?? 0) >= 0 ? "#1d4ed8" : "#dc2626" }}>
                          {formatCurrency(acc.net_balance ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ padding: "0.6rem 0.75rem", background: "#1a1a1a", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.85rem", color: "white" }}>
                  <span>Total Kas &amp; Bank</span>
                  <span style={{ fontFamily: "monospace" }}>{formatCurrency(totalCash)}</span>
                </div>
              </>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", color: "#888", fontSize: "0.82rem" }}>Tidak ada akun kas/bank ditemukan.</div>
            )}
          </div>
        </div>

        {/* ---- AR AGING SUMMARY ---- */}
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ background: "#dc2626", color: "white", padding: "0.6rem 1rem", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "10px 10px 0 0" }}>
            📅 Umur Piutang (AR Aging) — Total: {formatCurrency(arTotal)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", padding: "0.75rem", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", background: "#fff" }}>
            {arAgingBar("Current", arAging?.current?.amount ?? 0, arTotal > 0 ? ((arAging?.current?.amount ?? 0) / arTotal) * 5 : 0, "#dcfce7", "#16a34a", arAging?.current?.count ?? 0)}
            {arAgingBar("1–30 Days", arAging?.days_1_30?.amount ?? 0, arTotal > 0 ? ((arAging?.days_1_30?.amount ?? 0) / arTotal) * 5 : 0, "#fef9c3", "#ca8a04", arAging?.days_1_30?.count ?? 0)}
            {arAgingBar("31–60 Days", arAging?.days_31_60?.amount ?? 0, arTotal > 0 ? ((arAging?.days_31_60?.amount ?? 0) / arTotal) * 5 : 0, "#fed7aa", "#c2410c", arAging?.days_31_60?.count ?? 0)}
            {arAgingBar("61–90 Days", arAging?.days_61_90?.amount ?? 0, arTotal > 0 ? ((arAging?.days_61_90?.amount ?? 0) / arTotal) * 5 : 0, "#fecaca", "#dc2626", arAging?.days_61_90?.count ?? 0)}
            {arAgingBar("> 90 Days", arAging?.days_90plus?.amount ?? 0, arTotal > 0 ? ((arAging?.days_90plus?.amount ?? 0) / arTotal) * 5 : 0, "#fee2e2", "#991b1b", arAging?.days_90plus?.count ?? 0)}
          </div>
        </div>

        {/* ---- INVOICE METRICS + AP STATUS ---- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
          {[
            { label: "Due Today", count: dueTodayCount, amount: 0, color: "#0369a1", bg: "#e0f2fe" },
            { label: "Overdue", count: overdueCount, amount: overdueAmount, color: "#dc2626", bg: "#fef2f2" },
            { label: "Pending (Belum Jatuh Tempo)", count: pendingCount, amount: pendingAmount, color: "#16a34a", bg: "#f0fdf4" },
          ].map((m) => (
            <div key={m.label} style={{ background: m.bg, border: `2px solid ${m.color}44`, borderRadius: 10, padding: "1rem", textAlign: "center" }}>
              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em", color: m.color, marginBottom: "0.3rem" }}>{m.label}</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, color: m.color }}>{m.count}</div>
              <div style={{ fontSize: "0.82rem", fontFamily: "monospace", color: m.color, marginTop: "0.2rem" }}>{formatCurrency(m.amount)}</div>
            </div>
          ))}
        </div>

        {/* ---- CASH POSITION MINI (if no cash accounts) ---- */}
        {cashAccounts.length === 0 && cashBalance > 0 && (
          <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: "1rem", textAlign: "center", color: "#888" }}>
            <div style={{ fontSize: "0.82rem" }}>Cash Balance dari KPI: <strong style={{ color: "#1d4ed8" }}>{formatCurrency(cashBalance)}</strong></div>
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Executive Financial Summary"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync(orgId)}
        />
      )}
    </div>
  );
}
