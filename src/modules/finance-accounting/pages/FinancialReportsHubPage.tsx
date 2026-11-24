import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Scale, BookOpen, FileBarChart, TrendingUp, Wallet,
  Clock, ClockAlert, Target, Building2, BarChart3,
  Receipt, Server, Book, FileText, ClipboardList,
  DollarSign, User, Calendar, Search, LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";

interface ReportLink {
  icon: typeof Scale;
  title: string;
  description: string;
  path: string;
  isNew?: boolean;
  category: string;
}

const REPORTS: ReportLink[] = [
  // 📊 Laporan Utama
  { icon: Scale,        title: "Trial Balance",       description: "Neraca saldo seluruh akun, dihitung langsung dari GL.",         path: "/finance/gl/trial-balance",           category: "Laporan Utama" },
  { icon: BookOpen,      title: "General Ledger",      description: "Buku besar — semua jurnal, manual & otomatis.",               path: "/finance/gl/journals",                category: "Laporan Utama" },
  { icon: FileBarChart,  title: "Balance Sheet",       description: "Neraca — Aset = Kewajiban + Ekuitas per tanggal.",        path: "/finance/reports/balance-sheet",     category: "Laporan Utama", isNew: true },
  { icon: TrendingUp,    title: "Profit & Loss",       description: "Laba rugi — pendapatan dikurangi beban per periode.",       path: "/finance/reports/profit-loss",         category: "Laporan Utama", isNew: true },
  // 💰 Arus Kas
  { icon: Wallet,        title: "Cash Flow",           description: "Arus kas masuk & keluar per akun kas/bank.",                  path: "/finance/cb/cash-flow",               category: "Arus Kas" },
  { icon: Book,          title: "Cash Book",           description: "Buku kas — mutasi kronologis per akun kas/bank.",           path: "/finance/reports/cash-book",          category: "Arus Kas", isNew: true },
  // 👥 Piutang & Hutang
  { icon: Clock,         title: "Aging AR",            description: "Piutang dikelompokkan per umur keterlambatan.",              path: "/finance/ar/aging",                   category: "Piutang & Hutang" },
  { icon: FileText,      title: "Customer Ledger",     description: "Riwayat transaksi per pelanggan AR.",                        path: "/finance/reports/customer-ledger",     category: "Piutang & Hutang", isNew: true },
  { icon: ClockAlert,    title: "Aging AP",            description: "Hutang dikelompokkan per umur keterlambatan bayar.",         path: "/finance/ap/aging",                   category: "Piutang & Hutang" },
  { icon: User,          title: "Vendor Ledger",       description: "Riwayat transaksi per vendor AP.",                          path: "/finance/reports/vendor-ledger",       category: "Piutang & Hutang", isNew: true },
  // 📈 Analisis
  { icon: Target,        title: "Budget vs Actual",    description: "Bandingkan anggaran dengan realisasi per departemen.",       path: "/finance/budgets/vs-actual",          category: "Analisis" },
  { icon: Building2,     title: "Cost Center Report",  description: "Biaya per cost center — pilih cost center dulu.",         path: "/finance/cost-centers",                category: "Analisis" },
  { icon: BarChart3,     title: "Profit Center Report", description: "Laba per lini layanan — perbandingan sekaligus.",          path: "/finance/profit-centers/comparison",   category: "Analisis" },
  // 🏢 Aset Tetap
  { icon: Server,        title: "Fixed Asset Register", description: "Master daftar seluruh aset tetap & nilai bukunya.",         path: "/finance/reports/fixed-assets/register", category: "Aset Tetap", isNew: true },
  { icon: Calendar,      title: "Depreciation Schedule",description: "Jadwal depresiasi seluruh aset tetap.",                   path: "/finance/reports/depreciation-schedule", category: "Aset Tetap", isNew: true },
  // 📋 Lainnya
  { icon: Receipt,       title: "Laporan Pajak",       description: "Ringkasan PPN (Keluaran vs Masukan) dan PPh.",           path: "/finance/tax/reports",                 category: "Lainnya" },
  { icon: DollarSign,    title: "Executive Summary",    description: "One-page ringkasan keuangan untuk manajemen puncak.",     path: "/finance/reports/executive-summary",   category: "Lainnya", isNew: true },
  { icon: ClipboardList,  title: "Audit Log",          description: "Jejak aktivitas modul Finance — siapa mengubah apa.",      path: "/finance/reports/audit-log",          category: "Lainnya", isNew: true },
];

