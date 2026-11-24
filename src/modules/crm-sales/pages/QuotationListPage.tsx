
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";


import {
  Search,
  Plus,
  AlertTriangle,
  Send,
  FileDown,
  LayoutGrid,
  List,
  FileText,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Eye,
  Pencil,
  ClipboardCheck,
  CalendarDays,
  XCircle,
  UserRoundPlus,
  FilePlus2,
} from "lucide-react";

import {
  useQuotation,
  useQuotationList,
  useSubmitQuotationApproval,
  useUpdateQuotationStatus,
} from "../api/useQuotations";

import { opportunityApi } from "../api/opportunityApi";
import { quotationApi } from "../api/quotationApi";

import { CrmPagination, CRM_DEFAULT_PER_PAGE } from "../components/CrmPagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";

import {
  formatCurrency,
  formatDate,
  formatNumber,
} from "@shared/lib/format";

import {
  extractErrorMessage,
  type PaginatedResponse,
} from "@shared/types/api";

import { CreateContractFromQuotationModal } from "./CreateContractFromQuotationModal";
import { AssignCustomerModal } from "./AssignCustomerModal";

// FITUR BARU: Modal Lose
import { QuotationLoseModal } from "./QuotationLoseModal";

import { apiClient } from "@shared/lib/api-client";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { CrmPdfPreviewModal } from "../components/CrmPdfPreviewModal";

import type {
  Quotation,
  QuotationStatus,
} from "../types/quotation";

import type { Opportunity } from "../types/opportunity";

/**
 * ==========================================
 * STATUS QUOTATION
 * ==========================================
 *
 * rejected = penolakan customer (approval internal tersimpan di internal_rejection_reason)
 * lost = penawaran kalah oleh customer
 */
const QUOT_STATUS_LABELS: Record<
  QuotationStatus,
  string
> = {
  draft: "Draft",
  waiting_approval: "Menunggu Approval",
  approved: "Disetujui",
  sent: "Terkirim",
  viewed: "Dilihat",
  negotiation: "Negosiasi",
  accepted: "Diterima",
  rejected: "Ditolak Customer",
  lost: "Lose (Ditolak Client)",
  expired: "Expired",
};

/**
 * Warna status quotation.
 *
 * Status lost diberikan warna merah
 * agar mudah dibedakan dari status lain.
 */
const QUOT_STATUS_COLORS: Record<
  QuotationStatus,
  { bg: string; color: string }
> = {
  draft: {
    bg: "#f3f4f6",
    color: "#6b7280",
  },
  waiting_approval: {
    bg: "#fef3c7",
    color: "#b45309",
  },
  approved: {
    bg: "#dcfce7",
    color: "#15803d",
  },
  sent: {
    bg: "#dbeafe",
    color: "#1d4ed8",
  },
  viewed: {
    bg: "#e0f2fe",
    color: "#0369a1",
  },
  negotiation: {
    bg: "#fef9c3",
    color: "#a16207",
  },
  accepted: {
    bg: "#dcfce7",
    color: "#15803d",
  },
  rejected: {
    bg: "#fee2e2",
    color: "#dc2626",
  },
  lost: {
    bg: "#fee2e2",
    color: "#991b1b",
  },
  expired: {
    bg: "#fee2e2",
    color: "#dc2626",
  },
};

/**
 * Mode tampilan quotation.
 */
type ViewMode = "grid" | "table";

/**
 * Data yang digunakan untuk pencarian.
 *
 * Nama customer dan layanan bisa
 * diperoleh dari Opportunity terkait.
 */
type QuotationSearchData = Quotation & {
  customer?: {
    company_name?: string | null;
  } | null;

  lead?: {
    company_name?: string | null;
  } | null;

  opportunity?: {
    name?: string | null;
    opportunity_number?: string | null;

    customer?: {
      company_name?: string | null;
    } | null;

    lead?: {
      company_name?: string | null;
    } | null;
  } | null;

  lines?: Array<{
    description?: string | null;
  }> | null;
};

/**
 * Fungsi pencarian quotation.
 */
function matchesQuotationSearch(
  quotation: Quotation,
  opportunity: Opportunity | undefined,
  query: string
): boolean {
  const data = quotation as QuotationSearchData;

  const searchableText = [
    quotation.quotation_number,
    opportunity?.opportunity_number,
    opportunity?.name,
    opportunity?.customer?.company_name,
    opportunity?.lead?.company_name,
    data.customer?.company_name,
    data.lead?.company_name,
    data.opportunity?.name,
    data.opportunity?.opportunity_number,
    data.opportunity?.customer?.company_name,
    data.opportunity?.lead?.company_name,
    ...(data.lines ?? []).map(
      (line) => line.description
    ),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();

  return query
    .toLocaleLowerCase()
    .trim()
    .split(/\s+/)
    .every((word) =>
      searchableText.includes(word)
    );
}

/**
 * ==========================================
 * KONFIGURASI WARNA UI
 * ==========================================
 */
const UI = {
  navy: "#092747",
  navyText: "#16213D",
  orange: "#F7AB00",
  orangeDark: "#D99200",
  slate: "#64748B",
  slateLight: "#94A3B8",
  border: "#E5E7EB",
  light: "#F8FAFC",
  page: "#F5F7FA",
  white: "#FFFFFF",
  green: "#16A34A",
  red: "#DC2626",
};

/**
 * ==========================================
 * ATURAN TOMBOL LOSE
 * ==========================================
 *
 * Tombol Lose tersedia untuk status tertentu selama
 * Quotation belum memiliki Contract maupun Sales Order.
 */
function ReofferOpportunityButton({ qt }: { qt: Quotation }) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const eligible = ["lost", "rejected", "expired", "sent", "negotiation"].includes(qt.status);
  if (!eligible) return null;
  async function createReoffer() {
    const label = window.prompt("Nama penawaran/banding harga baru:", `Penawaran ulang ${qt.quotation_number}`);
    if (!label?.trim()) return;
    if (!window.confirm("Buat Opportunity baru yang ditautkan ke Quotation ini?")) return;
    setSaving(true);
    try {
      const response = await opportunityApi.create({ name: label.trim(), estimated_value: Number(qt.total_amount) || 0,
        customer_id: qt.customer_id, lead_id: qt.lead_id, source_quotation_id: qt.id });
      window.alert(`Opportunity baru berhasil dibuat: ${response.data.data.opportunity_number}`);
      navigate("/crm-sales/opportunities");
    } catch (error) { window.alert(extractErrorMessage(error)); }
    finally { setSaving(false); }
  }
  return <button type="button" className="action-btn" disabled={saving} onClick={createReoffer}
    style={{ border: `1px solid ${UI.orange}`, borderRadius: 8, background: "#FFF7ED", color: UI.navy, cursor: "pointer", padding: "0.4rem 0.65rem", fontSize: "0.7rem", fontWeight: 800 }}>
    <Plus size={14} aria-hidden="true" /> {saving ? "Membuat..." : "Ajukan Penawaran Ulang"}
  </button>;
}

function canLoseQuotation(qt: Quotation): boolean {
  const allowedStatuses: QuotationStatus[] = ["approved", "sent", "viewed", "negotiation"];
  const salesOrdersCount = (qt as Quotation & { sales_orders_count?: number }).sales_orders_count ?? 0;
  return allowedStatuses.includes(qt.status) && (qt.contracts_count ?? 0) === 0 && salesOrdersCount === 0;
}


