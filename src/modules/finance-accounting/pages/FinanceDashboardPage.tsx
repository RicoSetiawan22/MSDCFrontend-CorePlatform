import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertTriangle,
  Clock,
  Wallet,
  BarChart2,
  ArrowRight,
  AlertCircle,
  FileText,
  Repeat,
} from "lucide-react";
import { useFinanceDashboard } from "../api/useFinanceDashboard";
import type { BillingMetrics, CashMetrics } from "../api/financeDashboardApi";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";

export function FinanceDashboardPage() {
  const { data, isLoading, isError } = useFinanceDashboard();

  if (isLoading) return <LoadingState label="Memuat dashboard..." />;
  if (isError || !data) {
    return (
      <div>
        <PageHeader title="Finance Dashboard" subtitle="Ringkasan kesehatan keuangan perusahaan." />
        <div className="content-card">
          <div className="empty-state">
            <AlertCircle size={40} style={{ color: "var(--bad)" }} />
            <p style={{ marginTop: "0.75rem" }}>
              Gagal memuat data dashboard. Pastikan Anda punya akses ke modul Finance.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, invoice_metrics, operational_metrics, billing_metrics, cash_metrics } = data;

  return (
    <div>
      <PageHeader title="Finance Dashboard" subtitle="Ringkasan kesehatan keuangan perusahaan." />

      {/* ==================== KPI Cards ==================== */}
      <div className="dashboard-grid">
        {/* Revenue */}
        <div className="kpi-card kpi-card--revenue">
          <div className="kpi-card__icon">
            <TrendingUp size={22} />
          </div>
          <div className="kpi-card__body">
            <span className="kpi-card__label">{kpis.revenue_this_month.label}</span>
            <span className="kpi-card__value">{formatCurrency(kpis.revenue_this_month.value)}</span>
            {kpis.revenue_this_month.period && <span className="kpi-card__period">{kpis.revenue_this_month.period}</span>}
          </div>
        </div>

        {/* Outstanding AR */}
        <div className="kpi-card kpi-card--ar">
          <div className="kpi-card__icon"><Receipt size={22} /></div>
          <div className="kpi-card__body">
            <span className="kpi-card__label">{kpis.outstanding_ar.label}</span>
            <span className="kpi-card__value">{formatCurrency(kpis.outstanding_ar.value)}</span>
          </div>
        </div>

        {/* Outstanding AP */}
        <div className="kpi-card kpi-card--ap">
          <div className="kpi-card__icon"><Wallet size={22} /></div>
          <div className="kpi-card__body">
            <span className="kpi-card__label">{kpis.outstanding_ap.label}</span>
            <span className="kpi-card__value">{formatCurrency(kpis.outstanding_ap.value)}</span>
          </div>
        </div>

        {/* Cash Balance */}
        <div className="kpi-card kpi-card--cash">
          <div className="kpi-card__icon"><BarChart2 size={22} /></div>
          <div className="kpi-card__body">
            <span className="kpi-card__label">{kpis.cash_balance.label}</span>
            <span className="kpi-card__value">{formatCurrency(kpis.cash_balance.value)}</span>
          </div>
        </div>
      </div>

      {/* Net Profit Banner */}
      <div className={`profit-banner ${kpis.net_profit.is_positive !== false ? "profit-banner--positive" : "profit-banner--negative"}`}>
        <div className="profit-banner__content">
          <span className="profit-banner__label">{kpis.net_profit.label}</span>
          <span className="profit-banner__value">{formatCurrency(kpis.net_profit.value)}</span>
        </div>
        <div className="profit-banner__icon">
          {kpis.net_profit.is_positive !== false ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
        </div>
      </div>

      {/* ==================== Invoice Metrics + Operational ==================== */}
      <div className="dashboard-sections">
        {/* Invoice Metrics */}
        <section className="dashboard-section">
          <h2 className="dashboard-section__title">Invoice Metrics</h2>
          <div className="metric-cards">
            <div className="metric-card">
              <div className="metric-card__header">
                <Clock size={18} className="metric-card__icon metric-card__icon--warning" />
                <span className="metric-card__label">{invoice_metrics.due_today.label}</span>
              </div>
              <span className="metric-card__value">{invoice_metrics.due_today.count}</span>
            </div>
            <div className="metric-card">
              <div className="metric-card__header">
                <AlertTriangle size={18} className="metric-card__icon metric-card__icon--danger" />
                <span className="metric-card__label">{invoice_metrics.overdue.label}</span>
              </div>
              <span className="metric-card__value">{invoice_metrics.overdue.count}</span>
              <span className="metric-card__sub">{formatCurrency(invoice_metrics.overdue.amount)}</span>
            </div>
            <div className="metric-card">
              <div className="metric-card__header">
                <Receipt size={18} className="metric-card__icon metric-card__icon--info" />
                <span className="metric-card__label">{invoice_metrics.pending.label}</span>
              </div>
              <span className="metric-card__value">{invoice_metrics.pending.count}</span>
              <span className="metric-card__sub">{formatCurrency(invoice_metrics.pending.amount)}</span>
            </div>
          </div>
        </section>

        {/* Operational Metrics */}
        <section className="dashboard-section">
          <h2 className="dashboard-section__title">Operational Metrics</h2>
          <div className="metric-cards">
            <div className="metric-card">
              <div className="metric-card__header">
                <BarChart2 size={18} className="metric-card__icon metric-card__icon--primary" />
                <span className="metric-card__label">Budget Utilization {operational_metrics.budget_utilization.fiscal_year}</span>
              </div>
              <div className="gauge-wrapper">
                <div className="gauge">
                  <div
                    className={`gauge__fill ${operational_metrics.budget_utilization.percentage > 100 ? "gauge__fill--danger" : operational_metrics.budget_utilization.percentage > 85 ? "gauge__fill--warning" : "gauge__fill--success"}`}
                    style={{ width: `${Math.min(operational_metrics.budget_utilization.percentage, 100)}%` }}
                  />
                </div>
                <span className="gauge__label">{operational_metrics.budget_utilization.percentage}%</span>
              </div>
              <span className="metric-card__sub">
                {formatCurrency(operational_metrics.budget_utilization.total_actual)} dari {formatCurrency(operational_metrics.budget_utilization.total_budget)}
              </span>
            </div>
            <div className="metric-card">
              <div className="metric-card__header">
                <TrendingUp size={18} className="metric-card__icon metric-card__icon--success" />
                <span className="metric-card__label">Operating Margin {operational_metrics.operating_margin.fiscal_year}</span>
              </div>
              <div className="gauge-wrapper">
                <div className="gauge">
                  <div
                    className={`gauge__fill ${operational_metrics.operating_margin.percentage < 0 ? "gauge__fill--danger" : operational_metrics.operating_margin.percentage < 10 ? "gauge__fill--warning" : "gauge__fill--success"}`}
                    style={{ width: `${Math.min(Math.max(operational_metrics.operating_margin.percentage, 0), 100)}%` }}
                  />
                </div>
                <span className="gauge__label">{operational_metrics.operating_margin.percentage}%</span>
              </div>
              <span className="metric-card__sub">Net: {formatCurrency(operational_metrics.operating_margin.net_profit)}</span>
            </div>
          </div>
        </section>
      </div>

      {/* ==================== Billing Integration ==================== */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
        {/* Billing Recent Runs */}
        <div className="content-card" style={{ margin: 0 }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Repeat size={16} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Billing Integration</span>
              <span className="badge badge-active">{billing_metrics.active_contracts} kontrak aktif</span>
            </div>
            <Link to="/finance/billing/contracts" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none" }}>
              Lihat semua →
            </Link>
          </div>

          {billing_metrics.recent_runs.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)", fontSize: "0.85rem" }}>
              Belum ada billing run. Kontrak aktif akan ditagih otomatis tiap bulan.
            </div>
          ) : (
            <div style={{ maxHeight: 280, overflowY: "auto" }}>
              {billing_metrics.recent_runs.map((run: BillingMetrics["recent_runs"][number]) => (
                <div key={run.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.82rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                      <FileText size={13} color="var(--accent)" />
                      <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", color: "var(--accent)" }}>
                        {run.contract_number ?? "—"}
                      </span>
                    </div>
                    <div style={{ color: "var(--grey)", fontSize: "0.75rem" }}>
                      {run.customer_name ?? "—"} · {run.period_date ?? "—"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {run.invoice_number ? (
                      <Link to="/finance/ar-invoices" style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.78rem", color: "var(--good)" }}>
                        {run.invoice_number}
                        <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{formatCurrency(run.invoice_amount ?? 0)}</div>
                      </Link>
                    ) : (
                      <span style={{ color: "var(--grey)", fontSize: "0.78rem" }}>—</span>
                    )}
                  </div>
                  <span className={`badge badge-${run.status === "success" ? "active" : run.status === "skipped" ? "prospect" : "churned"}`} style={{ flexShrink: 0 }}>
                    {run.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cash & Bank Reconciliation */}
        <div className="content-card" style={{ margin: 0 }}>
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <BarChart2 size={16} color="var(--accent)" />
              <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>Kas & Bank</span>
              {cash_metrics.unreconciled_entries > 0 && (
                <span className="badge badge-churned">{cash_metrics.unreconciled_entries} belum reconcile</span>
              )}
            </div>
            <Link to="/finance/cb/accounts" style={{ fontSize: "0.78rem", color: "var(--accent)", textDecoration: "none" }}>
              Rincian →
            </Link>
          </div>

          {/* Per-account balances */}
          {cash_metrics.accounts.length === 0 ? (
            <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--grey)", fontSize: "0.85rem" }}>
              Tidak ada akun kas/bank.
            </div>
          ) : (
            <div>
              {cash_metrics.accounts.map((acc: CashMetrics["accounts"][number]) => (
                <div key={acc.account_id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border)", fontSize: "0.85rem" }}>
                  <div>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, marginBottom: "0.2rem" }}>{acc.account_code}</div>
                    <div style={{ color: "var(--grey)", fontSize: "0.75rem" }}>{acc.account_name}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.95rem", color: acc.net_balance >= 0 ? "var(--good)" : "var(--bad)" }}>
                      {formatCurrency(acc.net_balance)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>
                      Dr {formatCurrency(acc.total_debit)} / Cr {formatCurrency(acc.total_credit)}
                    </div>
                  </div>
                </div>
              ))}
              {/* Total */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 1.25rem", background: "var(--bg-subtle)", fontWeight: 800 }}>
                <span style={{ fontSize: "0.85rem" }}>Total Kas & Bank</span>
                <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "var(--accent)" }}>
                  {formatCurrency(cash_metrics.total_cash_balance)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== Quick Links ==================== */}
      <div className="dashboard-section">
        <h2 className="dashboard-section__title">Akses Cepat</h2>
        <div className="quick-links">
          <QuickLink to="/finance/ar-invoices" label="AR Invoice" desc="Kelola piutang pelanggan" />
          <QuickLink to="/finance/ap-bills" label="AP Bill" desc="Kelola hutang vendor" />
          <QuickLink to="/finance/cb/accounts" label="Kas & Bank" desc="Kelola rekening bank" />
          <QuickLink to="/finance/gl/journals" label="General Ledger" desc="Lihat jurnal akuntansi" />
          <QuickLink to="/finance/reports" label="Laporan Keuangan" desc="Neraca, Laba Rugi, Arus Kas" />
          <QuickLink to="/finance/billing/contracts" label="Billing Contract" desc="Kelola kontrak tagihan" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, label, desc }: { to: string; label: string; desc: string }) {
  return (
    <Link to={to} className="quick-link">
      <div className="quick-link__content">
        <span className="quick-link__label">{label}</span>
        <span className="quick-link__desc">{desc}</span>
      </div>
      <ArrowRight size={16} className="quick-link__arrow" />
    </Link>
  );
}
