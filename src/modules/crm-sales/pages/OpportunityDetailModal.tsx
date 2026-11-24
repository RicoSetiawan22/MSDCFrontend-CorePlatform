import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Phone,
  Users,
  Mail,
  MonitorPlay,
  StickyNote,
  Plus,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Target,
  Activity,
  FileText
} from "lucide-react";
import { useOpportunity, useLogOpportunityActivity, useUpdateOpportunityStage, } from "../api/useOpportunities";
import { CrmModalShell } from "./CreateContractFromQuotationModal";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate, } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { opportunitySalesPic, type OpportunityStage } from "../types/opportunity";
const COLORS = {
    navy: "#16213d",
    navyDark: "#0b1c33",
    slate: "#64748b",
    slateLight: "#94a3b8",
    orange: "#f2a602",
    orangeDark: "#d99200",
    green: "#16a34a",
    red: "#dc2626",
    border: "#e5e7eb",
    track: "#eef2f6",
    page: "#f5f7fa",
    white: "#ffffff",
    soft: "#f8fafc",
};
const OPPORTUNITY_DETAIL_STYLES = `
/* Detail Opportunity — soft enterprise visual system, aligned with Prospek & Opportunity Baru. */
.crm-opportunity-detail-ui {
  --opp-ink:#102b4e;
  --opp-muted:#788ba1;
  --opp-border:#e3ebf4;
  --opp-gold:#f7ab00;
  min-height:100%; padding-bottom:36px; background:#f5f7fb !important; color:var(--opp-ink);
}
.crm-opportunity-detail-ui *, .crm-opportunity-detail-ui *::before, .crm-opportunity-detail-ui *::after { box-sizing:border-box; }
.crm-opportunity-detail-ui button, .crm-opportunity-detail-ui input, .crm-opportunity-detail-ui textarea { font-family:inherit; }
.crm-opportunity-detail-content { margin:0 auto 32px !important; padding:2px clamp(16px, 2.2vw, 32px) 0 !important; width:100%; max-width:1600px; }
.crm-opportunity-detail-inner { width:100%; }
.crm-opportunity-detail-navigation { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin:4px 0 17px; }
.crm-opportunity-detail-ui .crm-opportunity-detail-back {
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  min-height:44px; margin:0 !important; padding:0 17px !important;
  border:1px solid #f2d58b !important; border-radius:12px !important;
  background:linear-gradient(180deg,#fffaf0 0%,#fff2cf 100%) !important;
  color:#916000 !important; font-size:12px !important; font-weight:800 !important;
  box-shadow:0 4px 12px rgba(220,157,20,.075);
  cursor:pointer; transition:transform .18s, background .18s, box-shadow .18s;
}
.crm-opportunity-detail-ui .crm-opportunity-detail-back:hover { transform:translateY(-1px); background:#ffebad !important; box-shadow:0 7px 18px rgba(220,157,20,.14); }
.crm-opportunity-detail-ui button:focus-visible, .crm-opportunity-detail-ui a:focus-visible {
  outline:3px solid rgba(247,171,0,.32); outline-offset:3px;
}
.crm-opportunity-detail-context { display:inline-flex; align-items:center; min-height:30px; padding:0 12px;
  border:1px solid #e1e9f2; border-radius:999px; background:#fff; color:#71859b; font-size:11px; font-weight:750; }
.crm-opportunity-detail-header {
  width:100%; margin:0 0 18px !important; padding:23px 25px !important;
  border:1px solid #e1e9f3 !important; border-radius:20px !important;
  background:linear-gradient(107deg,#f7faff 0%,#fcfdff 59%,#fff8e6 100%) !important;
  box-shadow:0 8px 28px rgba(15,39,71,.045);
}
.crm-opportunity-detail-header-main { display:flex; align-items:center; justify-content:space-between; gap:20px; flex-wrap:wrap; }
.crm-opportunity-detail-identity { display:flex; align-items:center; gap:15px; min-width:0; flex:1 1 320px; }
.crm-opportunity-detail-identity-icon { display:inline-flex; width:56px; height:56px; flex:0 0 56px; align-items:center; justify-content:center; border:1px solid #f5e3ae; border-radius:17px; background:#fff1c7; color:#b47b0b; }
.crm-opportunity-detail-eyebrow { display:block; margin-bottom:5px; color:#879bb1; font-size:10px; font-weight:850; letter-spacing:.07em; text-transform:uppercase; }
.crm-opportunity-detail-title { margin:0; color:#102b4e !important; font-size:23px !important; font-weight:850 !important; letter-spacing:-.035em; line-height:1.3; overflow-wrap:anywhere; }
.crm-opportunity-detail-subtitle { margin:6px 0 0; color:#71869f !important; font-size:12px !important; font-weight:550; line-height:1.5; overflow-wrap:anywhere; }
.crm-opportunity-detail-actions { display:flex; justify-content:flex-end; align-items:center; flex-wrap:wrap; gap:9px; max-width:100%; }
.crm-opportunity-detail-actions a, .crm-opportunity-detail-actions button {
  display:inline-flex; justify-content:center; align-items:center; gap:8px; min-height:42px !important;
  padding:0 14px !important; border-radius:11px !important; font-size:11px !important;
  font-weight:800 !important; line-height:1.25; text-decoration:none;
  transition:transform .18s,box-shadow .18s,background .18s;
}
.crm-opportunity-detail-actions a:hover, .crm-opportunity-detail-actions button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 7px 16px rgba(15,39,71,.10); }
.crm-opportunity-detail-actions .crm-opportunity-quotation { border:1px solid #efa500 !important; background:#f7ab00 !important; color:#092747 !important; box-shadow:0 4px 12px rgba(247,171,0,.13); }
.crm-opportunity-detail-actions .crm-opportunity-won { border:1px solid #bbebd2 !important; background:#eafaf1 !important; color:#087f45 !important; }
.crm-opportunity-detail-actions .crm-opportunity-lost { border:1px solid #ffd4d5 !important; background:#fff7f7 !important; color:#c42631 !important; }
.crm-opportunity-stage-badge { min-height:29px; display:inline-flex; align-items:center; border:1px solid #e1e9f2; padding:5px 11px !important; font-size:10px !important; font-weight:800 !important; letter-spacing:.02em; }
.crm-opportunity-detail-body { display:flex; flex-direction:column; gap:17px !important; width:100%; max-width:none !important; margin:0 !important; }
.crm-opportunity-detail-card { overflow:hidden; border:1px solid #e2eaf4 !important; border-radius:19px !important; background:#fff !important; box-shadow:0 6px 22px rgba(15,39,71,.042); }
.crm-opportunity-detail-card__heading { display:flex; align-items:center; gap:12px; padding:19px 23px !important; min-height:74px;
  border-bottom:1px solid #edf2f7 !important; color:#102b4e !important; font-size:14px !important; font-weight:850 !important;
  background:linear-gradient(105deg,#f8faff,#fffdf8) !important; }
.crm-opportunity-detail-card__heading-icon { display:inline-flex; width:42px; height:42px; flex:0 0 42px; align-items:center; justify-content:center; border-radius:13px; background:#eef5ff; color:#2563eb; }
.crm-opportunity-detail-heading-text { display:flex; flex-direction:column; gap:4px; min-width:0; }
.crm-opportunity-detail-heading-text strong { color:#102b4e; font-size:14px; font-weight:850; line-height:1.3; }
.crm-opportunity-detail-heading-text small { color:#8798ad; font-size:11px; font-weight:500; line-height:1.4; }
.crm-opportunity-detail-grid { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:13px !important; padding:21px 23px 23px !important; background:#fff !important; }
.crm-opportunity-detail-grid > div { min-width:0; min-height:78px; padding:16px 17px !important; border:1px solid #e7edf5; border-radius:14px; background:linear-gradient(180deg,#fff 0%,#fbfcfe 100%); overflow-wrap:anywhere; }
.crm-opportunity-detail-grid > div:last-child:nth-child(3n+1) { grid-column:1/-1; }
.crm-opportunity-detail-grid [style*="grid-column"], .crm-opportunity-detail-grid [style*="gridColumn"] { border-color:#fbd6d5 !important; background:#fffafa !important; }
.crm-opportunity-detail-grid > div > div:first-child { margin-bottom:7px !important; color:#8296af !important; font-size:10px !important; font-weight:800 !important; letter-spacing:.055em; }
.crm-opportunity-detail-grid > div > div:nth-child(2) { font-size:13px !important; font-weight:750 !important; line-height:1.5; }
.crm-opportunity-activity-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; min-height:75px;
  padding:17px 23px !important; border-bottom:1px solid #edf2f7 !important; background:linear-gradient(105deg,#fff,#fffcf6); }
.crm-opportunity-activity-title { display:flex; gap:12px; align-items:center; border:0 !important; padding:0 !important; min-height:0 !important; background:none !important; color:#102b4e; font-size:14px; font-weight:850; }
.crm-opportunity-activity-add { display:inline-flex; justify-content:center; align-items:center; gap:8px; min-height:39px; padding:0 14px !important;
  border:1px solid #f2d58b !important; border-radius:11px !important; background:#fff6dc !important; color:#916000 !important; font-size:11px !important; font-weight:800 !important; cursor:pointer;
  transition:transform .18s,background .18s; }
.crm-opportunity-activity-add:hover { background:#ffedbd !important; transform:translateY(-1px); }
.crm-opportunity-activity-body { padding:20px 23px !important; }
.crm-opportunity-activity-list { display:flex; flex-direction:column; gap:10px !important; max-height:340px !important; overflow-y:auto; }
.crm-opportunity-activity-item { display:flex; gap:12px !important; padding:14px !important; border:1px solid #e7edf4 !important; border-radius:14px !important; background:#fcfdff !important; }
.crm-opportunity-activity-item:hover { border-color:#d4e1ee !important; }
.crm-opportunity-activity-icon { display:flex; width:37px !important; height:37px !important; flex:0 0 37px !important; align-items:center; justify-content:center; border-radius:12px !important; background:#fff4d7 !important; color:#b7791f !important; }
.crm-opportunity-activity-form { padding:17px !important; border:1px solid #e2eaf4 !important; border-radius:14px !important; background:#f8fafc !important; }
.crm-opportunity-detail-ui .input { border:1px solid #dbe5f0 !important; border-radius:11px !important; font-size:12px !important; }
.crm-opportunity-detail-ui .input:focus { border-color:#e4a008 !important; box-shadow:0 0 0 3px rgba(240,168,0,.12) !important; outline:none !important; }
@media(max-width:1200px) { .crm-opportunity-detail-header-main { align-items:flex-start; } .crm-opportunity-detail-actions { justify-content:flex-start; } }
@media(max-width:900px) { .crm-opportunity-detail-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } }
@media(max-width:760px) {
  .crm-opportunity-detail-header { padding:18px !important; }
  .crm-opportunity-detail-header-main { flex-direction:column !important; align-items:stretch !important; }
  .crm-opportunity-detail-actions { width:100%; }
  .crm-opportunity-detail-actions a, .crm-opportunity-detail-actions button { flex:1 1 auto; }
  .crm-opportunity-detail-grid { grid-template-columns:1fr !important; padding:14px !important; }
  .crm-opportunity-detail-grid > div:last-child:nth-child(3n+1) { grid-column:auto; }
  .crm-opportunity-detail-card__heading, .crm-opportunity-activity-header { padding:15px 17px !important; }
  .crm-opportunity-activity-body { padding:16px !important; }
}
@media(max-width:480px) { .crm-opportunity-detail-identity-icon { width:48px; height:48px; flex-basis:48px; } .crm-opportunity-detail-title { font-size:19px !important; } .crm-opportunity-detail-actions a, .crm-opportunity-detail-actions button { flex:1 1 100%; } .crm-opportunity-activity-add { width:100%; } }
@media(prefers-reduced-motion:reduce) { .crm-opportunity-detail-ui *, .crm-opportunity-detail-ui *::before, .crm-opportunity-detail-ui *::after { transition:none !important; } }


/* Shared MSDC back navigation button: matched to Detail Produk & Jasa. */
.crm-msdc-back-button.crm-msdc-back-button {
  display: inline-flex !important;
  min-height: 43px !important;
  align-items: center !important;
  justify-content: center !important;
  align-self: flex-start !important;
  gap: 9px !important;
  padding: 0 17px !important;
  border: 1px solid #f7d27b !important;
  border-radius: 12px !important;
  background: linear-gradient(180deg, #fff9ed 0%, #fff2d2 100%) !important;
  color: #996100 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  line-height: 1.25 !important;
  text-decoration: none !important;
  box-shadow: 0 3px 10px rgba(215, 153, 17, .07) !important;
  cursor: pointer !important;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease !important;
  white-space: normal !important;
  text-align: center !important;
}
.crm-msdc-back-button.crm-msdc-back-button:hover:not(:disabled) {
  border-color: #e9b948 !important;
  background: #ffeab0 !important;
  color: #805000 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 7px 18px rgba(215, 153, 17, .14) !important;
}
.crm-msdc-back-button.crm-msdc-back-button:focus-visible {
  outline: 3px solid rgba(247, 171, 0, .3) !important;
  outline-offset: 2px !important;
}
.crm-msdc-back-button.crm-msdc-back-button svg {
  flex: 0 0 auto;
}
@media (max-width: 640px) {
  .crm-msdc-back-button.crm-msdc-back-button {
    min-height: 42px !important;
    gap: 8px !important;
    padding: 0 14px !important;
  }
}
`;

