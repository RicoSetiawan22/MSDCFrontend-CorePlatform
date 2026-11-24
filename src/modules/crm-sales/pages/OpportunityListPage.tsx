import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLead } from "../api/useLeads";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Target, ClipboardList, FileText, Handshake, Trophy, Eye, Filter } from "lucide-react";
import { useOpportunityList } from "../api/useOpportunities";
import { opportunityApi } from "../api/opportunityApi";
import { CrmPagination, CRM_DEFAULT_PER_PAGE } from "../components/CrmPagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";
import { OpportunityFormModal } from "./OpportunityFormModal";
import { OpportunityDetailModal } from "./OpportunityDetailModal";
import { opportunitySalesPic, type Opportunity, type OpportunityStage } from "../types/opportunity";
import type { PipelineStageItem } from "../api/useOpportunities";
const COLORS = {
    navy: "#16213d", navyDark: "#0b1c33", slate: "#64748b", slateLight: "#94a3b8",
    orange: "#f2a602", orangeDark: "#d99200", green: "#16a34a", red: "#dc2626",
    border: "#e5e7eb", track: "#eef2f6", page: "#f5f7fa", white: "#ffffff", soft: "#f8fafc",
};
const OPPORTUNITY_LIST_STYLES = `
.crm-opportunity-ui {
  --opp-bg: #f5f7fb;
  --opp-surface: #ffffff;
  --opp-ink: #102b4e;
  --opp-text: #1e293b;
  --opp-muted: #64748b;
  --opp-border: #e2e8f0;
  --opp-soft: #f8fafc;
  --opp-accent: #f0a800;
  min-height: 100%;
  padding-bottom: 28px;
  background: var(--opp-bg) !important;
  color: var(--opp-text);
}
.crm-opportunity-ui *, .crm-opportunity-ui *::before, .crm-opportunity-ui *::after { box-sizing: border-box; }
.crm-opportunity-ui button, .crm-opportunity-ui input, .crm-opportunity-ui select { font-family: inherit; }
.crm-opportunity-content { display: flex; flex-direction: column; gap: 16px; margin: 0 clamp(16px, 2.2vw, 32px) 28px !important; padding: 12px 0 0 !important; }
.crm-opportunity-pipeline { display: grid !important; grid-template-columns: repeat(5, minmax(0, 1fr)) !important; gap: 13px !important; margin: 0 !important; }
.crm-opportunity-stage-card {
  display: flex; min-width: 0; min-height: 116px; flex-direction: column; justify-content: space-between; gap: 13px;
  padding: 15px 16px !important; border: 1px solid rgba(226,232,240,.96) !important; border-radius: 16px !important;
  background: linear-gradient(180deg,#fff 0%,#fcfdff 100%) !important; box-shadow: 0 2px 8px rgba(15,39,71,.045);
  outline: none; transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .2s ease;
}
.crm-opportunity-stage-card:hover { transform: translateY(-4px); border-color: #cbd5e1 !important; box-shadow: 0 12px 26px rgba(15,39,71,.09); }
.crm-opportunity-stage-card:focus-visible { transform: translateY(-2px); outline: 3px solid rgba(240,168,0,.36); outline-offset: 3px; box-shadow: 0 8px 20px rgba(15,39,71,.09); }
.crm-opportunity-stage-top { display: flex; min-width: 0; align-items: center; gap: 11px; }
.crm-opportunity-stage-icon { display: inline-flex; width: 40px; height: 40px; flex: 0 0 40px; align-items: center; justify-content: center; border-radius: 12px; transition: transform .22s cubic-bezier(.16,1,.3,1); }
.crm-opportunity-stage-card:hover .crm-opportunity-stage-icon { transform: scale(1.06) rotate(-3deg); }
.crm-opportunity-stage-copy { min-width: 0; }
.crm-opportunity-stage-label { display: block; overflow: hidden; color: #64748b; font-size: 10px; font-weight: 850; letter-spacing: .065em; line-height: 1.4; text-overflow: ellipsis; text-transform: uppercase; }
.crm-opportunity-stage-count { display: block; margin-top: 4px; color: #102b4e; font-size: 24px; font-weight: 850; letter-spacing: -.045em; line-height: 1; font-variant-numeric: tabular-nums; }
.crm-opportunity-stage-value { color: #64748b; font-size: 11px; font-weight: 650; line-height: 1.4; font-variant-numeric: tabular-nums; }
.crm-opportunity-list-card { overflow: hidden; border: 1px solid #e2e8f0 !important; border-radius: 16px !important; background: #fff !important; box-shadow: 0 4px 20px -8px rgba(15,39,71,.09); }
.crm-opportunity-list-heading { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 17px 21px !important; border-bottom: 1px solid #edf1f5 !important; background: #fff; }
.crm-opportunity-list-heading__title { margin: 0; color: #102b4e; font-size: 14px; font-weight: 850; letter-spacing: -.015em; }
.crm-opportunity-list-heading__subtitle { margin: 4px 0 0; color: #94a3b8; font-size: 11px; }
.crm-opportunity-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px !important; padding: 14px 20px !important; border-bottom: 1px solid #edf1f5; background: #f8fafc; }
.crm-opportunity-search { display: flex; min-width: 220px; min-height: 42px; flex: 1 1 340px; align-items: center; gap: 9px; padding: 9px 13px; border: 1px solid #dbe3ec !important; border-radius: 11px !important; background: #fff !important; color: #94a3b8; transition: border-color .18s ease, box-shadow .18s ease; }
.crm-opportunity-search:focus-within { border-color: #e4a008 !important; box-shadow: 0 0 0 4px rgba(240,168,0,.12); }
.crm-opportunity-search input { width: 100%; min-width: 0; height: 100%; padding: 0 !important; border: 0 !important; outline: 0 !important; background: transparent !important; color: #1e293b !important; font-size: 12px !important; font-weight: 550; }
.crm-opportunity-search input::placeholder { color: #94a3b8; }
.crm-opportunity-filter-wrap { position: relative; display: flex; min-width: 170px; align-items: center; }
.crm-opportunity-filter-wrap > svg { position: absolute; left: 12px; z-index: 1; color: #94a3b8; pointer-events: none; }
.crm-opportunity-filter { width: 100%; min-height: 42px; padding: 0 30px 0 35px !important; border: 1px solid #dbe3ec !important; border-radius: 10px !important; outline: none !important; background: #fff !important; color: #334155 !important; font-size: 12px !important; font-weight: 650; cursor: pointer; transition: border-color .18s ease, box-shadow .18s ease; }
.crm-opportunity-filter:focus { border-color: #e4a008 !important; box-shadow: 0 0 0 3px rgba(240,168,0,.12); }
.crm-opportunity-primary-button { display: inline-flex; min-height: 42px; align-items: center; justify-content: center; gap: 8px; padding: 0 15px !important; border: 1px solid #e6a000 !important; border-radius: 11px !important; background: #f0a800 !important; color: #fff !important; font-size: 12px !important; font-weight: 800 !important; cursor: pointer; white-space: nowrap; box-shadow: 0 3px 8px rgba(240,168,0,.16); transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }
.crm-opportunity-primary-button:hover { transform: translateY(-2px); background: #df9900 !important; box-shadow: 0 7px 15px rgba(240,168,0,.22); }
.crm-opportunity-primary-button:focus-visible, .crm-opportunity-detail-button:focus-visible, .crm-opportunity-ui button:focus-visible { outline: 3px solid rgba(240,168,0,.3); outline-offset: 2px; }
.crm-opportunity-table-wrap { width: 100%; overflow-x: auto; }
.crm-opportunity-table { width: 100%; min-width: 760px; border-collapse: separate !important; border-spacing: 0; table-layout: fixed; }
.crm-opportunity-table thead tr { background: #f8fafc !important; }
.crm-opportunity-table thead th { padding: 13px 12px !important; border-top: 1px solid #edf1f5 !important; border-bottom: 1px solid #e8edf3 !important; color: #64748b !important; font-size: 10px !important; font-weight: 850 !important; letter-spacing: .055em; text-transform: uppercase; }
.crm-opportunity-table tbody tr { transition: background .16s ease; }
.crm-opportunity-table tbody tr:hover { background: #f8fbff !important; }
.crm-opportunity-table tbody td { padding: 14px 12px !important; border-bottom: 1px solid #edf1f5 !important; color: #334155 !important; font-size: 12px !important; }
.crm-opportunity-table tbody tr:last-child td { border-bottom: 0 !important; }
.crm-opportunity-table tbody td:last-child { padding-right: 10px !important; padding-left: 10px !important; }
.crm-opportunity-table tbody td:first-child { color: #64748b !important; font-size: 11px !important; font-weight: 750 !important; }
.crm-opportunity-table tbody td:nth-child(2) { color: #102b4e !important; font-weight: 800 !important; }
.crm-opportunity-detail-button { display: inline-flex; min-width: 86px; min-height: 36px; margin:2px 4px; align-items: center; justify-content: center; gap: 7px; padding: 0 14px !important; border: 1px solid #dbe3ec !important; border-radius: 10px !important; background: #fff !important; color: #102b4e !important; font-size: 11px !important; font-weight: 750 !important; white-space: nowrap; cursor: pointer; transition: background .18s ease, border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
.crm-opportunity-detail-button:hover { transform: translateY(-1px); border-color: #f0a800 !important; background: #fffbeb !important; box-shadow: 0 4px 11px rgba(15,39,71,.07); }
.crm-opportunity-ui .pagination, .crm-opportunity-ui nav[aria-label*="pagination"] { color: #64748b; }
.crm-opportunity-ui .input { border-radius: 10px; }
@media (max-width: 1180px) { .crm-opportunity-pipeline { grid-template-columns: repeat(3,minmax(0,1fr)) !important; } }
@media (max-width: 760px) {
  .crm-opportunity-content { margin-left: 16px !important; margin-right: 16px !important; }
  .crm-opportunity-pipeline { grid-template-columns: repeat(2,minmax(0,1fr)) !important; gap: 10px !important; }
  .crm-opportunity-stage-card { min-height: 108px; padding: 13px !important; }
  .crm-opportunity-list-heading, .crm-opportunity-toolbar { padding-left: 15px !important; padding-right: 15px !important; }
  .crm-opportunity-search { flex-basis: 100%; }
  .crm-opportunity-filter-wrap { flex: 1 1 150px; }
}
@media (max-width: 480px) {
  .crm-opportunity-pipeline { grid-template-columns: 1fr !important; }
  .crm-opportunity-stage-card { min-height: 96px; }
  .crm-opportunity-primary-button { flex: 1 1 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .crm-opportunity-ui *, .crm-opportunity-ui *::before, .crm-opportunity-ui *::after { scroll-behavior: auto !important; transition: none !important; animation-duration: .01ms !important; }
  .crm-opportunity-stage-card:hover, .crm-opportunity-detail-button:hover, .crm-opportunity-primary-button:hover { transform: none; }
}
`;

