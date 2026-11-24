import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Receipt, CreditCard, Users, BarChart2, Plus, ArrowRight,
  AlertTriangle, CheckCircle2, ChevronRight
} from "lucide-react";
import { useArInvoiceList } from "../api/useArInvoices";
import { useArPaymentList } from "../api/useArPayments";
import { useArCustomerProfileList } from "../api/useArCustomerProfiles";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";

export function ArHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "customers">("invoices");

  const { data: invoices, isLoading: loadingInvoices } = useArInvoiceList({ per_page: 5 });
  const { data: payments, isLoading: loadingPayments } = useArPaymentList({ per_page: 5 });
  const { data: customers, isLoading: loadingCustomers } = useArCustomerProfileList({ per_page: 5 });

  const outstandingAr = (invoices?.data ?? [])
    .filter((i) => ["posted", "partially_paid"].includes(i.status))
    .reduce((s, i) => s + Number(i.outstanding_amount), 0);

  const overdueAmount = (invoices?.data ?? [])
    .filter((i) => i.is_overdue)
    .reduce((s, i) => s + Number(i.outstanding_amount), 0);

  const overdueCount = (invoices?.data ?? []).filter((i) => i.is_overdue).length;

  const totalPaid = (payments?.data ?? [])
    .filter((p) => p.status === "posted")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="AR — Piutang Customer"
        subtitle="Finance & Accounting › Accounts Receivable — Monitoring invoice, pembayaran, dan tagihan klien"
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/finance/ar-invoices/new")}>
            <Plus size={15} /> Invoice Baru
          </Button>
          <Button variant="secondary" onClick={() => navigate("/finance/ar/payments")}>
            <CreditCard size={15} /> Pembayaran
          </Button>
          <Button variant="secondary" onClick={() => navigate("/finance/ar/customers")}>
            <Users size={15} /> Pelanggan
          </Button>
        </div>
      </PageHeader>

      {/* KPI Strip */}
      <div className="px-7 py-5">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          <KpiCard icon={<Receipt size={18} />} label="Outstanding Piutang" value={formatCurrency(outstandingAr)} color="#1d4ed8" bg="#dbeafe" sub="Belum lunas" />
          <KpiCard icon={<AlertTriangle size={18} />} label="Overdue" value={overdueCount > 0 ? `${overdueCount} invoice` : "—"} color="#dc2626" bg="#fee2e2" sub={overdueAmount > 0 ? formatCurrency(overdueAmount) : undefined} />
          <KpiCard icon={<CheckCircle2 size={18} />} label="Total Dibayar" value={formatCurrency(totalPaid)} color="#15803d" bg="#d9f2e6" sub="Semua pembayaran" />
          <KpiCard icon={<Users size={18} />} label="Customer Aktif" value={String(customers?.total ?? 0)} color="#7c3aed" bg="#ede9fe" sub="terdaftar" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: "1rem" }}>
          {([
            { key: "invoices" as const, label: "Invoice", count: invoices?.total },
            { key: "payments" as const, label: "Pembayaran", count: payments?.total },
            { key: "customers" as const, label: "Customer", count: customers?.total },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "0.6rem 1.25rem",
                border: "none",
                background: "none",
                borderBottom: `2px solid ${activeTab === tab.key ? "var(--accent)" : "transparent"}`,
                marginBottom: "-2px",
                cursor: "pointer",
                fontWeight: activeTab === tab.key ? 700 : 400,
                color: activeTab === tab.key ? "var(--accent)" : "var(--grey)",
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{ background: "var(--bg-subtle)", color: "var(--grey)", borderRadius: 10, padding: "0.05rem 0.4rem", fontSize: "0.7rem" }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Invoice tab */}
        {activeTab === "invoices" && (
          <div className="content-card" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--grey)" }}>5 invoice terbaru</span>
              <Link to="/finance/ar-invoices" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingInvoices && <LoadingState label="Memuat..." />}
            {invoices && (
              <table className="table">
                <thead>
                  <tr><th>No. Invoice</th><th>Customer</th><th>Jatuh Tempo</th><th>Total</th><th>Sisa</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {invoices.data.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent)" }}>{inv.invoice_number}</td>
                      <td style={{ fontSize: "0.85rem" }}>{inv.customer_name}</td>
                      <td style={{ fontSize: "0.82rem" }}>
                        {formatDate(inv.due_date)}
                        {inv.is_overdue && <span className="badge badge-churned" style={{ marginLeft: "0.4rem", fontSize: "0.68rem" }}>Telat {inv.days_overdue}h</span>}
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</td>
                      <td style={{ fontFamily: "monospace" }}>{formatCurrency(inv.outstanding_amount)}</td>
                      <td>
                        <span className={`badge badge-${inv.status === "paid" ? "active" : inv.status === "void" ? "churned" : "prospect"}`}>
                          {inv.status === "posted" ? "Terposting" : inv.status === "paid" ? "Lunas" : inv.status === "partially_paid" ? "Sebagian" : "Void"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Payments tab */}
        {activeTab === "payments" && (
          <div className="content-card" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--grey)" }}>5 pembayaran terbaru</span>
              <Link to="/finance/ar/payments" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingPayments && <LoadingState label="Memuat..." />}
            {payments && (
              <table className="table">
                <thead>
                  <tr><th>No. Pembayaran</th><th>Customer</th><th>Tanggal</th><th style={{ textAlign: "right" }}>Jumlah</th><th>Metode</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {payments.data.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.payment_number}</td>
                      <td style={{ fontSize: "0.85rem" }}>{p.customer_name}</td>
                      <td style={{ fontSize: "0.82rem" }}>{formatDate(p.payment_date)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--good)" }}>{formatCurrency(p.amount)}</td>
                      <td style={{ fontSize: "0.8rem" }}>{p.payment_method === "bank_transfer" ? "Transfer" : p.payment_method === "cash" ? "Tunai" : p.payment_method}</td>
                      <td><span className={`badge badge-${p.status === "posted" ? "active" : "churned"}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Customers tab */}
        {activeTab === "customers" && (
          <div className="content-card" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--grey)" }}>Customer terdaftar</span>
              <Link to="/finance/ar/customers" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingCustomers && <LoadingState label="Memuat..." />}
            {customers && (
              <table className="table">
                <thead>
                  <tr><th>Customer</th><th>Kode</th><th style={{ textAlign: "right" }}>Credit Limit</th><th>Credit Hold</th><th></th></tr>
                </thead>
                <tbody>
                  {customers.data.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontSize: "0.85rem", fontWeight: 600 }}>{c.customer_name}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{c.customer_code ?? "—"}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                        {c.credit_limit ? formatCurrency(Number(c.credit_limit)) : <span style={{ color: "var(--grey)", fontStyle: "italic" }}>Unlimited</span>}
                      </td>
                      <td>
                        {c.is_credit_hold
                          ? <span className="badge badge-churned">Hold</span>
                          : <span className="badge badge-active">OK</span>}
                      </td>
                      <td><Link to={`/finance/ar/customers/${c.customer_id}`} style={{ color: "var(--accent)", fontSize: "0.8rem" }}>Detail →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
          <QuickLinkCard icon={<Receipt size={20} />} label="AR Invoice" desc="Kelola & buat invoice baru" to="/finance/ar-invoices" color="#1d4ed8" />
          <QuickLinkCard icon={<CreditCard size={20} />} label="Pembayaran" desc="Catat pembayaran customer" to="/finance/ar/payments" color="#15803d" />
          <QuickLinkCard icon={<BarChart2 size={20} />} label="Aging Piutang" desc="Umur piutang per customer" to="/finance/ar/aging" color="#7c3aed" />
          <QuickLinkCard icon={<Users size={20} />} label="Credit Limit" desc="Atur limit & credit hold" to="/finance/ar/customers" color="#b45309" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, bg, sub }: {
  icon: React.ReactNode; label: string; value: string; color: string; bg: string; sub?: string;
}) {
  return (
    <div className="card" style={{ padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "0.875rem" }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.7rem", color: "var(--grey)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
        <div style={{ fontSize: "1.05rem", fontWeight: 800, color, marginTop: "0.1rem" }}>{value}</div>
        {sub && <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.1rem" }}>{sub}</div>}
      </div>
    </div>
  );
}

function QuickLinkCard({ icon, label, desc, to, color }: {
  icon: React.ReactNode; label: string; desc: string; to: string; color: string;
}) {
  return (
    <Link
      to={to}
      style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.875rem 1rem",
        background: "white",
        border: "1px solid var(--border)",
        borderRadius: 12,
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        el.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "none";
        el.style.borderColor = "var(--border)";
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: color + "18", color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--grey-dark)" }}>{label}</div>
        <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</div>
      </div>
      <ChevronRight size={14} color="var(--grey)" style={{ marginLeft: "auto", flexShrink: 0 }} />
    </Link>
  );
}
