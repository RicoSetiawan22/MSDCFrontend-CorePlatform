import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Landmark, ArrowDownCircle, ArrowUpCircle, ArrowLeftRight,
  Plus, ArrowRight, ChevronRight, TrendingUp
} from "lucide-react";
import { useCbAccountList } from "../api/useCbAccounts";
import { useCbMutationList } from "../api/useCbMutations";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { useFinanceDashboard } from "../api/useFinanceDashboard";
import type { CashMetrics } from "../api/financeDashboardApi";

export function CbHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"accounts" | "mutations" | "cashflow">("accounts");

  const { data: accounts, isLoading: loadingAccounts } = useCbAccountList({});
  const { data: mutations, isLoading: loadingMutations } = useCbMutationList({ per_page: 5 });
  const { data: dashboard } = useFinanceDashboard();

  const cashMetrics = dashboard?.cash_metrics;
  const totalBalance = cashMetrics?.total_cash_balance ?? 0;

  const totalDeposits = (mutations?.data ?? [])
    .filter((m) => m.mutation_type === "deposit")
    .reduce((s, m) => s + Number(m.amount), 0);

  const totalWithdrawals = (mutations?.data ?? [])
    .filter((m) => m.mutation_type === "withdrawal")
    .reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div>
      <PageHeader
        title="Kas & Bank"
        subtitle="Finance & Accounting › Cash & Bank — Rekening bank, arus kas, dan pencatatan mutasi"
      >
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button variant="secondary" onClick={() => navigate("/finance/cb/accounts")}>
            <Landmark size={15} /> Akun
          </Button>
          <Button onClick={() => navigate("/finance/cb/mutations")}>
            <Plus size={15} /> Catat Mutasi
          </Button>
        </div>
      </PageHeader>

      {/* KPI Strip */}
      <div className="px-7 py-5">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
          <KpiCard icon={<Landmark size={18} />} label="Total Saldo Kas & Bank" value={formatCurrency(totalBalance)} color="#1d4ed8" bg="#dbeafe" sub="Saldo GL bersih" />
          <KpiCard icon={<ArrowDownCircle size={18} />} label="Total Setoran" value={formatCurrency(totalDeposits)} color="#15803d" bg="#d9f2e6" sub="semua deposit" />
          <KpiCard icon={<ArrowUpCircle size={18} />} label="Total Penarikan" value={formatCurrency(totalWithdrawals)} color="#dc2626" bg="#fee2e2" sub="semua withdrawal" />
          <KpiCard icon={<ArrowLeftRight size={18} />} label="Akun Kas & Bank" value={String(accounts?.length ?? 0)} color="#7c3aed" bg="#ede9fe" sub="terdaftar" />
        </div>

        {/* GL Cash breakdown */}
        {cashMetrics && cashMetrics.accounts.length > 0 && (
          <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--grey-dark)", textTransform: "uppercase", letterSpacing: "0.04em", alignSelf: "center", flexShrink: 0 }}>
              Saldo GL
            </div>
            {cashMetrics.accounts.map((acc: CashMetrics["accounts"][number]) => (
              <div key={acc.account_id} style={{ flex: 1, minWidth: 160, padding: "0.5rem 0.75rem", background: "var(--bg-subtle)", borderRadius: 8 }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: 700 }}>{acc.account_code}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--grey)" }}>{acc.account_name}</div>
                <div style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 800, color: "var(--good)", marginTop: "0.2rem" }}>
                  {formatCurrency(acc.net_balance)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border)", marginBottom: "1rem" }}>
          {([
            { key: "accounts" as const, label: "Akun Kas & Bank", count: accounts?.length },
            { key: "mutations" as const, label: "Mutasi", count: mutations?.total },
            { key: "cashflow" as const, label: "Arus Kas", count: undefined },
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

        {/* Accounts tab */}
        {activeTab === "accounts" && (
          <div className="content-card" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--grey)" }}>Akun kas & bank terdaftar</span>
              <Link to="/finance/cb/accounts" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingAccounts && <LoadingState label="Memuat..." />}
            {accounts && accounts.length > 0 && (
              <table className="table">
                <thead>
                  <tr><th>Kode Akun</th><th>Nama</th><th>Bank</th><th>No. Rekening</th><th>Mata Uang</th><th style={{ textAlign: "right" }}>Saldo GL</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {accounts.map((acc) => (
                    <tr key={acc.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>{acc.account.account_code}</td>
                      <td style={{ fontSize: "0.85rem", fontWeight: 600 }}>{acc.account.account_name}</td>
                      <td style={{ fontSize: "0.82rem" }}>{acc.bank_name ?? "—"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{acc.bank_account_number ?? "—"}</td>
                      <td style={{ fontSize: "0.82rem" }}>{acc.currency}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--good)" }}>
                        {formatCurrency(Number(acc.current_balance))}
                      </td>
                      <td>
                        <span className={`badge badge-${acc.is_active ? "active" : "churned"}`}>
                          {acc.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td>
                        <Link to={`/finance/cb/accounts/${acc.id}`} style={{ color: "var(--accent)", fontSize: "0.8rem" }}>
                          Detail →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {(!accounts || accounts.length === 0) && (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--grey)" }}>
                Belum ada akun kas/bank. <Link to="/finance/cb/accounts" style={{ color: "var(--accent)" }}>Daftarkan sekarang →</Link>
              </div>
            )}
          </div>
        )}

        {/* Mutations tab */}
        {activeTab === "mutations" && (
          <div className="content-card" style={{ margin: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--grey)" }}>5 mutasi terbaru</span>
              <Link to="/finance/cb/mutations" style={{ fontSize: "0.8rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                Lihat semua <ArrowRight size={13} />
              </Link>
            </div>
            {loadingMutations && <LoadingState label="Memuat..." />}
            {mutations && (
              <table className="table">
                <thead>
                  <tr><th>No. Mutasi</th><th>Jenis</th><th>Dari</th><th>Ke</th><th>Tanggal</th><th style={{ textAlign: "right" }}>Jumlah</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {mutations.data.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{m.mutation_number}</td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: m.mutation_type === "deposit" ? "#15803d" : m.mutation_type === "withdrawal" ? "#dc2626" : "#1d4ed8" }}>
                          {m.mutation_type === "deposit" ? "💰 Setoran" : m.mutation_type === "withdrawal" ? "💸 Penarikan" : "🔄 Transfer"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{m.from_account ? m.from_account.account_code : "—"}</td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{m.to_account ? m.to_account.account_code : "—"}</td>
                      <td style={{ fontSize: "0.82rem" }}>{formatDate(m.mutation_date)}</td>
                      <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatCurrency(m.amount)}</td>
                      <td>
                        <span className={`badge badge-${m.status === "posted" ? "active" : "churned"}`}>
                          {m.status === "posted" ? "Posted" : "Void"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Cashflow tab */}
        {activeTab === "cashflow" && (
          <div className="content-card" style={{ margin: 0, padding: "3rem", textAlign: "center" }}>
            <TrendingUp size={40} color="var(--accent)" style={{ margin: "0 auto 1rem" }} />
            <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Laporan Arus Kas</div>
            <div style={{ fontSize: "0.85rem", color: "var(--grey)", marginBottom: "1.25rem" }}>
              Arus kas masuk, keluar, dan saldo akhir periode berjalan.
            </div>
            <Link to="/finance/cb/cash-flow" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.7rem 1.5rem", background: "var(--accent)", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 600, fontSize: "0.875rem" }}>
              Buka Laporan Arus Kas <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
          <QuickLinkCard icon={<Landmark size={20} />} label="Akun Kas & Bank" desc="Kelola rekening bank" to="/finance/cb/accounts" color="#1d4ed8" />
          <QuickLinkCard icon={<ArrowDownCircle size={20} />} label="Mutasi" desc="Setoran, penarikan, transfer" to="/finance/cb/mutations" color="#15803d" />
          <QuickLinkCard icon={<TrendingUp size={20} />} label="Arus Kas" desc="Laporan cash flow" to="/finance/cb/cash-flow" color="#7c3aed" />
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