const STAGE_LABELS: Record<OpportunityStage, string> = {
    qualification: "Kualifikasi", needs_analysis: "Analisis Kebutuhan", proposal: "Proposal",
    negotiation: "Negosiasi", closed_won: "Menang", closed_lost: "Kalah",
};
const STAGE_ORDER: OpportunityStage[] = [
    "qualification", "needs_analysis", "proposal", "negotiation", "closed_won", "closed_lost",
];
const STAGE_META = {
    qualification: { icon: <Target size={19} strokeWidth={2.1} />, color: "#2563eb", background: "#eff6ff" },
    needs_analysis: { icon: <ClipboardList size={19} strokeWidth={2.1} />, color: "#7c3aed", background: "#f5f3ff" },
    proposal: { icon: <FileText size={19} strokeWidth={2.1} />, color: "#d97706", background: "#fffbeb" },
    negotiation: { icon: <Handshake size={19} strokeWidth={2.1} />, color: "#0891b2", background: "#ecfeff" },
    closed_won: { icon: <Trophy size={19} strokeWidth={2.1} />, color: "#16a34a", background: "#f0fdf4" },
    closed_lost: { icon: <Target size={19} strokeWidth={2.1} />, color: "#dc2626", background: "#fef2f2" },
};
const TABLE_COLUMNS = [
    { label: "No. Opportunity", width: "17%", align: "left" as const },
    { label: "Nama Opportunity", width: "22%", align: "left" as const },
    { label: "PIC", width: "19%", align: "left" as const },
    { label: "Estimasi Nilai", width: "16%", align: "right" as const },
    { label: "Stage", width: "12%", align: "center" as const },
    { label: "Aksi", width: "14%", align: "center" as const },
];
export function OpportunityListPage() {
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(CRM_DEFAULT_PER_PAGE);
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState<OpportunityStage | "">("");
    const [showForm, setShowForm] = useState(false);
    
    const [viewOppId, setViewOppId] = useState<number | null>(null);

    // Shortcut dari Detail Lead ke Form Opportunity
    const [searchParams, setSearchParams] = useSearchParams();

    const createFromLead = searchParams.get("create") === "1";
    const requestedLeadId = Number(searchParams.get("lead_id"));

    const shortcutLeadId =
        createFromLead &&
        Number.isSafeInteger(requestedLeadId) &&
        requestedLeadId > 0
            ? requestedLeadId
            : undefined;

    const {
        data: shortcutLead,
        isLoading: leadLoading,
        isError: leadError,
    } = useLead(shortcutLeadId);
const { data, isLoading } = useOpportunityList({
  page,
  per_page: perPage,
  stage: stageFilter || undefined,
});

const searchTerm = search.trim().toLowerCase();
const isSearching = searchTerm.length > 0;

const {
  data: searchRows,
  isLoading: isSearchLoading,
  isError: isSearchError,
} = useQuery({
  queryKey: ["opportunities", "list", "frontend-search-all"],
  enabled: isSearching,
  queryFn: async (): Promise<Opportunity[]> => {
    const results: Opportunity[] = [];
    let currentPage = 1;

    while (true) {
      const response = await opportunityApi.list({
        page: currentPage,
        per_page: 100,
      });

      const result = response.data;
      const chunk = result.data ?? [];

      results.push(...chunk);

      if (
        currentPage >= (Number(result.last_page) || 1) ||
        chunk.length === 0
      ) {
        break;
      }

      currentPage += 1;
    }

    return results;
  },
  staleTime: 30_000,
});

const matchedRows = isSearching
  ? (searchRows ?? []).filter((opp) => {
      const values = [
        opp.opportunity_number,
        opp.name,
        opportunitySalesPic(opp),
      ];

      const matchesText = values.some((value) =>
        String(value ?? "").toLowerCase().includes(searchTerm)
      );

      return matchesText && (!stageFilter || opp.stage === stageFilter);
    })
  : [];

const listTotal = isSearching ? matchedRows.length : (data?.total ?? 0);
const listLastPage = isSearching
  ? Math.max(1, Math.ceil(listTotal / perPage))
  : (data?.last_page ?? 1);
const listCurrentPage = isSearching
  ? Math.min(page, listLastPage)
  : (data?.current_page ?? page);
const visibleRows = isSearching
  ? matchedRows.slice((listCurrentPage - 1) * perPage, listCurrentPage * perPage)
  : (data?.data ?? []);

const listLoading = isSearching ? isSearchLoading : isLoading;
    // Gunakan data Opportunity yang sama dengan daftar tabel, bukan endpoint
    // pipeline-summary yang dapat memiliki cakupan stage/refresh berbeda.
    // Semua halaman diambil agar angka tetap akurat jika data >20 baris.
    // Query ini otomatis di-invalidate oleh useCreateOpportunity setelah tersimpan.
    const { data: pipelineData, isError: pipelineError } = useQuery({
        queryKey: ["opportunities", "list", "stage-summary-all"],
        queryFn: async (): Promise<PipelineStageItem[]> => {
            const allOpportunities: Opportunity[] = [];
            let currentPage = 1;
            while (true) {
                const response = await opportunityApi.list({ page: currentPage, per_page: 100 });
                const result = response.data;
                const rows = result.data ?? [];
                allOpportunities.push(...rows);
                const lastPage = Number(result.last_page) || 1;
                if (currentPage >= lastPage || rows.length === 0) break;
                currentPage += 1;
            }

            return STAGE_ORDER.map((stage) => {
                const matches = allOpportunities.filter((opp) => opp.stage === stage);
                return {
                    stage,
                    opportunity_count: matches.length,
                    total_value: matches.reduce((sum, opp) => sum + (Number(opp.estimated_value) || 0), 0),
                    weighted_value: matches.reduce((sum, opp) =>
                        sum + (Number(opp.estimated_value) || 0) * (Number(opp.probability_pct) || 0) / 100, 0),
                };
            });
        },
        staleTime: 30_000,
    });
    const pipeline = pipelineData ?? [];
    
    if (showForm || createFromLead) {
        if (createFromLead && !shortcutLead) {
            return (
                <div style={{ padding: "2rem", color: COLORS.navy }}>
                    {leadLoading
                        ? "Memuat data Lead..."
                        : leadError
                          ? "Gagal memuat Lead. Silakan kembali ke Detail Lead."
                          : "Lead tidak ditemukan atau ID Lead tidak valid."}
                </div>
            );
        }

        return (
            <OpportunityFormModal
                key={createFromLead ? shortcutLeadId : "manual"}
                initialLead={createFromLead ? shortcutLead : undefined}
                onClose={() => {
                    setShowForm(false);

                    if (createFromLead) {
                        setSearchParams({}, { replace: true });
                    }
                }}
                onCreated={(createdOpportunity) => {
                    setShowForm(false);
                    setViewOppId(createdOpportunity.id);

                    if (createFromLead) {
                        setSearchParams({}, { replace: true });
                    }
                }}
            />
        );
    }

    if (viewOppId) {
        return <OpportunityDetailModal opportunityId={viewOppId} onClose={() => setViewOppId(null)} />;
    }
    return (<div className="crm-opportunity-ui" style={{ minHeight: "100%", background: COLORS.page }}>
      <style>{OPPORTUNITY_LIST_STYLES}</style>
      <PageHeader title="Peluang" subtitle="Pipeline penjualan dan perkiraan revenue."
      containerClassName="px-7 pt-5 pb-2"
      />

      <div className="crm-opportunity-content" style={{ padding: "0 2rem 3rem" }}>
        {/* PIPELINE SUMMARY */}
        {pipelineError && <div role="alert" style={{ padding: "0.7rem 0", color: COLORS.red, fontSize: "0.75rem" }}>
            Ringkasan Opportunity gagal dimuat. Silakan refresh halaman.
        </div>}
        <div className="crm-opportunity-pipeline" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: "0.9rem", marginBottom: "1rem" }}>
          {STAGE_ORDER.filter((stage) => stage !== "closed_lost").map((stage) => {
            const item = pipeline.find((pipelineItem) => pipelineItem.stage === stage);
            const meta = STAGE_META[stage];
            return (
              <article
                key={stage}
                className="crm-opportunity-stage-card"
                tabIndex={0}
                role="group"
                aria-label={`${STAGE_LABELS[stage]}: ${item?.opportunity_count ?? 0} opportunity, ${formatCurrency(item?.total_value ?? 0)}`}
              >
                <div className="crm-opportunity-stage-top">
                  <span className="crm-opportunity-stage-icon" style={{ color: meta.color, backgroundColor: meta.background }} aria-hidden="true">
                    {meta.icon}
                  </span>
                  <div className="crm-opportunity-stage-copy">
                    <span className="crm-opportunity-stage-label">{STAGE_LABELS[stage]}</span>
                    <span className="crm-opportunity-stage-count">{item?.opportunity_count ?? 0}</span>
                  </div>
                </div>
                <div className="crm-opportunity-stage-value">{formatCurrency(item?.total_value ?? 0)} nilai pipeline</div>
              </article>
            );
          })}
        </div>

        {/* DAFTAR PELUANG */}
        <section className="crm-opportunity-list-card" style={{ overflow: "hidden", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
          <div className="crm-opportunity-list-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", padding: "0.9rem 1.2rem", borderBottom: `1px solid ${COLORS.border}` }}>
            <div><div className="crm-opportunity-list-heading__title">Daftar Peluang</div><div className="crm-opportunity-list-heading__subtitle">Kelola dan pantau seluruh peluang penjualan</div></div>
          </div>

          <div className="crm-opportunity-toolbar" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", padding: "1rem 1.2rem" }}>
            <div className="crm-opportunity-search" style={{ minWidth: 260, height: 36, flex: 1, display: "flex", alignItems: "center", gap: "0.55rem", padding: "0 0.75rem", background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 8 }}>
              <Search size={15} color={COLORS.slate} strokeWidth={2}/>
              <input type="text" className="crm-opportunity-search-input" placeholder="Cari opportunity..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ width: "100%", height: "100%", padding: 0, border: "none", outline: "none", background: "transparent", color: COLORS.navy, fontSize: "0.75rem" }}/>
            </div>

            <div className="crm-opportunity-filter-wrap"><Filter size={15} aria-hidden="true"/><select className="crm-opportunity-filter" value={stageFilter} onChange={(e) => { setStageFilter(e.target.value as OpportunityStage | ""); setPage(1); }} style={{ width: 180, height: 36, padding: "0 0.75rem", border: `1px solid ${COLORS.border}`, borderRadius: 8, background: COLORS.white, color: COLORS.navy, fontSize: "0.75rem", outline: "none", cursor: "pointer" }}>
              <option value="">Semua Stage</option>
              {Object.entries(STAGE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select></div>

            <button type="button" className="crm-opportunity-primary-button" onClick={() => setShowForm(true)} style={{ height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0 1rem", border: "none", borderRadius: 8, background: COLORS.orange, color: COLORS.white, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              <Plus size={15}/> Opportunity Baru
            </button>
          </div>

          {listLoading && (
  <div style={{ padding: "1rem 1.2rem" }}>
    <LoadingState />
  </div>
)}

{isSearching && isSearchError && (
  <div
    role="alert"
    style={{ padding: "1rem 1.2rem", color: COLORS.red }}
  >
    Pencarian Opportunity gagal dimuat. Silakan coba lagi.
  </div>
)}

          {!listLoading && !isSearchError && visibleRows.length === 0 && (<div style={{ padding: "1.25rem" }}>
              <EmptyState
  title={isSearching ? "Opportunity tidak ditemukan" : "Belum Ada Opportunity"}
  subtitle={
    isSearching
      ? "Coba kata kunci lain atau ubah filter Stage."
      : "Opportunity dari pipeline sales akan muncul di sini."
  }
/>
            </div>)}

          {!listLoading && !isSearchError && visibleRows.length > 0 && (<>
              <div className="crm-opportunity-table-wrap" style={{ width: "100%", overflowX: "auto" }}>
                <table className="crm-opportunity-table" style={{ width: "100%", minWidth: 760, borderCollapse: "collapse", tableLayout: "fixed" }}>
                  <colgroup>{TABLE_COLUMNS.map((col) => <col key={col.label} style={{ width: col.width }}/>)}</colgroup>
                  <thead>
                    <tr style={{ background: COLORS.soft }}>
                      {TABLE_COLUMNS.map((col) => (<th key={col.label} style={{ padding: "0.72rem 0.75rem", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}`, color: COLORS.slate, fontSize: "0.68rem", fontWeight: 800, textAlign: col.align, textTransform: "uppercase", letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
                          {col.label}
                        </th>))}
                    </tr>
                  </thead>
                  <tbody>
  {visibleRows.map((opp) => (
    <OpportunityRow
      key={opp.id}
      opp={opp}
      onView={() => setViewOppId(opp.id)}
    />
  ))}
</tbody>
                </table>
              </div>
{(isSearching || data) && (
  <CrmPagination
    currentPage={listCurrentPage}
    lastPage={listLastPage}
    total={listTotal}
    perPage={perPage}
    onPageChange={setPage}
    onPerPageChange={setPerPage}
  />
)}
            </>)}
        </section>
      </div>

    </div>);
}
function OpportunityRow({ opp, onView }: {
    opp: Opportunity;
    onView: () => void;
}) {
    const badgeStyle = getStageBadgeStyle(opp.stage);
    const cellStyle = {
    padding: "0.78rem 0.75rem",
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.navy,
    fontSize: "0.77rem",
    verticalAlign: "middle",
  } as const;
    return (<tr className="crm-opportunity-table-row">
      <td style={{ ...cellStyle, fontWeight: 700 }}>{opp.opportunity_number}</td>
      <td style={{ ...cellStyle, fontWeight: 700 }}>{opp.name}</td>
      <td style={cellStyle}>{opportunitySalesPic(opp)}</td>
      <td style={{ ...cellStyle, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(Number(opp.estimated_value))}</td>
      <td style={{ ...cellStyle, textAlign: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 76, padding: "3px 10px", borderRadius: 999, background: badgeStyle.background, color: badgeStyle.color, fontSize: "0.66rem", lineHeight: 1.2, fontWeight: 700, whiteSpace: "nowrap" }}>
          {STAGE_LABELS[opp.stage]}
        </span>
      </td>
      <td style={{ ...cellStyle, textAlign: "center" }}>
        <button type="button" className="crm-opportunity-detail-button" onClick={onView} title="Lihat detail">
          <Eye size={14}/> Detail
        </button>
      </td>
    </tr>);
}
function getStageBadgeStyle(stage: OpportunityStage) {
    if (stage === "closed_won")
        return { background: "#dcfce7", color: "#16a34a" };
    if (stage === "closed_lost")
        return { background: "#fee2e2", color: "#dc2626" };
    if (stage === "negotiation")
        return { background: "#fef3c7", color: "#b7791f" };
    if (stage === "proposal")
        return { background: "#fff7ed", color: COLORS.orangeDark };
    if (stage === "needs_analysis")
        return { background: "#eef2ff", color: "#4f46e5" };
    return { background: "#eff6ff", color: "#2563eb" };
}