const CATEGORY_META: Record<string, { icon: typeof LayoutDashboard; color: string; bg: string; border: string }> = {
  "Laporan Utama":     { icon: FileBarChart,  color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  "Arus Kas":          { icon: Wallet,         color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
  "Piutang & Hutang":  { icon: Clock,          color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  "Analisis":          { icon: BarChart3,       color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  "Aset Tetap":        { icon: Server,          color: "#374151", bg: "#f9fafb", border: "#d1d5db" },
  "Lainnya":           { icon: Receipt,          color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
};

const CATEGORY_ORDER = ["Laporan Utama", "Arus Kas", "Piutang & Hutang", "Analisis", "Aset Tetap", "Lainnya"];

export function FinancialReportsHubPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = REPORTS.filter((r) => {
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !activeCategory || r.category === activeCategory;
    return matchSearch && matchCategory;
  });

  const grouped = CATEGORY_ORDER.reduce<Record<string, ReportLink[]>>((acc, cat) => {
    const items = filtered.filter((r) => r.category === cat);
    if (items.length > 0) acc[cat] = items;
    return acc;
  }, {});

  const newCount = REPORTS.filter((r) => r.isNew).length;

  return (
    <div>
      <PageHeader
        title="Financial Reporting"
        subtitle="Pintu masuk ke seluruh laporan keuangan — pilih kategori atau cari laporan."
      />

      {/* ── Stats bar ── */}
      <div style={{ padding: "0 2rem 1rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {[
          { label: "Total Laporan", value: REPORTS.length, color: "#1d4ed8" },
          { label: "Baru Dirancang", value: newCount, color: "#16a34a" },
          { label: "Kategori", value: CATEGORY_ORDER.length, color: "#7c3aed" },
        ].map((s) => (
          <div key={s.label} style={{
            background: "white", border: "1px solid var(--border)", borderRadius: 10,
            padding: "0.6rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter ── */}
      <div style={{ padding: "0 2rem 1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--grey)" }} />
          <input
            className="input"
            style={{ paddingLeft: 36, width: "100%" }}
            placeholder="Cari laporan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Category pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveCategory(null)}
            style={{
              padding: "0.45rem 0.875rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
              border: `1.5px solid ${!activeCategory ? "var(--accent)" : "var(--border)"}`,
              background: !activeCategory ? "var(--accent)" : "white",
              color: !activeCategory ? "white" : "var(--grey-dark)",
              cursor: "pointer",
            }}
          >
            Semua
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const meta = CATEGORY_META[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? null : cat)}
                style={{
                  padding: "0.45rem 0.875rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 600,
                  border: `1.5px solid ${isActive ? meta.border : "var(--border)"}`,
                  background: isActive ? meta.bg : "white",
                  color: isActive ? meta.color : "var(--grey-dark)",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.3rem",
                }}
              >
                <meta.icon size={11} />
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Report groups ── */}
      <div style={{ padding: "0 2rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {Object.entries(grouped).length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--grey)" }}>
            <Search size={32} style={{ margin: "0 auto 0.75rem", opacity: 0.4 }} />
            <div style={{ fontWeight: 600 }}>Tidak ada laporan ditemukan</div>
            <div style={{ fontSize: "0.82rem", marginTop: "0.3rem" }}>Coba ubah kata kunci pencarian.</div>
          </div>
        )}

        {Object.entries(grouped).map(([category, items]) => {
          const meta = CATEGORY_META[category];
          return (
            <div key={category}>
              {/* Category header */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.6rem",
                marginBottom: "0.75rem",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: meta.bg, border: `1.5px solid ${meta.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <meta.icon size={15} color={meta.color} />
                </div>
                <span style={{ fontWeight: 800, fontSize: "0.92rem", color: meta.color }}>{category}</span>
                <span style={{ fontSize: "0.72rem", color: "var(--grey)", marginLeft: "0.25rem" }}>
                  ({items.length} laporan)
                </span>
                <div style={{ flex: 1, height: 1, background: meta.border, marginLeft: "0.5rem" }} />
              </div>

              {/* Report cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem" }}>
                {items.map((report) => {
                  const Icon = report.icon;
                  return (
                    <Link
                      key={report.path}
                      to={report.path}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        className="card"
                        style={{
                          padding: "1.1rem 1.25rem",
                          display: "flex",
                          gap: "0.875rem",
                          alignItems: "flex-start",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          position: "relative",
                          border: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = meta.border;
                          (e.currentTarget as HTMLDivElement).style.background = meta.bg;
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 16px rgba(0,0,0,0.08)`;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                          (e.currentTarget as HTMLDivElement).style.background = "white";
                          (e.currentTarget as HTMLDivElement).style.transform = "none";
                          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                        }}
                      >
                        {/* Icon */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                          background: meta.bg, border: `1.5px solid ${meta.border}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Icon size={18} color={meta.color} />
                        </div>
                        {/* Text */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#1a1a1a" }}>{report.title}</div>
                            {report.isNew && (
                              <span style={{
                                background: "#16a34a", color: "white", padding: "1px 7px",
                                borderRadius: 12, fontSize: "0.62rem", fontWeight: 700, flexShrink: 0,
                              }}>
                                BARU
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginTop: "0.2rem", lineHeight: 1.4 }}>
                            {report.description}
                          </div>
                        </div>
                        {/* Arrow */}
                        <ArrowRight size={14} color={meta.color} style={{ flexShrink: 0, marginTop: 4, opacity: 0.6 }} />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
