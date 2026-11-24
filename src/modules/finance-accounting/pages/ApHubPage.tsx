import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText, CreditCard, Building2, BarChart2, Plus, ArrowRight,
  AlertTriangle, CheckCircle2, ChevronRight
} from "lucide-react";
import { useApBillList } from "../api/useApBills";
import { useApPaymentList } from "../api/useApPayments";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";

export function ApHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"bills" | "payments" | "vendors">("bills");

  const { data: bills, isLoading: loadingBills } = useApBillList({ per_page: 5 });
  const { data: payments, isLoading: loadingPayments } = useApPaymentList({ per_page: 5 });

  const outstandingAp = (bills?.data ?? [])
    .filter((b) => ["posted", "partially_paid"].includes(b.status))
    .reduce((s, b) => s + Number(b.outstanding_amount), 0);

  const overdueAmount = (bills?.data ?? [])
    .filter((b) => b.is_overdue)
    .reduce((s, b) => s + Number(b.outstanding_amount), 0);

  const overdueCount = (bills?.data ?? []).filter((b) => b.is_overdue).length;

  const totalPaid = (payments?.data ?? [])
    .filter((p) => p.status === "posted")
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div>
      <PageHeader
        title="AP — Hutang Vendor"
        subtitle="Finance & Accounting › Accounts Payable — Kelola tagihan vendor dan pembayaran hutang"
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/finance/ap-bills/new")}>
            <Plus size={15} /> Bill Baru
          </Button>
          <Button variant="secondary" onClick={() => navigate("/finance/ap/payments")}>
            <CreditCard size={15} /> Pembayaran
          </Button>
          <Button variant="secondary" onClick={() => navigate("/finance/ap/vendors")}>
            <Building2 size={15} /> Vendor
          </Button>
        </div>
      </PageHeader>

      {/* KPI Strip */}
      <div className="px-7 py-5">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          <KpiCard icon={<FileText size={18} />} label="Outstanding Hutang" value={formatCurrency(outstandingAp)} color="#b45309" bg="#fef3c7" sub="Belum lunas" />
          <KpiCard icon={<AlertTriangle size={18} />} label="Overdue" value={overdueCount > 0 ? `${overdueCount} bill` : "—"} color="#dc2626" bg="#fee2e2" sub={overdueAmount > 0 ? formatCurrency(overdueAmount) : undefined} />
          <KpiCard icon={<CheckCircle2 size={18} />} label="Total Dibayar" value={formatCurrency(totalPaid)} color="#15803d" bg="#d9f2e6" sub="Semua pembayaran" />
          <KpiCard icon={<Building2 size={18} />} label="Bills Aktif" value={String(bills?.total ?? 0)} color="#7c3aed" bg="#ede9fe" sub="terdaftar" />
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: "1rem" }}>
          {([
            { key: "bills" as const, label: "Bills", count: bills?.total },
            { key: "payments" as const, label: "Pembayaran", count: payments?.total },
            { key: "vendors" as const, label: "Vendor", count: undefined },
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

        {/* Bills tab */}
        {activeTab === "bills" && (
          <div className="content-card" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--grey)" }}>5 bill terbaru</span>
              <Link to="/finance/ap-bills" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingBills && <LoadingState label="Memuat..." />}
            {bills && (
              <table className="table">
                <thead>
                  <tr><th>No. Bill</th><th>Vendor</th><th>Referensi</th><th>Jatuh Tempo</th><th>Total</th><th>Sisa</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {bills.data.map((b) => (
                    <tr key={b.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent)" }}>{b.bill_number}</td>
                      <td style={{ fontSize: "0.85rem" }}>{b.vendor_name}</td>
                      <td style={{ fontSize: "0.75rem", color: "var(--grey)" }}>
                        {b.reference_type === "goods_receipt" ? (
                          <span title="Dibuat otomatis dari penerimaan barang PO">📦 {b.reference_number}</span>
                        ) : b.reference_number ?? "—"}
                      </td>
                      <td style={{ fontSize: "0.82rem" }}>
                        {formatDate(b.due_date)}
                        {b.is_overdue && <span className="badge badge-churned" style={{ marginLeft: "0.4rem", fontSize: "0.68rem" }}>Telat</span>}
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{formatCurrency(b.total_amount)}</td>
                      <td style={{ fontFamily: "monospace" }}>{formatCurrency(b.outstanding_amount)}</td>
                      <td>
                        <span className={`badge badge-${b.status === "paid" ? "active" : b.status === "void" ? "churned" : "prospect"}`}>
                          {b.status === "posted" ? "Terposting" : b.status === "paid" ? "Lunas" : b.status === "partially_paid" ? "Sebagian" : "Void"}
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
              <Link to="/finance/ap/payments" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingPayments && <LoadingState label="Memuat..." />}
            {payments && (
              <table className="table">
                <thead>
                  <tr><th>No. Pembayaran</th><th>Vendor</th><th>Tanggal</th><th style={{ textAlign: "right" }}>Jumlah</th><th>Metode</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {payments.data.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.payment_number}</td>
                      <td style={{ fontSize: "0.85rem" }}>{p.vendor_name}</td>
                      <td style={{ fontSize: "0.82rem" }}>{formatDate(p.payment_date)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#dc2626" }}>{formatCurrency(p.amount)}</td>
                      <td style={{ fontSize: "0.8rem" }}>{p.payment_method === "bank_transfer" ? "Transfer" : p.payment_method}</td>
                      <td><span className={`badge badge-${p.status === "posted" ? "active" : "churned"}`}>{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Vendors tab */}
        {activeTab === "vendors" && (
          <div className="content-card" style={{ margin: 0, padding: "2rem", textAlign: "center" }}>
            <Building2 size={36} color="var(--accent)" style={{ margin: "0 auto 0.75rem" }} />
            <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Manajemen Vendor</div>
            <div style={{ fontSize: "0.85rem", color: "var(--grey)", marginBottom: "1rem" }}>
              Kelola data vendor, payment term, dan outstanding balance per vendor.
            </div>
            <Link to="/finance/ap/vendors" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", background: "var(--accent)", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
              Kelola Vendor <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
          <QuickLinkCard icon={<FileText size={20} />} label="AP Bills" desc="Kelola bill vendor" to="/finance/ap-bills" color="#b45309" />
          <QuickLinkCard icon={<CreditCard size={20} />} label="Pembayaran" desc="Catat pembayaran vendor" to="/finance/ap/payments" color="#15803d" />
          <QuickLinkCard icon={<BarChart2 size={20} />} label="Aging Hutang" desc="Umur hutang per vendor" to="/finance/ap/aging" color="#7c3aed" />
          <QuickLinkCard icon={<Building2 size={20} />} label="Vendor" desc="Atur data vendor & term" to="/finance/ap/vendors" color="#1d4ed8" />
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