const QUOTATION_UI_STYLES = `
.crm-quotation-list-root, .quotation-detail-page {
  min-height: 100%;
  background: #f5f7fb;
  color: #1e293b;
  padding-bottom: 28px;
}
.crm-quotation-list-root *, .quotation-detail-page * { box-sizing: border-box; }
.quotation-page { --crm-ink: #102b4e; --crm-muted: #64748b; --crm-border: #e2e8f0; }
.quotation-page .quotation-content {
  padding: 12px clamp(16px, 2.2vw, 32px) 28px !important;
}
.quotation-page .quotation-summary { padding: 8px 0 18px; }
.quotation-page .quotation-kpis {
  display: grid !important;
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px !important;
}
.quotation-page .quotation-kpi {
  display: flex;
  min-width: 0;
  min-height: 142px;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 18px !important;
  border: 1px solid rgba(226,232,240,.95) !important;
  border-radius: 16px !important;
  background: linear-gradient(180deg, #fff 0%, #fcfdff 100%) !important;
  box-shadow: 0 2px 8px rgba(15,39,71,.045) !important;
  transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .2s ease;
}
.quotation-page .quotation-kpi:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1 !important;
  box-shadow: 0 12px 26px rgba(15,23,42,.09) !important;
}
.quotation-page .quotation-kpi__heading { display:flex; align-items:center; gap:11px; min-width:0; }
.quotation-page .quotation-kpi__icon {
  display:inline-flex; width:42px; height:42px; flex:0 0 42px;
  align-items:center; justify-content:center; border-radius:13px;
  transition: transform .22s cubic-bezier(.16,1,.3,1);
}
.quotation-page .quotation-kpi:hover .quotation-kpi__icon { transform:scale(1.06) rotate(-3deg); }
.quotation-page .quotation-kpi__icon--blue { background:#eff6ff; color:#2563eb; }
.quotation-page .quotation-kpi__icon--amber { background:#fff7ed; color:#d97706; }
.quotation-page .quotation-kpi__icon--green { background:#ecfdf5; color:#059669; }
.quotation-page .quotation-kpi__icon--rose { background:#fff1f2; color:#e11d48; }
.quotation-page .quotation-kpi__label {
  color:#64748b; font-size:.68rem; font-weight:800; letter-spacing:.045em;
  line-height:1.45; text-transform:uppercase;
}
.quotation-page .quotation-kpi__value {
  color:#0f2946; font-size:clamp(1.55rem,2vw,1.9rem); font-weight:850;
  letter-spacing:-.04em; line-height:1.08; font-variant-numeric:tabular-nums;
}
.quotation-page .quotation-kpi__note { color:#64748b; font-size:.72rem; font-weight:550; line-height:1.4; }
.quotation-page .quotation-expired-alert {
  display:flex; align-items:center; gap:10px; margin:0 0 16px !important;
  padding:12px 15px !important; border:1px solid #fde68a !important;
  border-radius:12px !important; background:#fffbeb !important;
}
.quotation-page .quotation-list-shell {
  overflow:hidden; border:1px solid #e2e8f0 !important; border-radius:18px !important;
  background:#fff !important; box-shadow:0 4px 20px -8px rgba(15,39,71,.09) !important;
}
.quotation-page .quotation-toolbar {
  display:flex; flex-wrap:wrap; align-items:center; gap:10px !important;
  padding:16px 20px !important; border-bottom:1px solid #edf1f5 !important;
  background:#f8fafc !important;
}
.quotation-page .quotation-search-field {
  min-height:42px !important; border:1px solid #e2e8f0 !important;
  border-radius:11px !important; background:#fff !important;
  transition:border-color .18s ease, box-shadow .18s ease;
}
.quotation-page .quotation-search-field:focus-within {
  border-color:#f0a800 !important; box-shadow:0 0 0 4px rgba(240,168,0,.11);
}
.quotation-page .quotation-search-field input { font-size:.78rem !important; }
.quotation-page .quotation-status-filter {
  min-height:42px !important; border:1px solid #e2e8f0 !important;
  border-radius:11px !important; background:#fff !important; color:#334155 !important;
  transition:border-color .18s ease, box-shadow .18s ease;
}
.quotation-page .quotation-status-filter:focus-visible {
  outline:3px solid rgba(240,168,0,.2); border-color:#f0a800 !important;
}
.quotation-page .quotation-view-toggle { border-radius:12px !important; background:#eef2f7 !important; }
.quotation-page .quotation-create-button {
  min-height:42px !important; border-radius:11px !important;
  background:#f0a800 !important; box-shadow:0 5px 13px rgba(240,168,0,.18);
  transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.quotation-page .quotation-create-button:hover { transform:translateY(-2px); background:#df9900 !important; box-shadow:0 8px 17px rgba(240,168,0,.24); }
.quotation-page .quotation-card {
  border:1px solid #e2e8f0 !important; border-radius:16px !important;
  background:#fff !important; box-shadow:0 3px 12px rgba(15,39,71,.055) !important;
  transition:transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .2s ease !important;
}
.quotation-page .quotation-card:hover {
  transform:translateY(-4px) !important; border-color:#cbd5e1 !important;
  box-shadow:0 13px 28px rgba(15,23,42,.10) !important;
}
.quotation-page .quotation-table-wrap { width:100%; overflow-x:auto; }
.quotation-page .quotation-table { border-collapse:separate !important; border-spacing:0; }
.quotation-page .quotation-table th {
  padding:13px 14px !important; border-bottom:1px solid #e2e8f0 !important;
  background:#f8fafc !important; color:#64748b !important;
  font-size:.66rem !important; font-weight:800 !important; letter-spacing:.045em;
}
.quotation-page .quotation-table td {
  padding:14px !important; border-bottom:1px solid #edf1f5 !important;
  color:#334155 !important; font-size:.75rem !important;
}
.quotation-page .quotation-table tbody tr { transition:background .16s ease; }
.quotation-page .quotation-table tbody tr:hover { background:#f8fafc !important; }
.quotation-page .action-btn {
  transition:transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease !important;
}
.quotation-page .action-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 4px 11px rgba(15,39,71,.09); }
.quotation-page button:focus-visible, .quotation-detail-page button:focus-visible {
  outline:3px solid rgba(240,168,0,.28); outline-offset:2px;
}
.quotation-detail-page .quotation-detail-content { padding:0 clamp(16px,2.2vw,32px) 36px !important; }
.quotation-detail-page .quotation-detail-hero,
.quotation-detail-page .quotation-detail-document {
  border:1px solid #e2e8f0 !important; border-radius:18px !important;
  background:#fff !important; box-shadow:0 4px 20px -8px rgba(15,39,71,.09);
}
.quotation-detail-page .quotation-detail-document { overflow:hidden; }
.quotation-detail-page .quotation-detail-table th {
  padding:13px 10px !important; background:#f8fafc; color:#64748b !important;
  border-bottom:1px solid #e2e8f0; font-size:.66rem !important; font-weight:800 !important;
}
.quotation-detail-page .quotation-detail-table td { padding:14px 10px !important; border-bottom:1px solid #edf1f5; font-size:.75rem; }
.quotation-detail-page button { transition:transform .18s ease, box-shadow .18s ease, color .18s ease; }
.quotation-detail-page button:hover:not(:disabled) { transform:translateY(-1px); }
@media (max-width: 1080px) {
  .quotation-page .quotation-kpis { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
  .quotation-page .pipeline-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; }
}
@media (max-width: 760px) {
  .quotation-page .quotation-content { padding-left:16px !important; padding-right:16px !important; }
  .quotation-page .quotation-toolbar { align-items:stretch !important; }
  .quotation-page .quotation-toolbar > * { max-width:100%; }
  .quotation-page .quotation-search-field { flex-basis:100%; }
  .quotation-page .quotation-status-filter { width:100% !important; }
  .quotation-page .pipeline-grid { grid-template-columns:1fr !important; }
  .quotation-detail-page .quotation-detail-content { padding-left:16px !important; padding-right:16px !important; }
}
@media (max-width: 520px) {
  .quotation-page .quotation-kpis { grid-template-columns:1fr !important; gap:10px !important; }
  .quotation-page .quotation-kpi { min-height:118px; }
}

/* Soft MSDC controls – consistent with Prospek, Customer, and Produk & Jasa. */
.quotation-page .quotation-card { border-radius:18px !important; box-shadow:0 4px 16px rgba(9,39,71,.045) !important; }
.quotation-page .quotation-card:hover { transform:translateY(-2px) !important; box-shadow:0 9px 22px rgba(9,39,71,.075) !important; }
.quotation-page .quotation-status-badge,
.quotation-detail-page .quotation-status-badge {
  display:inline-flex !important; align-items:center; justify-content:center;
  gap:.35rem; min-height:28px; max-width:100%;
  padding:.34rem .7rem !important; border-radius:999px !important;
  font-size:.67rem !important; line-height:1.2 !important;
  font-weight:800 !important; white-space:nowrap !important;
  overflow-wrap:normal !important; word-break:keep-all !important;
}
.quotation-page .quotation-status-badge svg,
.quotation-detail-page .quotation-status-badge svg { flex:none; }
.quotation-page .quotation-card-actions, .quotation-page .quotation-row-actions {
  display:flex; flex-wrap:wrap; align-items:center; align-content:flex-start;
  gap:.45rem !important; min-width:0;
}
.quotation-page .quotation-card-actions { margin-top:.65rem; padding-top:.7rem; border-top:1px solid #eef2f7; }
.quotation-page .quotation-row-actions { gap:.38rem !important; }
.quotation-page .quotation-table .quotation-row-actions { display:flex !important; flex-wrap:nowrap !important; align-items:center; align-content:center; gap:.42rem !important; width:max-content; min-width:max-content; max-width:none; white-space:nowrap; }
.quotation-page .action-btn, .quotation-page .quotation-row-actions .btn {
  display:inline-flex; align-items:center; justify-content:center; gap:.35rem;
  min-height:33px; padding:.42rem .68rem; border-radius:9px !important;
  font-family:inherit; font-size:.71rem !important; font-weight:750;
  line-height:1.22; text-align:center;
}
.quotation-page .action-btn svg, .quotation-page .quotation-row-actions .btn svg { flex:none; }
.quotation-page .quotation-date-line { display:flex; align-items:center; gap:.43rem; }
.quotation-page .quotation-date-line svg { flex:0 0 auto; color:#8da2ba; }
.quotation-page .quotation-table { min-width:1450px; table-layout:fixed; }
.quotation-page .quotation-table th:nth-child(1), .quotation-page .quotation-table td:nth-child(1) { width:13%; }
.quotation-page .quotation-table th:nth-child(2), .quotation-page .quotation-table td:nth-child(2) { width:11%; }
.quotation-page .quotation-table th:nth-child(3), .quotation-page .quotation-table td:nth-child(3) { width:12%; }
.quotation-page .quotation-table th:nth-child(4), .quotation-page .quotation-table td:nth-child(4) { width:12%; }
.quotation-page .quotation-table th:nth-child(5), .quotation-page .quotation-table td:nth-child(5) { width:10%; }
.quotation-page .quotation-table th:nth-child(6), .quotation-page .quotation-table td:nth-child(6) { width:42%; }
.quotation-page .quotation-table td { vertical-align:top !important; }
.quotation-page .quotation-table-wrap { overflow-x:auto; }
.quotation-page .quotation-table .quotation-row-actions .action-btn { flex:0 0 auto; white-space:nowrap; }
.quotation-page .quotation-table .quotation-row-actions > a { flex:0 0 auto !important; width:auto !important; margin-top:0 !important; white-space:nowrap; }
/* Khusus status Menunggu Approval pada tampilan tabel: badge harus memuat seluruh teks. */
.quotation-page .quotation-table .quotation-status-badge--waiting {
  width:max-content;
  max-width:none !important;
  padding:.26rem .38rem !important;
  gap:.2rem !important;
  font-size:.62rem !important;
}
.quotation-page .quotation-table .quotation-status-badge--waiting svg {
  width:12px;
  height:12px;
}
.quotation-page .quotation-table .quotation-detail-action { margin-right:3px; }
.quotation-page .action-btn.quotation-detail-action { min-width:86px; min-height:36px; margin-left:3px; padding:0 13px !important; border:1px solid #dbe3ec !important; border-radius:10px !important; background:#fff !important; color:#102b4e !important; font-size:11px !important; font-weight:750 !important; gap:7px; white-space:nowrap; }
.quotation-page .action-btn.quotation-detail-action:hover:not(:disabled) { border-color:#f0a800 !important; background:#fffbeb !important; color:#102b4e !important; }
/* Detail: navigation outside the card, yellow-soft button, subtle document hierarchy. */
.quotation-detail-page .quotation-detail-content > div { max-width:1280px !important; }
.quotation-detail-page .quotation-detail-back {
  display:inline-flex; align-items:center; justify-content:center; gap:.55rem;
  min-height:43px; padding:.65rem 1rem; margin-bottom:1.1rem;
  border:1px solid #f5cd6b; border-radius:12px;
  background:linear-gradient(180deg,#fffaf0,#fff1cf);
  color:#946000; font-size:.76rem; font-weight:800;
  box-shadow:0 4px 12px rgba(205,140,0,.06);
  cursor:pointer;
}
.quotation-detail-page .quotation-detail-back:hover { background:#ffedbc; border-color:#ecb73b; }
.quotation-detail-page .quotation-detail-hero {
  background:linear-gradient(110deg,#f4f9ff 0%,#fff 54%,#fff9eb 100%) !important;
  border:1px solid #e2eaf3 !important;
  border-radius:18px !important; padding:1.5rem !important;
}
.quotation-detail-page .quotation-detail-heading { display:flex; align-items:center; gap:1rem; min-width:0; }
.quotation-detail-page .quotation-detail-heading-icon {
  display:inline-flex; align-items:center; justify-content:center; flex:0 0 60px;
  width:60px; height:60px; border:1px solid #f9dfa0; border-radius:16px;
  background:#fff2cb; color:#b97c00;
}
.quotation-detail-page .quotation-detail-document { border-radius:18px !important; }
.quotation-detail-page .quotation-detail-document > div:first-child { background:#fafcff; }
.quotation-detail-page .quotation-detail-table tbody tr:hover { background:#fcfdff; }
@media (max-width:700px) {
  .quotation-detail-page .quotation-detail-heading { align-items:flex-start; }
  .quotation-detail-page .quotation-detail-heading-icon { width:44px;height:44px;flex-basis:44px; }
  .quotation-detail-page .quotation-detail-hero { padding:1.05rem !important; }
}

@media (prefers-reduced-motion: reduce) {
  .quotation-page *, .quotation-detail-page * { transition:none !important; animation:none !important; scroll-behavior:auto !important; }
}


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

/**
 * ==========================================
 * HALAMAN UTAMA QUOTATION
 * ==========================================
 *
 * Digunakan untuk:
 * - Menampilkan daftar Quotation
 * - Mengelola pencarian dan filter
 * - Mengatur tampilan Grid dan Tabel
 * - Mengambil data Opportunity
 * - Membuka detail Quotation
 */
export function QuotationListPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  /**
   * Mengambil ID quotation dari URL.
   *
   * Contoh:
   * /crm-sales/quotations/10
   */
  const quotationDetailId = id ? Number(id) : null;

  /**
   * Mengambil detail Quotation ketika
   * pengguna membuka halaman detail.
   */
  const {
    data: quotationDetail,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorData,
  } = useQuotation(quotationDetailId ?? 0);

  /**
   * ==========================================
   * STATE HALAMAN QUOTATION
   * ==========================================
   */

  // Pilihan tampilan Grid atau Tabel
  const [viewMode, setViewMode] =
    useState<ViewMode>("grid");

  // Halaman pagination
  const [quotPage, setQuotPage] = useState(1);
  const [perPage, setPerPage] = useState(CRM_DEFAULT_PER_PAGE);

  // Kata kunci pencarian
  const [search, setSearch] = useState("");

  // Filter status
  const [statusFilter, setStatusFilter] =
    useState<QuotationStatus | "">("");

  /**
   * ==========================================
   * MENGAMBIL DAFTAR QUOTATION
   * ==========================================
   *
   * Menggunakan pagination backend
   * sesuai jumlah data per halaman yang dipilih.
   */
  const {
    data: quotData,
    isLoading: quotLoading,
  } = useQuotationList({
    page: quotPage,
    per_page: perPage,
    status: statusFilter || undefined,
  });

  /**
   * ==========================================
   * MENGAMBIL SEMUA OPPORTUNITY
   * ==========================================
   *
   * Data Opportunity diperlukan untuk:
   * - Nama layanan
   * - Nama customer atau lead
   * - Informasi sales
   * - Menghubungkan Quotation
   *   dengan Opportunity
   */
  const {
    data: allPickerOpportunities = [],
    isLoading: pendingOppLoading,
    isError: pendingOppError,
  } = useQuery({
    queryKey: [
      "opportunities",
      "list",
      "quotation-picker-all",
    ],

    queryFn: async (): Promise<Opportunity[]> => {
      const results: Opportunity[] = [];
      let page = 1;

      while (true) {
        const response = await opportunityApi.list({
          page,
          per_page: 100,
        });

        const pagination = response.data;
        const items = pagination.data ?? [];

        results.push(...items);

        if (
          page >= pagination.last_page ||
          items.length === 0
        ) {
          break;
        }

        page += 1;
      }

      return results;
    },

    staleTime: 30_000,
  });

  /**
   * ==========================================
   * MENGAMBIL SEMUA QUOTATION
   * ==========================================
   *
   * Digunakan untuk:
   * - Pencarian seluruh data
   * - Menghitung Opportunity yang
   *   sudah mempunyai Quotation
   *
   * Semua halaman diambil sehingga
   * pencarian tidak terbatas pada
   * 15 Quotation yang sedang tampil.
   */
  const {
    data: allPickerQuotations = [],
    isLoading: pendingQuotLoading,
    isError: pendingQuotError,
  } = useQuery({
    queryKey: [
      "quotations",
      "list",
      "quotation-picker-all",
    ],

    queryFn: async (): Promise<Quotation[]> => {
      const results: Quotation[] = [];
      let page = 1;

      while (true) {
        const response = await quotationApi.list({
          page,
          per_page: 100,
        });

        const pagination = response.data;
        const items = pagination.data ?? [];

        results.push(...items);

        if (
          page >= pagination.last_page ||
          items.length === 0
        ) {
          break;
        }

        page += 1;
      }

      return results;
    },

    staleTime: 0,
    refetchOnMount: "always",
  });

  /**
   * ==========================================
   * STATUS LOADING DAN ERROR
   * ==========================================
   */
  const pendingCountLoading =
    pendingOppLoading || pendingQuotLoading;

  const pendingCountError =
    pendingOppError || pendingQuotError;

  /**
   * ==========================================
   * MAPPING OPPORTUNITY BERDASARKAN ID
   * ==========================================
   *
   * Map digunakan untuk menemukan
   * data Opportunity yang terhubung
   * dengan setiap Quotation.
   *
   * Field assigned_to dari Opportunity
   * nantinya dipakai untuk menampilkan
   * sales penanggung jawab di modal Lose.
   */
  const opportunityById = new Map<
    number,
    Opportunity
  >(
    allPickerOpportunities.map((opp) => [
      Number(opp.id),
      opp,
    ])
  );

  /**
   * ==========================================
   * PENCARIAN QUOTATION
   * ==========================================
   */
  const normalizedSearch = search.trim();

  const isSearching =
    normalizedSearch.length > 0;

  const matchedQuotations = isSearching
    ? allPickerQuotations
        .filter((qt) => {
          const opportunity =
            qt.opportunity_id == null
              ? undefined
              : opportunityById.get(
                  Number(qt.opportunity_id)
                );

          return (
            (!statusFilter ||
              qt.status === statusFilter) &&
            matchesQuotationSearch(
              qt,
              opportunity,
              normalizedSearch
            )
          );
        })
        .sort(
          (a, b) =>
            Number(b.id) - Number(a.id)
        )
    : [];

  /**
   * ==========================================
   * DATA QUOTATION YANG DITAMPILKAN
   * ==========================================
   *
   * Jika sedang mencari:
   * gunakan data hasil pencarian.
   *
   * Jika tidak:
   * gunakan pagination dari backend.
   */
  const quotations: Quotation[] = isSearching
    ? matchedQuotations.slice(
        (quotPage - 1) * perPage,
        quotPage * perPage
      )
    : (
        quotData as
          | PaginatedResponse<Quotation>
          | undefined
      )?.data ?? [];

  /**
   * Total Quotation sesuai pencarian
   * atau pagination API.
   */
  const quotTotal = isSearching
    ? matchedQuotations.length
    : (
        quotData as
          | PaginatedResponse<Quotation>
          | undefined
      )?.total ?? 0;

  /**
   * Total halaman pagination.
   */
  const quotLastPage = isSearching
    ? Math.max(
        1,
        Math.ceil(quotTotal / perPage)
      )
    : (
        quotData as
          | PaginatedResponse<Quotation>
          | undefined
      )?.last_page ?? 1;

  /**
   * Loading daftar Quotation.
   */
  const listingLoading = isSearching
    ? pendingCountLoading
    : quotLoading;

  const listingError =
    isSearching && pendingCountError;

  /**
   * Jumlah Quotation expired
   * pada halaman yang tampil.
   */
  const expiredCount = quotations.filter(
    (qt) => qt.is_expired
  ).length;

  /**
   * ==========================================
   * STATISTIK OPPORTUNITY
   * ==========================================
   *
   * Digunakan untuk kartu statistik:
   *
   * 1. Opportunity belum memiliki Quotation
   * 2. Opportunity sudah memiliki Quotation
   */

  const quotedOpportunityIds = new Set(
    allPickerQuotations
      .filter(
        (qt) => qt.opportunity_id != null
      )
      .map((qt) =>
        Number(qt.opportunity_id)
      )
  );

  /**
   * Satu Opportunity hanya dihitung
   * satu kali walaupun memiliki
   * lebih dari satu Quotation.
   */
  const quotedOpportunityCount =
    allPickerOpportunities.filter((opp) =>
      quotedOpportunityIds.has(
        Number(opp.id)
      )
    ).length;

  const unquotedOpportunityCount =
    allPickerOpportunities.length -
    quotedOpportunityCount;

  /**
   * ==========================================
   * NAVIGASI QUOTATION
   * ==========================================
   */

  /**
   * Membuka form pembuatan Quotation.
   *
   * Jika oppId diberikan, Opportunity
   * tersebut akan dipilih melalui
   * query parameter.
   */
  function openQuotationForm(
    oppId?: number
  ) {
    navigate(
      oppId
        ? `/crm-sales/quotations/new?opportunity_id=${oppId}`
        : "/crm-sales/quotations/new"
    );
  }

  /**
   * Membuka form edit Quotation.
   *
   * Data Quotation dikirim melalui
   * React Router state.
   */
  function openEditQuotation(
    quotation: Quotation
  ) {
    navigate(
      "/crm-sales/quotations/new",
      {
        state: {
          editQuotation: quotation,
        },
      }
    );
  }

  /**
   * Membuka halaman detail Quotation.
   */
  function openQuotationDetail(
    quotationId: number
  ) {
    navigate(
      `/crm-sales/quotations/${quotationId}`
    );
  }

  /**
   * ==========================================
   * HALAMAN DETAIL QUOTATION
   * ==========================================
   *
   * Jika URL memiliki ID Quotation,
   * halaman akan menampilkan detail,
   * bukan daftar Quotation.
   *
   * Tampilan detail lengkap dilanjutkan
   * pada BAGIAN 3.
   */

  if (quotationDetailId) {
    if (detailLoading) {
      return (
        <div style={{
          minHeight: "100%",
          background: UI.page,
          padding: "2rem",
        }}>
          <LoadingState />
        </div>
      );
    }

    if (detailError) {
      return (
        <div style={{
          minHeight: "100%",
          background: UI.page,
          padding: "2rem",
        }}>
          <ErrorState
            message={extractErrorMessage(detailErrorData)}
          />
        </div>
      );
    }

    if (!quotationDetail) return null;

    const qt = quotationDetail;

    const statusColor = QUOT_STATUS_COLORS[qt.status] ?? {
      bg: "#f3f4f6",
      color: "#6b7280",
    };

    const thStyle = {
      padding: "0.85rem 0.45rem",
      color: UI.slate,
      fontSize: "0.66rem",
      fontWeight: 800,
      textAlign: "right",
      textTransform: "uppercase",
    } as const;

    return (
      <div className="quotation-detail-page" style={{
        minHeight: "100%",
        background: UI.page,
      }}>
        <style>{QUOTATION_UI_STYLES}</style>
        <PageHeader
          title="Quotation"
          subtitle="Dokumen penawaran harga ke pelanggan."
          containerClassName="px-7 pt-5 pb-2"
        />

        <div className="quotation-detail-content" style={{ padding: "0 2rem 3rem" }}>
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>

            {/* Tombol Kembali */}
            <button
              type="button"
              onClick={() => navigate("/crm-sales/quotations")}
              className="quotation-detail-back crm-msdc-back-button"
            >
              <ArrowLeft size={17} aria-hidden="true" />
              Kembali ke Quotation
            </button>

            {/* Header Detail */}
            <div className="quotation-detail-hero" style={{
              marginBottom: "1rem",
              padding: "1.35rem 1.5rem",
              border: `1px solid ${UI.border}`,
              borderRadius: 12,
              background: UI.white,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap",
              }}>
                <div className="quotation-detail-heading">
                  <span className="quotation-detail-heading-icon" aria-hidden="true"><FileText size={26} /></span>
                  <div>
                  <div style={{
                    marginBottom: "0.35rem",
                    color: UI.slate,
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}>
                    Detail Quotation
                  </div>

                  <div style={{
                    color: UI.navyText,
                    fontSize: "1.35rem",
                    fontWeight: 900,
                    lineHeight: 1.2,
                  }}>
                    {qt.quotation_number}
                  </div>

                  <div style={{
                    marginTop: "0.45rem",
                    color: UI.slate,
                    fontSize: "0.72rem",
                  }}>
                    Tanggal Penawaran:{" "}
                    {formatDate(qt.quotation_date)}
                    {" · "}
                    Berlaku s/d:{" "}
                    {formatDate(qt.valid_until)}

                    {qt.is_expired && (
                      <span style={{
                        marginLeft: "0.45rem",
                        color: UI.red,
                        fontWeight: 800,
                      }}>
                        · Expired
                      </span>
                    )}
                  </div>
                  </div>
                </div>

                {/* Status Quotation */}
                <span className="quotation-status-badge"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.35rem 0.85rem",
                    borderRadius: 999,
                    background: statusColor.bg,
                    color: statusColor.color,
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {qt.status === "waiting_approval" && <Clock size={13} aria-hidden="true" />}
                  {QUOT_STATUS_LABELS[qt.status] ?? qt.status}
                </span>

              </div>
            </div>

            {/* Isi Dokumen Penawaran */}
            <div className="quotation-detail-document" style={{
              overflow: "hidden",
              border: `1px solid ${UI.border}`,
              borderRadius: 12,
              background: UI.white,
            }}>

              {/* Informasi Customer */}
              <div style={{
                padding: "1.15rem 1.5rem",
                borderBottom: `1px solid ${UI.border}`,
              }}>
                <div style={{
                  marginBottom: "0.3rem",
                  color: UI.slate,
                  fontSize: "0.66rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                }}>
                  Kepada
                </div>

                <div style={{
                  color: UI.navyText,
                  fontSize: "0.82rem",
                  fontWeight: 800,
                }}>
                  {qt.customer?.company_name ?? "—"}
                </div>
              </div>

              {/* Tabel Layanan */}
              <div style={{
                padding: "0 1.5rem",
                overflowX: "auto",
              }}>
                <table className="quotation-detail-table" style={{
                  width: "100%",
                  minWidth: 650,
                  tableLayout: "fixed",
                  borderCollapse: "collapse",
                  fontSize: "0.72rem",
                }}>
                  <thead>
                    <tr style={{
                      borderBottom: `1px solid ${UI.border}`,
                    }}>
                      <th style={{
                        ...thStyle,
                        width: "42%",
                        textAlign: "left",
                      }}>
                        Layanan / Deskripsi
                      </th>

                      <th style={{
                        ...thStyle,
                        width: "10%",
                      }}>
                        Qty
                      </th>

                      <th style={{
                        ...thStyle,
                        width: "18%",
                      }}>
                        Harga Satuan
                      </th>

                      <th style={{
                        ...thStyle,
                        width: "12%",
                      }}>
                        Diskon
                      </th>

                      <th style={{
                        ...thStyle,
                        width: "18%",
                      }}>
                        Jumlah
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {(qt.lines ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: "1.5rem 0.5rem",
                            color: UI.slate,
                            textAlign: "center",
                          }}
                        >
                          Belum ada baris layanan.
                        </td>
                      </tr>
                    ) : (
                      (qt.lines ?? []).map((line) => (
                        <tr
                          key={line.id}
                          style={{
                            borderBottom:
                              `1px solid ${UI.border}`,
                          }}
                        >
                          <td style={{
                            padding: "0.85rem 0.45rem",
                            color: UI.navyText,
                            fontWeight: 700,
                            overflowWrap: "anywhere",
                          }}>
                            {line.description}
                          </td>

                          <td style={{
                            padding: "0.85rem 0.45rem",
                            color: UI.navyText,
                            textAlign: "right",
                          }}>
                            {formatNumber(line.quantity, 2)}
                          </td>

                          <td style={{
                            padding: "0.85rem 0.45rem",
                            color: UI.navyText,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}>
                            {formatCurrency(line.unit_price)}
                          </td>

                          <td style={{
                            padding: "0.85rem 0.45rem",
                            color: UI.slate,
                            textAlign: "right",
                          }}>
                            {Number(line.discount_pct) > 0
                              ? `${formatNumber(
                                  line.discount_pct,
                                  1
                                )}%`
                              : "—"}
                          </td>

                          <td style={{
                            padding: "0.85rem 0.45rem",
                            color: UI.navyText,
                            fontWeight: 800,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}>
                            {formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Ringkasan Total */}
              <div style={{
                display: "flex",
                justifyContent: "flex-end",
                padding: "1.25rem 1.5rem",
              }}>
                <div style={{
                  width: "100%",
                  maxWidth: 330,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.55rem",
                }}>

                  {/* Subtotal */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    color: UI.slate,
                    fontSize: "0.8rem",
                  }}>
                    <span>Subtotal</span>
                    <span style={{
                      color: UI.navyText,
                      fontWeight: 700,
                    }}>
                      {formatCurrency(qt.subtotal)}
                    </span>
                  </div>

                  {/* Diskon */}
                  {Number(qt.discount_amount) > 0 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      color: UI.slate,
                      fontSize: "0.8rem",
                    }}>
                      <span>Diskon</span>
                      <span style={{
                        color: UI.red,
                        fontWeight: 700,
                      }}>
                        − {formatCurrency(qt.discount_amount)}
                      </span>
                    </div>
                  )}

                  {/* Pajak */}
                  {Number(qt.tax_amount) > 0 && (
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      color: UI.slate,
                      fontSize: "0.8rem",
                    }}>
                      <span>Pajak</span>
                      <span style={{
                        color: UI.navyText,
                        fontWeight: 700,
                      }}>
                        {formatCurrency(qt.tax_amount)}
                      </span>
                    </div>
                  )}

                  {/* Total Akhir */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginTop: "0.15rem",
                    paddingTop: "0.7rem",
                    borderTop: `2px solid ${UI.border}`,
                  }}>
                    <span style={{
                      color: UI.navyText,
                      fontSize: "0.82rem",
                      fontWeight: 900,
                    }}>
                      Total
                    </span>

                    <span style={{
                      color: UI.navy,
                      fontSize: "0.82rem",
                      fontWeight: 900,
                    }}>
                      {formatCurrency(qt.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* =================================
                  FITUR BARU: INFORMASI LOSE
                  ================================= */}
              {qt.status === "lost" && (
                <div style={{
                  margin: "0 1.5rem 1.5rem",
                  padding: "1rem",
                  background: "#fff1f2",
                  border: "1px solid #fecaca",
                  borderRadius: 9,
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#b91c1c",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    marginBottom: "0.85rem",
                  }}>
                    <AlertTriangle size={17} />
                    Penawaran Lose — Ditolak Client
                  </div>

                  <div style={{
                    display: "grid",
                    gap: "0.75rem",
                    fontSize: "0.75rem",
                    color: UI.navyText,
                  }}>
                    <div>
                      <div style={{
                        fontWeight: 800,
                        marginBottom: 4,
                      }}>
                        Alasan Lose
                      </div>
                      <div style={{
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
                      }}>
                        {qt.lost_reason ||
                          "Alasan belum tersedia."}
                      </div>
                    </div>

                    <div>
                      <div style={{
                        fontWeight: 800,
                        marginBottom: 4,
                      }}>
                        Dilakukan Oleh
                      </div>
                      <div>
                        {qt.lost_by_name ??
                          (qt.lost_by != null
                            ? `ID User: ${qt.lost_by}`
                            : "Belum tersedia")}
                      </div>
                    </div>

                    <div>
                      <div style={{
                        fontWeight: 800,
                        marginBottom: 4,
                      }}>
                        Waktu Aksi
                      </div>
                      <div>
                        {qt.lost_at
                          ? formatDate(qt.lost_at)
                          : "Belum tersedia"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informasi Penolakan Approval Internal */}
              {qt.status === "draft" &&
                !!qt.internal_rejected_at && (
                  <div style={{
                    margin: "0 1.5rem 1.5rem",
                    padding: "0.9rem 1rem",
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: 9,
                    fontSize: "0.75rem",
                  }}>
                    <div style={{
                      color: "#92400e",
                      fontWeight: 800,
                      marginBottom: "0.4rem",
                    }}>
                      Ditolak Approval Internal
                    </div>

                    <div style={{
                      color: UI.navyText,
                      whiteSpace: "pre-wrap",
                    }}>
                      {qt.internal_rejection_reason ||
                        "Alasan penolakan tidak tersedia."}
                    </div>
                  </div>
                )}

              {/* Catatan Quotation */}
              {qt.notes && (
                <div style={{
                  margin: "0 1.5rem 1.5rem",
                  padding: "0.85rem 1rem",
                  border: `1px solid ${UI.border}`,
                  borderRadius: 9,
                  background: UI.light,
                }}>
                  <div style={{
                    marginBottom: "0.3rem",
                    color: UI.slate,
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}>
                    Catatan
                  </div>

                  <div style={{
                    color: UI.navyText,
                    fontSize: "0.72rem",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                  }}>
                    {qt.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * ==========================================
   * HALAMAN DAFTAR QUOTATION
   * ==========================================
   *
   * Tampilan Grid dan Tabel dimulai
   * pada BAGIAN 4.
   */

  return (
    <div
      className="crm-quotation-list-root"
      style={{
        minHeight: "100%",
        background: UI.page,
      }}
    >
      <style>{`
        .quotation-page,
        .quotation-page button,
        .quotation-page input,
        .quotation-page select,
        .quotation-page table {
          font-family: inherit;
        }

        .quotation-page .quotation-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .quotation-page .quotation-table {
          width: 100%;
          min-width: 1000px;
          table-layout: fixed;
          border-collapse: collapse;
          background: #fff;
        }

        .quotation-page .quotation-table th {
          padding: 0.7rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          background: #fff;
          color: #64748b;
          font-size: 0.64rem;
          font-weight: 700;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .quotation-page .quotation-table td {
          padding: 0.78rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #16213d;
          font-size: 0.72rem;
          vertical-align: middle;
          overflow-wrap: anywhere;
        }

        .quotation-page .quotation-table th:nth-child(1),
        .quotation-page .quotation-table td:nth-child(1) {
          width: 15%;
        }

        .quotation-page .quotation-table th:nth-child(2),
        .quotation-page .quotation-table td:nth-child(2) {
          width: 17%;
        }

        .quotation-page .quotation-table th:nth-child(3),
        .quotation-page .quotation-table td:nth-child(3) {
          width: 15%;
        }

        .quotation-page .quotation-table th:nth-child(4),
        .quotation-page .quotation-table td:nth-child(4) {
          width: 13%;
        }

        .quotation-page .quotation-table th:nth-child(5),
        .quotation-page .quotation-table td:nth-child(5) {
          width: 10%;
        }

        .quotation-page .quotation-table th:nth-child(6),
        .quotation-page .quotation-table td:nth-child(6) {
          width: 30%;
        }

        .quotation-page .quotation-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .quotation-page .quotation-table tbody tr:hover {
          background: #fbfcfe;
        }

        .quotation-page .quotation-card {
          transition:
            transform .18s ease,
            box-shadow .18s ease,
            border-color .18s ease;
        }

        .quotation-page .quotation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(9, 39, 71, .08) !important;
        }

        .quotation-page .action-btn {
          transition:
            background .15s ease,
            border-color .15s ease,
            transform .15s ease;
        }

        .quotation-page .action-btn:hover {
          transform: translateY(-1px);
        }

        @media (max-width: 980px) {
          .quotation-page .pipeline-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 760px) {
          .quotation-page .quotation-content {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }

          .quotation-page .quotation-toolbar {
            flex-wrap: wrap;
            align-items: stretch !important;
          }

          .quotation-page .pipeline-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      <style>{QUOTATION_UI_STYLES}</style>

      <div className="quotation-page">
        <PageHeader
          title="Quotations"
          subtitle="Daftar dokumen penawaran harga ke customer."
          containerClassName="px-7 pt-5 pb-2"
        />

        <div
          className="quotation-content"
          style={{
            padding: "0 2rem 2rem",
          }}
        >
          {/* Ringkasan Quotation dan Opportunity */}
          <div className="quotation-summary">
            <div className="quotation-kpis" role="status" aria-live="polite">
              <div className="quotation-kpi">
                <div className="quotation-kpi__heading">
                  <span className="quotation-kpi__icon quotation-kpi__icon--blue"><FileText size={19} /></span>
                  <span className="quotation-kpi__label">Total Quotation</span>
                </div>
                <div className="quotation-kpi__value">{quotTotal}</div>
                <div className="quotation-kpi__note">Penawaran sesuai pencarian dan filter</div>
              </div>

              <div className="quotation-kpi">
                <div className="quotation-kpi__heading">
                  <span className="quotation-kpi__icon quotation-kpi__icon--amber"><Clock size={19} /></span>
                  <span className="quotation-kpi__label">Opportunity Belum Ada Quotation</span>
                </div>
                <div className="quotation-kpi__value">
                  {pendingCountLoading ? "..." : pendingCountError ? "—" : unquotedOpportunityCount}
                </div>
                <div className="quotation-kpi__note">Menunggu dibuatkan penawaran</div>
              </div>

              <div className="quotation-kpi">
                <div className="quotation-kpi__heading">
                  <span className="quotation-kpi__icon quotation-kpi__icon--green"><CheckCircle2 size={19} /></span>
                  <span className="quotation-kpi__label">Opportunity Sudah Ada Quotation</span>
                </div>
                <div className="quotation-kpi__value">
                  {pendingCountLoading ? "..." : pendingCountError ? "—" : quotedOpportunityCount}
                </div>
                <div className="quotation-kpi__note">Sudah memiliki penawaran</div>
              </div>

              <div className="quotation-kpi">
                <div className="quotation-kpi__heading">
                  <span className="quotation-kpi__icon quotation-kpi__icon--rose"><AlertTriangle size={19} /></span>
                  <span className="quotation-kpi__label">Quotation Expired</span>
                </div>
                <div className="quotation-kpi__value">{expiredCount}</div>
                <div className="quotation-kpi__note">Pada halaman ini · perlu follow up</div>
              </div>
            </div>
          </div>

          {/* Peringatan Quotation Expired */}
          {expiredCount > 0 && (
            <div
              className="quotation-expired-alert"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                padding: "0.8rem 0.95rem",
                marginBottom: "1rem",
                border: "1px solid #FDE68A",
                borderRadius: 10,
                background: "#FFFBEB",
                color: "#92400E",
              }}
            >
              <AlertTriangle size={16} />

              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                }}
              >
                {expiredCount} quotation expired pada
                halaman ini — perlu follow up
              </span>
            </div>
          )}

          {/* ====================================
              KONTAINER DAFTAR QUOTATION
              ==================================== */}
          <div
            className="quotation-list-shell"
            style={{
              overflow: "hidden",
              border: `1px solid ${UI.border}`,
              borderRadius: 12,
              background: UI.white,
              boxShadow:
                "0 5px 18px rgba(9,39,71,0.05)",
            }}
          >
            {/* Toolbar */}
            <div
              className="quotation-toolbar"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.1rem",
                borderBottom: `1px solid ${UI.border}`,
                background: UI.white,
              }}
            >
              {/* Pencarian */}
              <div
                className="quotation-search-field"
                style={{
                  flex: 1,
                  minWidth: 180,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0 0.85rem",
                  minHeight: 40,
                  border: `1px solid ${UI.border}`,
                  borderRadius: 9,
                  background: UI.light,
                }}
              >
                <Search
                  size={16}
                  color={UI.slate}
                />

                <input
                  placeholder="Cari nomor quotation, customer, lead, atau layanan..."
                  aria-label="Cari quotation"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setQuotPage(1);
                  }}
                  style={{
                    width: "100%",
                    border: 0,
                    outline: "none",
                    background: "transparent",
                    color: UI.navyText,
                    fontSize: "0.75rem",
                  }}
                />
              </div>

              {/* Filter Status */}
              <select
                className="quotation-status-filter"
                aria-label="Filter status quotation"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value as
                      | QuotationStatus
                      | ""
                  );
                  setQuotPage(1);
                }}
                style={{
                  width: 190,
                  minHeight: 40,
                  padding: "0 0.75rem",
                  border: `1px solid ${UI.border}`,
                  borderRadius: 9,
                  background: UI.white,
                  color: UI.navyText,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              >
                <option value="">
                  Semua Status
                </option>

                {Object.entries(
                  QUOT_STATUS_LABELS
                ).filter(([value]) => value !== "rejected").map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>

              {/* Pilihan Grid / Tabel */}
              <div
                className="quotation-view-toggle"
                role="group"
                aria-label="Pilihan tampilan quotation"
                style={{
                  display: "flex",
                  gap: 3,
                  alignItems: "center",
                  padding: 3,
                  background: "#F1F5F9",
                  borderRadius: 9,
                }}
              >
                {[
                  {
                    mode: "grid" as ViewMode,
                    label: "Grid",
                    Icon: LayoutGrid,
                  },
                  {
                    mode: "table" as ViewMode,
                    label: "Tabel",
                    Icon: List,
                  },
                ].map(({ mode, label, Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    title={`Lihat sebagai ${label}`}
                    aria-label={`Tampilan ${label}`}
                    aria-pressed={viewMode === mode}
                    onClick={() =>
                      setViewMode(mode)
                    }
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "0.5rem 0.7rem",
                      border: "none",
                      borderRadius: 7,
                      background:
                        viewMode === mode
                          ? UI.white
                          : "transparent",
                      color:
                        viewMode === mode
                          ? UI.navy
                          : UI.slate,
                      boxShadow:
                        viewMode === mode
                          ? "0 1px 4px rgba(0,0,0,0.08)"
                          : "none",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: "0.72rem",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Buat Quotation */}
              <button
                type="button"
                onClick={() =>
                  openQuotationForm()
                }
                className="action-btn quotation-create-button"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                  minHeight: 40,
                  padding: "0.55rem 0.9rem",
                  border: "none",
                  borderRadius: 8,
                  background: UI.orange,
                  color: UI.white,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Plus size={15} />
                Buat Quotation
              </button>
            </div>

            {/* Error Pencarian */}
            {listingError && (
              <ErrorState
                message="Gagal memuat data pencarian quotation atau opportunity. Coba refresh halaman."
              />
            )}

            {/* Loading */}
            {!listingError &&
              listingLoading && (
                <LoadingState />
              )}

            {/* Data Kosong */}
            {!listingError &&
              !listingLoading &&
              quotations.length === 0 && (
                <EmptyState
                  title={
                    isSearching
                      ? "Hasil Tidak Ditemukan"
                      : "Belum Ada Quotation"
                  }
                  subtitle={
                    isSearching
                      ? "Tidak ada quotation sesuai kata kunci dan status yang dipilih."
                      : "Belum ada quotation yang sesuai. Klik + Buat Quotation untuk membuat penawaran baru."
                  }
                />
              )}

            {/* ====================================
                GRID ATAU TABEL
                ==================================== */}
            {!listingError &&
              !listingLoading &&
              quotations.length > 0 && (
                <>
                  {viewMode === "grid" ? (
                    /* TAMPILAN GRID */
                    <div
                      className="pipeline-grid"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(3, minmax(0, 1fr))",
                        gap: "1rem",
                        padding: "1rem",
                      }}
                    >
                      {quotations.map((qt) => (
                        <QuotationOfferCard
                          key={qt.id}
                          qt={qt}
                          opportunity={
                            qt.opportunity_id == null
                              ? undefined
                              : opportunityById.get(
                                  Number(
                                    qt.opportunity_id
                                  )
                                )
                          }
                          onEdit={
                            openEditQuotation
                          }
                          onView={
                            openQuotationDetail
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    /* TAMPILAN TABEL */
                    <div className="quotation-table-wrap">
                      <table className="quotation-table">
                        <thead>
                          <tr>
                            <th>
                              Nomor Quotation
                            </th>
                            <th>
                              Opportunity
                            </th>
                            <th>
                              Customer / Lead
                            </th>
                            <th>
                              Total Penawaran
                            </th>
                            <th>
                              Status
                            </th>
                            <th>
                              Aksi
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {quotations.map(
                            (qt) => (
                              <QuotationTableRow
                                key={qt.id}
                                qt={qt}
                                opportunity={
                                  qt.opportunity_id ==
                                  null
                                    ? undefined
                                    : opportunityById.get(
                                        Number(
                                          qt.opportunity_id
                                        )
                                      )
                                }
                                onEdit={
                                  openEditQuotation
                                }
                                onView={
                                  openQuotationDetail
                                }
                              />
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  <CrmPagination
                    currentPage={quotPage}
                    lastPage={quotLastPage}
                    total={quotTotal}
                    perPage={perPage}
                    onPageChange={setQuotPage}
                    onPerPageChange={setPerPage}
                  />
                </>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ==========================================
 * BAGIAN 5 AKAN DILANJUTKAN DI BAWAH
 * ==========================================
 *
 * Komponen:
 * - QuotationOfferCard
 * - QuotationTableRow
 * - Tombol Lose
 * - QuotationLoseModal
 */

/**
 * ==========================================
 * QUOTATION OFFER CARD
 * ==========================================
 *
 * Tampilan Quotation dalam bentuk Grid.
 *
 * Fitur:
 * - Menampilkan nomor Quotation
 * - Menampilkan nama Opportunity
 * - Menampilkan Customer / Lead
 * - Menampilkan total penawaran
 * - Menampilkan status
 * - Mengajukan Approval
 * - Menandai Lose
 * - Membuka detail Quotation
 * - Mengedit Quotation
 * - Menjalankan aksi tambahan
 */
function QuotationOfferCard({
  qt,
  opportunity,
  onEdit,
  onView,
}: {
  qt: Quotation;
  opportunity?: Opportunity;
  onEdit: (quotation: Quotation) => void;
  onView: (id: number) => void;
}) {
  const approvalMutation = useSubmitQuotationApproval();

  // State untuk membuka form Lose
  const [showLose, setShowLose] = useState(false);

  const statusColor = QUOT_STATUS_COLORS[qt.status] ?? {
    bg: "#f3f4f6",
    color: "#6b7280",
  };

  const customerName =
    opportunity?.customer?.company_name ??
    opportunity?.lead?.company_name ??
    opportunity?.opportunity_number ??
    "—";

  /**
   * Mengajukan Quotation ke Approval Internal.
   */
  async function handleApproval() {
    if (
      !confirm(
        `Ajukan quotation ${qt.quotation_number} untuk approval Manager, EPM1, lalu EPM2?`
      )
    ) {
      return;
    }

    try {
      await approvalMutation.mutateAsync({
        id: qt.id,
        quotation: qt,
      });

      alert(
        "Quotation berhasil diajukan untuk approval."
      );
    } catch (err) {
      alert(
        `Gagal mengajukan approval: ${extractErrorMessage(err)}`
      );
    }
  }

  return (
    <>
      <div
        className="quotation-card"
        style={{
          overflow: "hidden",
          border: `1px solid ${UI.border}`,
          borderRadius: 12,
          background: UI.white,
          boxShadow: "0 6px 18px rgba(9,39,71,0.06)",
        }}
      >
        {/* Garis bagian atas kartu */}
        <div
          style={{
            height: 4,
            background:
              qt.status === "lost"
                ? UI.red
                : UI.navy,
          }}
        />

        <div
          style={{
            padding: "0.95rem 1rem",
          }}
        >
          {/* Nomor dan Status */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              marginBottom: "0.4rem",
            }}
          >
            <span
              style={{
                fontSize: "0.66rem",
                color: UI.navyText,
                fontWeight: 800,
              }}
            >
              {qt.quotation_number}
            </span>

            <span className="quotation-status-badge" style={{ background: statusColor.bg, color: statusColor.color, flexShrink: 0 }}>
              {qt.status === "waiting_approval" && <Clock size={13} aria-hidden="true" />}
              {QUOT_STATUS_LABELS[qt.status] ?? qt.status}
            </span>
          </div>

          {/* Nama Opportunity */}
          <div
            style={{
              fontSize: "0.82rem",
              fontWeight: 800,
              color: UI.navyText,
              marginBottom: "0.4rem",
            }}
          >
            {opportunity?.name ??
              `Penawaran ${qt.quotation_number}`}
          </div>

          {/* Customer / Lead */}
          {opportunity && (
            <div
              style={{
                color: UI.slate,
                fontSize: "0.72rem",
                marginBottom: "0.5rem",
              }}
            >
              {customerName}
            </div>
          )}

          {/* Total Penawaran */}
          <div
            style={{
              padding: "0.75rem",
              border: `1px solid ${UI.border}`,
              borderRadius: 9,
              background: UI.light,
              marginBottom: "0.7rem",
            }}
          >
            <div
              style={{
                fontSize: "0.66rem",
                color: UI.slateLight,
                fontWeight: 700,
              }}
            >
              TOTAL PENAWARAN
            </div>

            <div
              style={{
                color: UI.navy,
                fontSize: "1rem",
                fontWeight: 900,
              }}
            >
              {formatCurrency(Number(qt.total_amount))}
            </div>
          </div>

          {/* Tanggal Penawaran */}
          <div className="quotation-date-line"
            style={{
              fontSize: "0.71rem",
              color: UI.slate,
              marginBottom: "0.4rem",
            }}
          >
            <CalendarDays size={14} aria-hidden="true" /> <span>Tanggal: {formatDate(qt.quotation_date)}</span>
          </div>

          {/* Masa Berlaku */}
          <div className="quotation-date-line"
            style={{
              fontSize: "0.71rem",
              color: qt.is_expired ? UI.red : UI.slate,
              marginBottom: "0.7rem",
            }}
          >
            <CalendarDays size={14} aria-hidden="true" /> <span>Berlaku hingga: {formatDate(qt.valid_until)}{qt.is_expired ? " · Expired" : ""}</span>
          </div>

          {/* Penolakan Approval Internal */}
          {qt.status === "draft" &&
            !!qt.internal_rejected_at && (
              <div
                style={{
                  fontSize: "0.68rem",
                  color: UI.red,
                  marginBottom: "0.6rem",
                  lineHeight: 1.5,
                }}
              >
                <XCircle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} aria-hidden="true" /> Ditolak Approval
                {qt.internal_rejection_reason
                  ? `: ${qt.internal_rejection_reason}`
                  : ""}
              </div>
            )}

          {/* Informasi Lose */}
          {qt.status === "lost" && (
            <div
              style={{
                padding: "0.65rem",
                background: "#fff1f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                color: "#991b1b",
                fontSize: "0.7rem",
                marginBottom: "0.7rem",
                lineHeight: 1.5,
              }}
            >
              <strong><XCircle size={13} style={{ verticalAlign: "middle", marginRight: 4 }} aria-hidden="true" /> Penawaran Lose</strong>

              <div
                style={{
                  marginTop: 4,
                  overflowWrap: "anywhere",
                }}
              >
                {qt.lost_reason ??
                  "Alasan penolakan client belum tersedia."}
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="quotation-card-actions"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.45rem",
              alignItems: "center",
            }}
          >
            {/* Ajukan Approval */}
            {qt.status === "draft" &&
              !qt.is_expired &&
              (qt.can_resubmit_approval ? (
                <button
                  type="button"
                  onClick={handleApproval}
                  disabled={approvalMutation.isPending}
                  className="action-btn"
                  style={{
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    background: UI.navy,
                    color: UI.white,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    opacity: approvalMutation.isPending
                      ? 0.6
                      : 1,
                  }}
                >
                  <ClipboardCheck size={14} aria-hidden="true" />
                  {approvalMutation.isPending ? "Mengajukan..." : "Ajukan Approval"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(qt)}
                  className="action-btn"
                  style={{
                    padding: "0.4rem 0.6rem",
                    fontSize: "0.72rem",
                    background: UI.red,
                    color: UI.white,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={14} aria-hidden="true" /> Edit Dulu (Ditolak)
                </button>
              ))}

            {/* FITUR BARU: Tombol Lose */}
            {canLoseQuotation(qt) && (
              <button
                type="button"
                onClick={() => setShowLose(true)}
                className="action-btn"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.4rem 0.65rem",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  background: "#fff1f2",
                  color: UI.red,
                  border: `1px solid ${UI.red}`,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <XCircle size={14} aria-hidden="true" /> Lose
              </button>
            )}

            <ReofferOpportunityButton qt={qt}/>
            {/* Lihat Detail */}
            <button
              type="button"
              onClick={() => onView(qt.id)}
              className="action-btn quotation-detail-action"
              title="Lihat detail quotation"
            >
              <Eye size={14} aria-hidden="true" /> Detail
            </button>

            {/* Edit Quotation */}
            {qt.status === "draft" &&
              qt.can_resubmit_approval && (
                <button
                  type="button"
                  onClick={() => onEdit(qt)}
                  title="Edit Quotation"
                  className="action-btn"
                  style={{
                    padding: "0.4rem",
                    background: UI.white,
                    border: `1px solid ${UI.border}`,
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              )}

            {/* PDF, Kirim, Diterima, Kontrak */}
            <QuotationActionButtons
              qt={qt}
            />
          </div>
        </div>
      </div>

      {/* Modal Lose untuk Grid */}
      {showLose && (
        <QuotationLoseModal
          quotation={qt}
          leadId={qt.lead_id ?? opportunity?.lead_id ?? null}
          onClose={() => setShowLose(false)}
        />
      )}
    </>
  );
}

/**
 * ==========================================
 * QUOTATION TABLE ROW
 * ==========================================
 *
 * Tampilan Quotation dalam bentuk Tabel.
 *
 * Seluruh aksi utama tetap tersedia
 * seperti pada tampilan Grid.
 */
function QuotationTableRow({
  qt,
  opportunity,
  onEdit,
  onView,
}: {
  qt: Quotation;
  opportunity?: Opportunity;
  onEdit: (quotation: Quotation) => void;
  onView: (id: number) => void;
}) {
  const approvalMutation = useSubmitQuotationApproval();

  // State modal Lose pada Tabel
  const [showLose, setShowLose] = useState(false);

  const customerName =
    opportunity?.customer?.company_name ??
    opportunity?.lead?.company_name;

  const statusColor = QUOT_STATUS_COLORS[qt.status] ?? {
    bg: "#f3f4f6",
    color: "#6b7280",
  };

  /**
   * Mengajukan Approval Internal.
   */
  async function handleApproval() {
    if (
      !confirm(
        `Ajukan quotation ${qt.quotation_number} untuk approval Manager, EPM1, lalu EPM2?`
      )
    ) {
      return;
    }

    try {
      await approvalMutation.mutateAsync({
        id: qt.id,
        quotation: qt,
      });

      alert(
        "Quotation berhasil diajukan untuk approval."
      );
    } catch (err) {
      alert(
        `Gagal mengajukan approval: ${extractErrorMessage(err)}`
      );
    }
  }

  return (
    <>
      <tr>
        {/* Nomor Quotation */}
        <td style={{ fontWeight: 800 }}>
          {qt.quotation_number}
        </td>

        {/* Opportunity */}
        <td>
          {opportunity?.name ?? "—"}
        </td>

        {/* Customer / Lead */}
        <td>
          {customerName ?? "—"}
        </td>

        {/* Total Penawaran */}
        <td style={{ fontWeight: 800 }}>
          {formatCurrency(Number(qt.total_amount))}
        </td>

        {/* Status */}
        <td>
          <span className={qt.status === "waiting_approval" ? "quotation-status-badge quotation-status-badge--waiting" : "quotation-status-badge"} style={{ background: statusColor.bg, color: statusColor.color }}>
            {qt.status === "waiting_approval" && <Clock size={13} aria-hidden="true" />}
            {QUOT_STATUS_LABELS[qt.status] ?? qt.status}
          </span>

          {/* Alasan Lose singkat */}
          {qt.status === "lost" &&
            qt.lost_reason && (
              <div
                style={{
                  marginTop: 5,
                  color: UI.red,
                  fontSize: "0.67rem",
                  lineHeight: 1.4,
                  overflowWrap: "anywhere",
                }}
                title={qt.lost_reason}
              >
                {qt.lost_reason}
              </div>
            )}
        </td>

        {/* Tombol Aksi */}
        <td>
          <div className="quotation-row-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              flexWrap: "nowrap",
              width: "max-content",
              minWidth: "max-content",
            }}
          >
            {/* Approval */}
            {qt.status === "draft" &&
              !qt.is_expired &&
              (qt.can_resubmit_approval ? (
                <button
                  type="button"
                  onClick={handleApproval}
                  disabled={approvalMutation.isPending}
                  className="action-btn"
                  style={{
                    padding: "0.4rem 0.6rem",
                    border: "none",
                    borderRadius: 8,
                    background: UI.navy,
                    color: UI.white,
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    opacity: approvalMutation.isPending
                      ? 0.6
                      : 1,
                  }}
                >
                  <ClipboardCheck size={14} aria-hidden="true" />
                  {approvalMutation.isPending ? "Mengajukan..." : "Ajukan Approval"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onEdit(qt)}
                  className="action-btn"
                  style={{
                    padding: "0.4rem 0.6rem",
                    border: "none",
                    borderRadius: 8,
                    background: UI.red,
                    color: UI.white,
                    fontSize: "0.72rem",
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={14} aria-hidden="true" /> Edit Dulu (Ditolak)
                </button>
              ))}

            {/* FITUR BARU: Lose */}
            {canLoseQuotation(qt) && (
              <button
                type="button"
                onClick={() => setShowLose(true)}
                className="action-btn"
                style={{
                  padding: "0.4rem 0.65rem",
                  border: `1px solid ${UI.red}`,
                  borderRadius: 8,
                  background: "#fff1f2",
                  color: UI.red,
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                <XCircle size={14} aria-hidden="true" /> Lose
              </button>
            )}

            <ReofferOpportunityButton qt={qt}/>
            {/* Lihat Detail */}
            <button
              type="button"
              onClick={() => onView(qt.id)}
              className="action-btn quotation-detail-action"
              title="Lihat detail quotation"
            >
              <Eye size={14} aria-hidden="true" /> Detail
            </button>

            {/* Edit */}
            {qt.status === "draft" &&
              qt.can_resubmit_approval && (
                <button
                  type="button"
                  onClick={() => onEdit(qt)}
                  title="Edit Quotation"
                  className="action-btn"
                  style={{
                    padding: "0.4rem",
                    border: `1px solid ${UI.border}`,
                    borderRadius: 8,
                    background: UI.white,
                    cursor: "pointer",
                  }}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              )}

            {/* PDF dan Aksi Penjualan Lain */}
            <QuotationActionButtons
              qt={qt}
            />
          </div>
        </td>
      </tr>

      {/* Modal Lose untuk Tabel */}
      {showLose && (
        <QuotationLoseModal
          quotation={qt}
          leadId={qt.lead_id ?? opportunity?.lead_id ?? null}
          onClose={() => setShowLose(false)}
        />
      )}
    </>
  );
}

/**
 * ==========================================
 * BAGIAN 6 AKAN DILANJUTKAN DI BAWAH
 * ==========================================
 *
 * Bagian berikutnya mempertahankan:
 *
 * - QuotationActionButtons
 * - Preview PDF Quotation
 * - Download PDF
 * - Print PDF
 * - Kirim Quotation
 * - Tandai Diterima Customer
 * - Buat Kontrak
 * - Generator PDF
 */

/**
 * ==========================================
 * QUOTATION ACTION BUTTONS
 * ==========================================
 */
function QuotationActionButtons({
  qt,
}: {
  qt: Quotation;
}) {
  const navigate = useNavigate();
  const statusMutation = useUpdateQuotationStatus(qt.id);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const activeOrgId = useActiveOrgId();

  async function handlePreviewPdf() {
    if (downloadingPdf) return;
    if (!activeOrgId) { alert("Pilih organisasi aktif terlebih dahulu."); return; }
    setDownloadingPdf(true);
    try {
      // PDF resmi dari BE: identitas Sales, TTD HR, dan QR tidak editable.
      const response = await apiClient.get(`/v1/crm-sales/quotations/${qt.id}/print-pdf`, {
        params: { organization_id: activeOrgId }, responseType: "blob",
      });
      setPreviewBlob(response.data as Blob);
    } catch (err) {
      alert(`Gagal memuat PDF resmi: ${extractErrorMessage(err)}`);
    } finally { setDownloadingPdf(false); }
  }

  function handleClosePreview() { setPreviewBlob(null); }

  async function handleTandaiDiterima() {
    if (
      !confirm(
        `Tandai quotation ${qt.quotation_number} sudah DITERIMA oleh customer? Aksi ini membuka opsi "Buat Kontrak".`
      )
    ) {
      return;
    }

    try {
      await statusMutation.mutateAsync("accepted");
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <>
      {/* Preview PDF */}
      <button
        type="button"
        onClick={handlePreviewPdf}
        disabled={downloadingPdf}
        className="action-btn"
        title="Pratinjau PDF Penawaran"
        style={{
          minWidth: 68,
          minHeight: 32,
          fontSize: "0.75rem",
          padding: "0.3rem 0.55rem",
          background: UI.white,
          color: "#0F766E",
          border: "1px solid #0F766E",
          borderRadius: 8,
          cursor: downloadingPdf ? "wait" : "pointer",
          fontWeight: 800,
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.3rem",
          opacity: downloadingPdf ? 0.65 : 1,
        }}
      >
        <FileDown size={11} />
        {downloadingPdf ? "..." : "PDF"}
      </button>

      {/* Kirim Quotation */}
      {(qt.status === "draft" ||
        qt.status === "approved") && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            navigate(`/crm-sales/quotations/${qt.id}/send`)
          }
          style={{
            fontSize: "0.75rem",
            padding: "0.25rem 0.5rem",
          }}
        >
          <Send size={11} />
          Kirim
        </button>
      )}

      {/* Tandai Diterima Customer */}
      {qt.status === "sent" && (
        <button
          type="button"
          onClick={handleTandaiDiterima}
          disabled={statusMutation.isPending}
          style={{
            fontSize: "0.75rem",
            padding: "0.25rem 0.5rem",
            background: "#15803d",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          <CheckCircle2 size={14} aria-hidden="true" /> Tandai Diterima Customer
        </button>
      )}

      {/* Buat Kontrak */}
      {qt.status === "accepted" && ((qt.contracts_count ?? 0) > 0 ? (
          <Link
            to="/crm-sales/contracts"
            style={{
              flexBasis: "100%",
              width: "100%",
              marginTop: "0.15rem",
              fontSize: "0.72rem",
              fontWeight: 800,
              color: "#15803d",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2 size={14} aria-hidden="true" /> Contract sudah dibuat
          </Link>
        ) : <CreateContractButton qt={qt} />)}
      {/* Modal Preview PDF */}
      {previewBlob && (
        <CrmPdfPreviewModal
          title={`Penawaran — ${qt.quotation_number}`}
          blob={previewBlob}
          filename={`Penawaran_${qt.quotation_number}.pdf`}
          onClose={handleClosePreview}
        />
      )}
    </>
  );
}


function CreateContractButton({ qt }: { qt: Quotation }) {
  const [showAssignCustomer, setShowAssignCustomer] = useState(false);
  const [showContractConfirm, setShowContractConfirm] = useState(false);

  return (
    <>
      {!qt.customer_id ? (
        <button
          type="button"
          className="action-btn"
          onClick={() => setShowAssignCustomer(true)}
          style={{
            minHeight: 34,
            padding: "0.34rem 0.72rem",
            border: "1px solid #FB923C",
            borderRadius: 8,
            background: "#FFF7ED",
            color: "#C2410C",
            cursor: "pointer",
            fontSize: "0.75rem",
            fontWeight: 800,
          }}
        >
          <UserRoundPlus size={14} aria-hidden="true" /> Jadikan Customer Baru
        </button>
      ) : (
        <button type="button" className="action-btn" onClick={() => setShowContractConfirm(true)}
          style={{ minHeight: 34, padding: "0.34rem 0.72rem", border: `1px solid ${UI.navy}`, borderRadius: 8,
            background: UI.navy, color: UI.white, cursor: "pointer", fontSize: "0.75rem", fontWeight: 800 }}>
          <FilePlus2 size={14} aria-hidden="true" /> Buat Kontrak
        </button>
      )}

      {showAssignCustomer && (
        <AssignCustomerModal
          quotationId={qt.id}
          quotationNumber={qt.quotation_number}
          leadId={qt.lead_id}
          onClose={() => setShowAssignCustomer(false)}
        />
      )}

      {showContractConfirm && (
        <CreateContractFromQuotationModal
          quotationId={qt.id}
          quotationNumber={qt.quotation_number}
          onClose={() => setShowContractConfirm(false)}
        />
      )}
    </>
  );
}