const STAGE_LABELS: Record<OpportunityStage, string> = {
    qualification: "Kualifikasi",
    needs_analysis: "Analisis Kebutuhan",
    proposal: "Proposal",
    negotiation: "Negosiasi",
    closed_won: "Menang",
    closed_lost: "Kalah",
};
const ACTIVITY_ICON: Record<string, ReactNode> = {
    call: <Phone size={13}/>,
    meeting: <Users size={13}/>,
    email: <Mail size={13}/>,
    demo: <MonitorPlay size={13}/>,
    other: <StickyNote size={13}/>,
};
const infoLabelStyle = {
    marginBottom: "0.3rem",
    color: COLORS.slate,
    fontSize: "0.64rem",
    fontWeight: 700,
    textTransform: "uppercase",
} as const;
const infoValueStyle = {
    color: COLORS.navy,
    fontSize: "0.75rem",
    fontWeight: 700,
    lineHeight: 1.4,
} as const;
export function OpportunityDetailModal({ opportunityId, onClose, }: {
    opportunityId: number;
    onClose: () => void;
}) {
    const { data: opp, isLoading } = useOpportunity(opportunityId);
    const [showLogForm, setShowLogForm] = useState(false);
    const [closingError, setClosingError] = useState<string | null>(null);
    const closeMutation = useUpdateOpportunityStage(opportunityId);
    const [closingMode, setClosingMode] = useState<"closed_won" | "closed_lost" | null>(null);
    const [lostReason, setLostReason] = useState("");
    const [competitor, setCompetitor] = useState("");
    const [finalAmount, setFinalAmount] = useState("");
    function openClosing(mode: "closed_won" | "closed_lost") {
        setClosingMode(mode);
        setClosingError(null);
        setLostReason("");
        setCompetitor(opp?.competitor_name ?? "");
        setFinalAmount(String(opp?.final_amount ?? opp?.estimated_value ?? ""));
    }
    async function submitClosing(event: FormEvent) {
        event.preventDefault();
        if (!closingMode || !opp || closeMutation.isPending) return;
        if (closingMode === "closed_lost" && !lostReason.trim()) { setClosingError("Alasan kalah wajib diisi."); return; }
        if (closingMode === "closed_won" && (!finalAmount.trim() || !Number.isFinite(Number(finalAmount)) || Number(finalAmount) < 0)) {
            setClosingError("Masukkan nilai closing final yang valid."); return;
        }
        setClosingError(null);
        try {
            await closeMutation.mutateAsync({ stage: closingMode, lost_reason: closingMode === "closed_lost" ? lostReason.trim() : undefined,
                competitor_name: closingMode === "closed_lost" ? competitor.trim() || undefined : undefined,
                final_amount: closingMode === "closed_won" ? Number(finalAmount) : undefined });
            setClosingMode(null);
        } catch (err) { setClosingError(extractErrorMessage(err)); }
    }
    return (<div className="crm-opportunity-detail-ui" style={{ minHeight: "100%", background: COLORS.page }}>
        <style>{OPPORTUNITY_DETAIL_STYLES}</style>
        <PageHeader title="Peluang" subtitle="Pipeline penjualan dan perkiraan revenue."
        containerClassName="px-7 pt-5 pb-2"
        />
        <div className="crm-opportunity-detail-content" style={{ padding: "0 2rem 3rem" }}>
          <div className="crm-opportunity-detail-inner">
            <div className="crm-opportunity-detail-navigation">
              <button type="button" className="crm-opportunity-detail-back crm-msdc-back-button" onClick={onClose}>
                <ArrowLeft size={17} strokeWidth={2.3} /> Kembali ke daftar Peluang
              </button>
              <span className="crm-opportunity-detail-context">Detail Opportunity</span>
            </div>

            <div className="crm-opportunity-detail-header">
              <div className="crm-opportunity-detail-header-main">
                <div className="crm-opportunity-detail-identity">
                  <span className="crm-opportunity-detail-identity-icon" aria-hidden="true"><Target size={24} strokeWidth={1.9}/></span>
                  <div style={{ minWidth: 0 }}>
                    <span className="crm-opportunity-detail-eyebrow">Informasi peluang penjualan</span>
                    <h2 className="crm-opportunity-detail-title">{opp?.name ?? "Detail Opportunity"}</h2>
                    <p className="crm-opportunity-detail-subtitle">
                      {opp?.opportunity_number ?? "Memuat data..."}
                      {opp && (<>
                        {" • "}
                        {opp.customer?.company_name ?? opp.lead?.company_name ?? "—"}
                        {opp.lead_id && !opp.customer_id ? " (Lead)" : ""}
                      </>)}
                    </p>
                  </div>
                </div>
                {opp && <div className="crm-opportunity-detail-actions">
                  <StageBadge stage={opp.stage}/>
                  {opp.stage !== "closed_lost" && (
                    <Link className="crm-opportunity-quotation" to={`/crm-sales/quotations/new?opportunity_id=${opportunityId}`}>
                      <FileText size={15}/> Buat Quotation Baru
                    </Link>
                  )}
                  {!opp.stage.startsWith("closed_") && <>
                    <button type="button" className="crm-opportunity-won" disabled={closeMutation.isPending} onClick={() => openClosing("closed_won")}><CheckCircle2 size={16}/> Mark WON</button>
                    <button type="button" className="crm-opportunity-lost" disabled={closeMutation.isPending} onClick={() => openClosing("closed_lost")}><XCircle size={16}/> Mark LOST</button>
                  </>}
                </div>}
              </div>
            </div>

      {/* LOADING */}
      {isLoading && <LoadingState />}


      {opp && (<div className="crm-opportunity-detail-body">
          {/* OPPORTUNITY INFORMATION */}
          <section className="crm-opportunity-detail-card" style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                background: COLORS.white,
                overflow: "hidden",
            }}>
            <div className="crm-opportunity-detail-card__heading">
              <span className="crm-opportunity-detail-card__heading-icon"><Target size={19}/></span>
              <span className="crm-opportunity-detail-heading-text">
                <strong>Informasi Opportunity</strong>
                <small>Ringkasan nilai, tahap penjualan, probabilitas, dan penanggung jawab</small>
              </span>
            </div>

            <div className="crm-opportunity-detail-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "1rem",
                padding: "1rem",
                background: COLORS.soft,
            }}>
              <div><div style={infoLabelStyle}>PIC</div><div style={infoValueStyle}>{opportunitySalesPic(opp)}</div>
                {!opp.resolved_sales_employee && <span style={{ color: COLORS.red, fontSize: 11 }}>Owner HR belum teridentifikasi. Periksa PIC pada Lead asal.</span>}
              </div>
              {/* ESTIMASI NILAI */}
              <div>
                <div style={infoLabelStyle}>
                  Estimasi Nilai
                </div>

                <div style={{
                ...infoValueStyle,
                color: COLORS.green,
            }}>
                  {formatCurrency(Number(opp.estimated_value))}
                </div>
              </div>


              {/* PROBABILITAS */}
              <div>
                <div style={infoLabelStyle}>
                  Probabilitas
                </div>

                <div style={infoValueStyle}>
                  {opp.probability_pct}%
                </div>
              </div>


              {/* STAGE */}
              <div>
                <div style={infoLabelStyle}>
                  Stage
                </div>

                <div style={infoValueStyle}>
                  {STAGE_LABELS[opp.stage] ?? opp.stage}
                </div>
              </div>


              {/* TARGET CLOSE */}
              <div>
                <div style={infoLabelStyle}>
                  Target Close
                </div>

                <div style={infoValueStyle}>
                  {opp.expected_close_date
                ? formatDate(opp.expected_close_date)
                : "—"}
                </div>
              </div>


              {/* KOMPETITOR */}
              <div>
                <div style={infoLabelStyle}>
                  Kompetitor
                </div>

                <div style={infoValueStyle}>
                  {opp.competitor_name ??
                "—"}
                </div>
              </div>


              {/* CREATED */}
              <div>
                <div style={infoLabelStyle}>
                  Dibuat
                </div>

                <div style={infoValueStyle}>
                  {formatDate(opp.created_at)}
                </div>
              </div>


              {opp.closed_at && <div><div style={infoLabelStyle}>Tanggal Closing</div><div style={infoValueStyle}>{formatDate(opp.closed_at)}</div></div>}
              {opp.final_amount != null && <div><div style={infoLabelStyle}>Nilai Closing Final</div><div style={infoValueStyle}>{formatCurrency(Number(opp.final_amount))}</div></div>}
              {opp.closed_by && <div><div style={infoLabelStyle}>Closed By (User ID)</div><div style={infoValueStyle}>#{opp.closed_by}</div></div>}
              {opp.notes && <div><div style={infoLabelStyle}>Catatan</div><div style={infoValueStyle}>{opp.notes}</div></div>}
              {/* LOST REASON */}
              {opp.stage ===
                "closed_lost" &&
                opp.lost_reason && (<div style={{
                    gridColumn: "1 / -1",
                    paddingTop: "0.75rem",
                    borderTop: `1px solid ${COLORS.border}`,
                }}>
                    <div style={infoLabelStyle}>
                      Alasan Kalah
                    </div>

                    <div style={{
                    color: COLORS.red,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    lineHeight: 1.5,
                }}>
                      {opp.lost_reason}
                    </div>
                  </div>)}
            </div>
          </section>


          {/* ACTIVITY HISTORY */}
          <section className="crm-opportunity-detail-card" style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 10,
                background: COLORS.white,
                overflow: "hidden",
            }}>
            {/* SECTION HEADER */}
            <div className="crm-opportunity-activity-header">
              <div className="crm-opportunity-activity-title">
                <span className="crm-opportunity-detail-card__heading-icon" style={{ background: "#fff4d8", color: "#b7791f" }}><Activity size={19}/></span>
                <span className="crm-opportunity-detail-heading-text">
                  <strong>Riwayat Aktivitas</strong>
                  <small>Pantau komunikasi dan aktivitas terkait peluang ini</small>
                </span>
              </div>
              <button type="button" className="crm-opportunity-activity-add" onClick={() => setShowLogForm((value) => !value)}>
                <Plus size={16}/> Catat Aktivitas
              </button>
            </div>

            <div className="crm-opportunity-activity-body" style={{
                padding: "1rem",
            }}>
              {/* LOG FORM */}
              {showLogForm && (<LogActivityForm opportunityId={opportunityId} onDone={() => setShowLogForm(false)}/>)}


              {/* EMPTY ACTIVITY */}
              {(opp.activities ?? [])
                .length === 0 ? (<div style={{
                    padding: "1.2rem 0.5rem",
                    textAlign: "center",
                    color: COLORS.slate,
                    fontSize: "0.75rem",
                }}>
                  Belum ada aktivitas
                  tercatat.
                </div>) : (
            /* ACTIVITY LIST */
            <div className="crm-opportunity-activity-list" style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                    maxHeight: 260,
                    overflowY: "auto",
                }}>
                  {[
                    ...(opp.activities ??
                        []),
                ]
                    .sort((a, b) => b.activity_date.localeCompare(a.activity_date))
                    .map((activity) => (<div key={activity.id} className="crm-opportunity-activity-item" style={{
                        display: "flex",
                        gap: "0.7rem",
                        padding: "0.7rem 0.8rem",
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: 8,
                        background: COLORS.white,
                    }}>
                        {/* ICON */}
                        <div className="crm-opportunity-activity-icon" style={{
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 7,
                        background: "#fff8e6",
                        color: COLORS.orangeDark,
                    }}>
                          {ACTIVITY_ICON[activity
                        .activity_type] ?? (<StickyNote size={13}/>)}
                        </div>


                        {/* ACTIVITY CONTENT */}
                        <div style={{
                        flex: 1,
                        minWidth: 0,
                    }}>
                          <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "0.75rem",
                    }}>
                            <span style={{
                        color: COLORS.navy,
                        fontWeight: 700,
                        fontSize: "0.75rem",
                        lineHeight: 1.4,
                    }}>
                              {activity.subject}
                            </span>

                            <span style={{
                        flexShrink: 0,
                        color: COLORS.slate,
                        fontSize: "0.66rem",
                    }}>
                              {formatDate(activity.activity_date)}
                            </span>
                          </div>


                          {activity.notes && (<div style={{
                            marginTop: "0.3rem",
                            color: COLORS.slate,
                            fontSize: "0.71rem",
                            lineHeight: 1.5,
                        }}>
                              {activity.notes}
                            </div>)}
                        </div>
                      </div>))}
                </div>)}
            </div>
          </section>
        </div>)}
          </div>
        </div>
      {closingMode && <CrmModalShell title={closingMode === "closed_won" ? "Konfirmasi Closing WON" : "Konfirmasi Closing LOST"}
        onClose={() => { if (!closeMutation.isPending) { setClosingMode(null); setClosingError(null); } }} maxWidth={540}>
        <form onSubmit={submitClosing} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ margin: 0, color: COLORS.slate, fontSize: 13 }}>
            Opportunity <strong>{opp?.opportunity_number}</strong> akan ditandai {closingMode === "closed_won" ? "menang" : "kalah"}.
          </p>
          {closingMode === "closed_won" ? <label style={{ fontSize: 13, fontWeight: 700 }}>
            Nilai Closing Final (Rp) *
            <input className="input" type="number" min="0" step="0.01" value={finalAmount} onChange={e => setFinalAmount(e.target.value)}
              required style={{ width: "100%", marginTop: 7 }}/>
          </label> : <>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Alasan Kalah *
              <textarea className="input" rows={3} maxLength={255} value={lostReason} onChange={e => setLostReason(e.target.value)}
                required placeholder="Tuliskan alasan penawaran kalah..." style={{ width: "100%", marginTop: 7 }}/>
            </label>
            <label style={{ fontSize: 13, fontWeight: 700 }}>Nama Kompetitor (opsional)
              <input className="input" maxLength={150} value={competitor} onChange={e => setCompetitor(e.target.value)}
                style={{ width: "100%", marginTop: 7 }}/>
            </label>
          </>}
          {closingError && <div role="alert" style={{ color: COLORS.red, background: "#fef2f2", padding: 10, borderRadius: 8 }}>{closingError}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button type="button" variant="secondary" onClick={() => setClosingMode(null)} disabled={closeMutation.isPending}>Batal</Button>
            <Button type="submit" disabled={closeMutation.isPending}>
              {closeMutation.isPending ? "Menyimpan..." : closingMode === "closed_won" ? "Simpan WON" : "Simpan LOST"}
            </Button>
          </div>
        </form>
      </CrmModalShell>}
      </div>);
}
function StageBadge({ stage, }: {
    stage: OpportunityStage;
}) {
    const style = getStageBadgeStyle(stage);
    return (<span className="crm-opportunity-stage-badge" style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "4px 10px",
            borderRadius: 999,
            background: style.background,
            color: style.color,
            fontSize: "0.66rem",
            lineHeight: 1.2,
            fontWeight: 700,
            whiteSpace: "nowrap",
        }}>
      {STAGE_LABELS[stage]}
    </span>);
}
function getStageBadgeStyle(stage: OpportunityStage) {
    if (stage === "closed_won") {
        return {
            background: "#dcfce7",
            color: "#16a34a",
        };
    }
    if (stage === "closed_lost") {
        return {
            background: "#fee2e2",
            color: "#dc2626",
        };
    }
    if (stage === "negotiation") {
        return {
            background: "#fef3c7",
            color: "#b7791f",
        };
    }
    return {
        background: "#f1f5f9",
        color: "#64748b",
    };
}
function LogActivityForm({ opportunityId, onDone, }: {
    opportunityId: number;
    onDone: () => void;
}) {
    const logMutation = useLogOpportunityActivity(opportunityId);
    const [activityType, setActivityType] = useState("call");
    const [subject, setSubject] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState<string | null>(null);
    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!subject.trim()) {
            setError("Judul aktivitas wajib diisi.");
            return;
        }
        setError(null);
        try {
            await logMutation.mutateAsync({
                activity_type: activityType,
                subject: subject.trim(),
                notes: notes.trim() ||
                    undefined,
            });
            setSubject("");
            setNotes("");
            onDone();
        }
        catch (err) {
            setError(extractErrorMessage(err));
        }
    }
    return (<form className="crm-opportunity-activity-form" onSubmit={handleSubmit} style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.65rem",
            marginBottom: "1rem",
            padding: "0.85rem",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            background: COLORS.soft,
        }}>
      {/* TYPE + SUBJECT */}
      <div style={{
            display: "grid",
            gridTemplateColumns: "125px 1fr",
            gap: "0.6rem",
        }}>
        <select className="input" value={activityType} onChange={(e) => setActivityType(e.target.value)} style={{
            height: 36,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            background: COLORS.white,
            color: COLORS.navy,
            fontSize: "0.72rem",
            outline: "none",
        }}>
          <option value="call">
            Telepon
          </option>

          <option value="meeting">
            Meeting
          </option>

          <option value="email">
            Email
          </option>

          <option value="demo">
            Demo
          </option>

          <option value="other">
            Lainnya
          </option>
        </select>


        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Judul aktivitas..." style={{
            height: 36,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.navy,
            fontSize: "0.72rem",
        }}/>
      </div>


      {/* NOTES */}
      <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)..." style={{
            minHeight: 70,
            resize: "vertical",
            padding: "0.6rem 0.7rem",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            color: COLORS.navy,
            fontSize: "0.72rem",
            lineHeight: 1.5,
        }}/>


      {/* ERROR */}
      {error && (<div style={{
                padding: "0.55rem 0.7rem",
                border: "1px solid #fecaca",
                borderRadius: 7,
                background: "#fef2f2",
                color: COLORS.red,
                fontSize: "0.7rem",
                fontWeight: 600,
            }}>
          {error}
        </div>)}


      {/* ACTIONS */}
      <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
        }}>
        <Button type="button" variant="secondary" onClick={onDone} style={{
            minWidth: 72,
            height: 32,
            borderRadius: 7,
            fontSize: "0.7rem",
            fontWeight: 700,
        }}>
          Batal
        </Button>


        <Button type="submit" disabled={logMutation.isPending} style={{
            minWidth: 86,
            height: 32,
            border: "none",
            borderRadius: 7,
            background: COLORS.orange,
            color: COLORS.white,
            fontSize: "0.7rem",
            fontWeight: 700,
        }}>
          {logMutation.isPending
            ? "Menyimpan..."
            : "Simpan"}
        </Button>
      </div>
    </form>);
}
