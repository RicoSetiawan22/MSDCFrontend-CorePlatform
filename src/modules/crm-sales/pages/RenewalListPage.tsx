import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Search, CalendarClock, Clock3, CalendarDays, RefreshCw, CheckCircle2, Eye } from "lucide-react";
import { useRenewalData } from "../api/useRenewals";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { EmptyState } from "@shared/components/EmptyState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { URGENCY_LABEL } from "../api/renewalUtils";
import type { RenewalRow, RenewalUrgency } from "../types/renewal";

const COLORS = {
  navy: "#0b2748",
  navyText: "#16213d",
  slate: "#64748b",
  orange: "#f5a400",
  border: "#dfe5ec",
  page: "#f4f7fb",
  white: "#ffffff",
};

const URGENCY_STYLE: Record<RenewalUrgency, { background: string; color: string }> = {
  darurat: { background: "#fee2e2", color: "#dc2626" },
  peringatan: { background: "#fef3c7", color: "#b45309" },
  persiapan: { background: "#e0f2fe", color: "#0369a1" },
};

type Filter = "all" | RenewalUrgency | "processing";

function Badge({ label, style }: { label: string; style: { background: string; color: string } }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 999,
        background: style.background,
        color: style.color,
        fontSize: "0.64rem",
        lineHeight: 1.2,
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function KpiCard({ label, value, icon, iconColor, iconBackground }: { label: string; value: number; icon: React.ReactNode; iconColor: string; iconBackground: string }) {
  return (
    <article className="crm-renewal-kpi" tabIndex={0} role="group" aria-label={`${label}: ${value}`}>
      <div className="crm-renewal-kpi__top">
        <span className="crm-renewal-kpi__icon" style={{ color: iconColor, background: iconBackground }} aria-hidden="true">{icon}</span>
        <span className="crm-renewal-kpi__label">{label}</span>
      </div>
      <div className="crm-renewal-kpi__value">{value}</div>
    </article>
  );
}

const RENEWAL_LIST_STYLES = `
.crm-renewal-list-page { min-height:100%; background:#f5f7fa !important; color:#16213d; }
.crm-renewal-list-page .crm-renewal-kpis { display:grid !important; grid-template-columns:repeat(5,minmax(0,1fr)) !important; gap:14px !important; margin:0 0 18px !important; }
.crm-renewal-list-page .crm-renewal-kpi { display:flex; min-width:0; min-height:112px; flex-direction:column; justify-content:space-between; gap:10px; padding:15px 16px !important; border:1px solid #e2e8f0 !important; border-radius:16px !important; background:linear-gradient(180deg,#fff 0%,#fcfdff 100%) !important; box-shadow:0 2px 8px rgba(15,23,42,.045); transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s cubic-bezier(.16,1,.3,1),border-color .2s ease; }
.crm-renewal-list-page .crm-renewal-kpi:hover { transform:translateY(-4px); border-color:#cbd5e1 !important; box-shadow:0 12px 24px rgba(15,23,42,.09); }
.crm-renewal-list-page .crm-renewal-kpi__top { display:flex; align-items:center; gap:10px; min-width:0; }
.crm-renewal-list-page .crm-renewal-kpi__icon { display:inline-flex; width:38px; height:38px; flex:0 0 38px; align-items:center; justify-content:center; border-radius:11px; }
.crm-renewal-list-page .crm-renewal-kpi__label { color:#64748b; font-size:9px; font-weight:800; letter-spacing:.05em; line-height:1.35; text-transform:uppercase; }
.crm-renewal-list-page .crm-renewal-kpi__value { color:#0f2946; font-size:clamp(22px,1.9vw,27px); font-weight:850; letter-spacing:-.04em; line-height:1.05; }
.crm-renewal-list-page section { overflow:hidden; border:1px solid #e2e8f0 !important; border-radius:16px !important; background:#fff !important; box-shadow:0 4px 18px rgba(15,23,42,.045); }
.crm-renewal-list-page table { width:100%; min-width:0; border-collapse:separate !important; border-spacing:0; }
.crm-renewal-list-page thead th { padding:13px 12px !important; background:#f8fafc !important; border-bottom:1px solid #e2e8f0 !important; color:#64748b !important; font-size:10px !important; font-weight:800 !important; }
.crm-renewal-list-page tbody td { padding:12px !important; border-bottom:1px solid #edf1f5 !important; font-size:12px !important; }
.crm-renewal-list-page tbody tr:hover td { background:#f8fafc; }
.crm-renewal-list-page button { border-radius:10px !important; transition:transform .16s ease,box-shadow .16s ease; }
.crm-renewal-list-page button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.crm-renewal-list-page button:focus-visible,.crm-renewal-list-page a:focus-visible { outline:3px solid rgba(247,171,0,.35); outline-offset:2px; }
.crm-renewal-list-page .crm-contract-tabs { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:16px !important; }
.crm-renewal-list-page .crm-contract-tabs > a,.crm-renewal-list-page .crm-contract-tabs > div { min-height:36px; padding:8px 15px !important; border-radius:10px !important; font-size:12px !important; }
/* Perpanjangan: kolom Penjual tidak tampil pada ringkasan, ruang untuk status dan aksi lebih lega. */
.crm-renewal-list-page section { border-radius:19px !important; border-color:#e3ebf3 !important; }
.crm-renewal-list-page .crm-renewal-table-wrap table { table-layout:auto; }
.crm-renewal-list-page .crm-renewal-table-wrap td:nth-child(1) { font-weight:800; }
.crm-renewal-list-page .crm-renewal-table-wrap thead th { white-space:nowrap; }
.crm-renewal-list-page .crm-renewal-table-wrap tbody tr:nth-child(even) td { background:#fbfcff; }
.crm-renewal-list-page .crm-renewal-search { flex:1 1 190px; min-width:160px; }
.crm-renewal-list-page .crm-renewal-search input { width:100% !important; min-height:34px; background:#fcfdff; }
.crm-renewal-list-page .crm-renewal-search input:focus { border-color:#e2af36 !important; box-shadow:0 0 0 3px rgba(247,171,0,.11); }
.crm-renewal-list-page .crm-renewal-table-wrap td:last-child button { background:#fff8e6 !important; border-color:#f7dc98 !important; color:#8c5b00 !important; padding:8px 14px !important; }
.crm-renewal-list-page .crm-renewal-table-wrap td:last-child button:hover { background:#ffedbd !important; }
.crm-renewal-list-page .crm-renewal-table-wrap td:last-child { padding-right:16px !important; padding-left:16px !important; text-align:center; }
.crm-renewal-list-page .crm-renewal-table-wrap td:last-child .crm-renewal-detail-action { display:inline-flex; min-width:86px; min-height:36px; margin:2px 4px; align-items:center; justify-content:center; gap:7px; padding:0 13px !important; border:1px solid #dbe3ec !important; border-radius:10px !important; background:#fff !important; color:#102b4e !important; font-size:11px !important; font-weight:750 !important; white-space:nowrap; }
.crm-renewal-list-page .crm-renewal-table-wrap td:last-child .crm-renewal-detail-action:hover { border-color:#f0a800 !important; background:#fffbeb !important; }
@media (max-width:830px) { .crm-renewal-list-page .crm-renewal-table-wrap table { min-width:730px; } }
@media (max-width:1200px) { .crm-renewal-list-page .crm-renewal-kpis { grid-template-columns:repeat(3,minmax(0,1fr)) !important; } }
@media (max-width:760px) { .crm-renewal-list-page .crm-renewal-kpis { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; } .crm-renewal-list-page > div[style*='padding: 0 2rem'] { padding-left:16px !important; padding-right:16px !important; } }
@media (max-width:480px) { .crm-renewal-list-page .crm-renewal-kpis { grid-template-columns:1fr !important; } }
@media (prefers-reduced-motion:reduce) { .crm-renewal-list-page .crm-renewal-kpi,.crm-renewal-list-page button { transition:none !important; } .crm-renewal-list-page .crm-renewal-kpi:hover { transform:none; } }
`;

export function RenewalListPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useRenewalData();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const rows = useMemo<RenewalRow[]>(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.rows.filter((r) => {
      if (filter === "processing" && !r.renewal) return false;
      if (filter !== "all" && filter !== "processing" && (r.urgency !== filter || r.renewal)) return false;
      if (!q) return true;
      const name = r.contract.customer?.company_name ?? "";
      return name.toLowerCase().includes(q) || r.contract.contract_number.toLowerCase().includes(q);
    });
  }, [data, filter, search]);

  const kpis = data?.kpis;
  const cards = [
    { label: "Akan berakhir (90 hari)", value: kpis?.within90 ?? 0, icon: <CalendarClock size={17} />, iconColor: "#2563eb", iconBackground: "#eff6ff" },
    { label: "60 hari", value: kpis?.within60 ?? 0, icon: <Clock3 size={17} />, iconColor: "#d97706", iconBackground: "#fffbeb" },
    { label: "30 hari", value: kpis?.within30 ?? 0, icon: <CalendarDays size={17} />, iconColor: "#dc2626", iconBackground: "#fef2f2" },
    { label: "Sedang diproses", value: kpis?.inProgress ?? 0, icon: <RefreshCw size={17} />, iconColor: "#7c3aed", iconBackground: "#f5f3ff" },
    { label: "Berhasil diperpanjang", value: kpis?.renewed ?? 0, icon: <CheckCircle2 size={17} />, iconColor: "#059669", iconBackground: "#ecfdf5" },
  ];

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "all", label: "Semua" },
    { key: "darurat", label: "Darurat" },
    { key: "peringatan", label: "Peringatan" },
    { key: "persiapan", label: "Persiapan" },
    { key: "processing", label: "Diproses" },
  ];

  const th = {
    padding: "0.8rem 0.7rem",
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.slate,
    fontSize: "0.62rem",
    lineHeight: 1.25,
    fontWeight: 800,
    textAlign: "left",
    textTransform: "uppercase",
  } as const;
  const td = {
    padding: "0.78rem 0.7rem",
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.navyText,
    fontSize: "0.71rem",
    lineHeight: 1.35,
    verticalAlign: "middle",
  } as const;

  return (
    <div className="crm-renewal-list-page" style={{ minHeight: "100%", background: COLORS.page }}>
      <style>{RENEWAL_LIST_STYLES}</style>
      <PageHeader
        title="Perpanjangan"
        subtitle="Kontrak yang akan berakhir"
        containerClassName="px-7 pt-5 pb-2"
      />

      <div style={{ padding: "0 2rem 3rem" }}>
        {/* Submenu */}
        <div className="crm-contract-tabs"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: "1rem",
          }}
        >
          <Link
            to="/crm-sales/contracts"
            style={{
              padding: "8px 15px",
              borderRadius: 8,
              background: "transparent",
              color: COLORS.slate,
              fontSize: "0.76rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Kontrak
          </Link>

          <Link
            to="/crm-sales/contracts/slas"
            style={{
              padding: "8px 15px",
              borderRadius: 8,
              background: "transparent",
              color: COLORS.slate,
              fontSize: "0.76rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            SLA
          </Link>

          <div
            style={{
              padding: "8px 15px",
              borderRadius: 8,
              background: COLORS.navy,
              color: "#fff",
              fontSize: "0.76rem",
              fontWeight: 700,
            }}
          >
            Perpanjangan
          </div>
        </div>

        {isError && <ErrorState message={extractErrorMessage(error)} />}

        {/* Banner darurat */}
        {!!kpis && kpis.emergency > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: "1rem",
              padding: "0.8rem 1.1rem",
              background: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: 10,
              color: "#7c2d12",
              fontSize: "0.76rem",
            }}
          >
            <AlertTriangle size={16} color="#d99200" />
            <span>
              <strong>{kpis.emergency} kontrak berstatus Darurat</strong> — sisa waktu di bawah 7 hari. Segera hubungi pelanggan untuk proses pembaruan.
            </span>
          </div>
        )}

        {/* KPI */}
        <div className="crm-renewal-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "0.9rem", marginBottom: "1rem" }}>
          {cards.map((c) => (
            <KpiCard key={c.label} label={c.label} value={c.value} icon={c.icon} iconColor={c.iconColor} iconBackground={c.iconBackground} />
          ))}
        </div>

        {/* Daftar */}
        <section style={{ overflow: "hidden", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              padding: "0.95rem 1.2rem",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div style={{ color: COLORS.navyText, fontSize: "0.82rem", fontWeight: 800 }}>Daftar Kontrak Akan Berakhir</div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {filters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  style={{
                    padding: "5px 11px",
                    borderRadius: 999,
                    border: `1px solid ${filter === f.key ? COLORS.navy : COLORS.border}`,
                    background: filter === f.key ? COLORS.navy : "#fff",
                    color: filter === f.key ? "#fff" : COLORS.slate,
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
              <div className="crm-renewal-search" style={{ position: "relative" }}>
                <Search size={13} color={COLORS.slate} style={{ position: "absolute", left: 9, top: 8 }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari pelanggan / kontrak"
                  style={{
                    padding: "6px 10px 6px 28px",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 8,
                    fontSize: "0.7rem",
                    width: 190,
                    outline: "none",
                  }}
                />
              </div>
            </div>
          </div>

          {isLoading && (
            <div style={{ padding: "1rem" }}>
              <LoadingState />
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <div style={{ padding: "1rem" }}>
              <EmptyState title="Tidak Ada Kontrak" subtitle="Belum ada kontrak aktif yang akan berakhir dalam 90 hari ke depan." />
            </div>
          )}

          {!isLoading && rows.length > 0 && (
            <div className="crm-renewal-table-wrap" style={{ overflowX: "auto", padding: "0 1rem 0.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 0 }}>
                <thead>
                  <tr>
                    {["Pelanggan", "Kontrak", "Tanggal Berakhir", "Sisa Hari", "Nilai Kontrak", "Status", "Aksi"].map((h) => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.contract.id}>
                      <td style={{ ...td, fontWeight: 800 }}>{r.contract.customer?.company_name ?? "—"}</td>
                      <td style={{ ...td, color: COLORS.slate }}>{r.contract.contract_number}</td>
                      <td style={{ ...td, color: COLORS.slate, whiteSpace: "nowrap" }}>{formatDate(r.contract.end_date)}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>{r.daysLeft < 0 ? `Lewat ${Math.abs(r.daysLeft)} hari` : `${r.daysLeft} hari`}</td>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>{formatCurrency(Number(r.contract.monthly_value ?? 0))}</td>
                      <td style={td}>
                        {r.renewal ? (
                          <Badge label="Diproses" style={{ background: "#ede9fe", color: "#6d28d9" }} />
                        ) : (
                          <Badge label={URGENCY_LABEL[r.urgency]} style={URGENCY_STYLE[r.urgency]} />
                        )}
                      </td>
                      <td style={td}>
                        <button
                          type="button"
                          className="crm-renewal-detail-action"
                          onClick={() => navigate(`/crm-sales/contracts/renewals/${r.contract.id}`)}
                          title="Lihat detail perpanjangan"
                        >
                          <Eye size={14} aria-hidden="true" /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}