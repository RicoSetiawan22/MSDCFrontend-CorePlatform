import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, type FormEvent } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import {
  useLeadList,
  useCreateLead,
  useCrmPicUsers,
} from "../api/useLeads";
import { leadApi } from "../api/leadApi";
import { useUserList } from "@modules/core-platform/api/useUsers";
import { apiClient } from "@shared/lib/api-client";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { CrmPagination, CRM_DEFAULT_PER_PAGE } from "../components/CrmPagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { formatDate } from "@shared/lib/format";
import {
  extractErrorMessage,
  extractNumberSequenceError,
  type NumberSequenceNotConfiguredError,
} from "@shared/types/api";
import type { Lead, LeadStatus } from "../types/lead";
import { drawMsdcPdfHeader, MSDC_PDF_LOGO } from "../lib/pdfBrand";

function exportDateText(date: Date) {
  return date.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

const STATUS_CONFIG: Record<
  string,
  { color: string; bg: string; label: string }
> = {
  new: {
    color: "#6366f1",
    bg: "#eef2ff",
    label: "Baru",
  },
  contacted: {
    color: "#0891b2",
    bg: "#ecfeff",
    label: "Dihubungi",
  },
  qualified: {
    color: "#16a34a",
    bg: "#f0fdf4",
    label: "Qualified",
  },
  unqualified: {
    color: "#dc2626",
    bg: "#fef2f2",
    label: "Tidak Qualified",
  },
  converted: {
    color: "#7c3aed",
    bg: "#ede9fe",
    label: "Jadi Customer",
  },
};

const SOURCE_CONFIG: Record<string, string> = {
  website: "#6366f1",
  marketing: "#0891b2",
  event: "#d97706",
  referral: "#16a34a",
  sales: "#7c3aed",
  other: "#6b7280",
};

const TYPE_ICONS: Record<string, string> = {
  call: "📞",
  email: "✉️",
  whatsapp: "💬",
  meeting: "🤝",
  note: "📝",
  status_change: "🔄",

  // Aktivitas otomatis dari record CRM & Sales lainnya
  opportunity: "🎯",
  quotation: "📄",
  sales_order: "🛒",
  contract: "📑",
  demo: "🖥️",
  other: "•",
};

// Asal data aktivitas untuk badge timeline
const SOURCE_LABELS: Record<string, string> = {
  lead: "Lead",
  opportunity: "Opportunity",
  quotation: "Quotation",
  sales_order: "Sales Order",
  contract: "Contract",
};

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string | null;
  performed_by: string;
  performed_at: string;

  source?:
    | "lead"
    | "opportunity"
    | "quotation"
    | "sales_order"
    | "contract";

  // Link ke detail record terkait
  link?: string | null;

  // File attachment
  file_id?: number;
  original_name?: string;
  mime_type?: string;

  // Blob URL untuk menampilkan gambar
  imageBlobUrl?: string;
}

interface LeadCardData {
  lead: Lead;
  expanded: boolean;
  activities: ActivityItem[];
}

const EMPTY_LEAD_FORM = {
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  source: "",
  notes: "",
  assigned_to: null as number | null,
  sales_employee_id: null as number | null,
  pic: "",
  pic_choice: "",
};


const LEADS_UI_STYLES = `
.crm-leads-ui {
  --crm-bg: #f5f7fb;
  --crm-surface: #ffffff;
  --crm-ink: #0f2747;
  --crm-text: #1e293b;
  --crm-muted: #64748b;
  --crm-border: #e2e8f0;
  --crm-accent: #f0a800;
  min-height: 100%;
  padding-bottom: 28px;
  background: var(--crm-bg);
  color: var(--crm-text);
}
.crm-leads-ui * { box-sizing: border-box; }
.crm-leads-ui button, .crm-leads-activity-overlay button, .crm-leads-export-overlay button {
  font-family: inherit;
}
.crm-leads-content {
  margin: 0 clamp(16px, 2.2vw, 32px) 28px !important;
  padding-top: 12px !important;
}
.crm-leads-tabs {
  display: flex !important;
  flex-wrap: wrap;
  gap: 8px !important;
  padding: 0 clamp(16px, 2.2vw, 32px) 18px !important;
}
.crm-leads-tab {
  min-height: 40px;
  padding: 9px 16px !important;
  border: 1px solid var(--crm-border) !important;
  border-radius: 11px !important;
  background: #fff !important;
  color: #64748b !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease, color .18s ease;
}
.crm-leads-tab:hover { transform: translateY(-1px); border-color: #cbd5e1 !important; box-shadow: 0 4px 12px rgba(15,39,71,.07); }
.crm-leads-tab:focus-visible, .crm-leads-create-back:focus-visible, .crm-leads-back-button:focus-visible,
.crm-leads-next-opportunity:focus-visible, .crm-leads-ui button:focus-visible,
.crm-leads-activity-overlay button:focus-visible, .crm-leads-export-overlay button:focus-visible {
  outline: 3px solid rgba(240,168,0,.28);
  outline-offset: 2px;
}
.crm-leads-tab.is-active {
  background: #102b4e !important;
  border-color: #102b4e !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(16,43,78,.16);
}
/* KPI cards deliberately mirror the approved CRM Dashboard card system. */
.crm-leads-kpis {
  display: grid !important;
  width: 100%;
  padding: 0 clamp(16px, 2.2vw, 32px) 20px !important;
  gap: 16px !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
}
.crm-leads-kpi {
  display: flex;
  min-width: 0;
  min-height: 154px;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem !important;
  border: 1px solid rgba(226, 232, 240, 0.92) !important;
  border-radius: 16px !important;
  outline: none;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
}
.crm-leads-kpi:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1 !important;
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.09);
}
.crm-leads-kpi:focus-visible {
  transform: translateY(-2px);
  outline: 3px solid rgba(247, 171, 0, 0.66);
  outline-offset: 3px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.09);
}
.crm-leads-kpi__heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
}
.crm-leads-kpi__icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}
.crm-leads-kpi:hover .crm-leads-kpi__icon {
  transform: scale(1.06) rotate(-3deg);
}
.crm-leads-kpi__label {
  overflow: hidden;
  color: #64748b;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.055em;
  line-height: 1.45;
  text-overflow: ellipsis;
  text-transform: uppercase;
}
.crm-leads-kpi__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.35rem;
}
.crm-leads-kpi__value {
  overflow-wrap: anywhere;
  color: #0f2946;
  font-size: clamp(1.65rem, 2.2vw, 2rem);
  font-weight: 850;
  letter-spacing: -0.045em;
  line-height: 1.08;
  font-variant-numeric: tabular-nums;
}
.crm-leads-kpi__note {
  color: #64748b;
  font-size: 0.73rem;
  font-weight: 500;
  line-height: 1.45;
}
.crm-leads-campaign-status {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  padding: 0 12px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  color: #64748b;
  background: #fff;
  font-size: 11px;
  font-weight: 650;
  white-space: nowrap;
}
.crm-leads-campaign-status strong {
  color: #0f2946;
  font-weight: 800;
}
.crm-leads-campaign-status__icon {
  display: inline-flex;
  color: #d97706;
}
.crm-leads-list-card {
  margin: 0 clamp(16px, 2.2vw, 32px) 24px !important;
  overflow: hidden;
  border: 1px solid var(--crm-border) !important;
  border-radius: 18px !important;
  background: #fff !important;
  box-shadow: 0 4px 20px -8px rgba(15,39,71,.09);
}
.crm-leads-list-heading {
  padding: 18px 22px !important;
  border-bottom: 1px solid #edf1f5 !important;
  background: #fff;
}
.crm-leads-list-title { color: #102b4e !important; font-size: 14px !important; font-weight: 800 !important; letter-spacing: -.01em; }
.crm-leads-toolbar {
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px !important;
  padding: 16px 22px !important;
  border-bottom: 1px solid #edf1f5 !important;
  background: #f8fafc !important;
}
.crm-leads-search {
  min-height: 42px;
  padding: 9px 13px !important;
  gap: 9px !important;
  border: 1px solid #dbe3ec !important;
  border-radius: 11px !important;
  background: #fff !important;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.crm-leads-search:focus-within { border-color: #e4a008 !important; box-shadow: 0 0 0 4px rgba(240,168,0,.12); }
.crm-leads-search input { min-width: 0; color: #1e293b !important; font-size: 13px !important; }
.crm-leads-search input::placeholder { color: #94a3b8; }
.crm-leads-filter {
  min-height: 42px !important;
  padding: 0 12px !important;
  border: 1px solid #dbe3ec !important;
  border-radius: 10px !important;
  background: #fff !important;
  color: #334155 !important;
  font-size: 12px !important;
  font-weight: 600;
  outline: none;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.crm-leads-filter:focus { border-color: #e4a008 !important; box-shadow: 0 0 0 3px rgba(240,168,0,.12); }
.crm-leads-count {
  padding: 7px 10px;
  border: 1px solid #dbeafe;
  border-radius: 9px;
  background: #eff6ff;
  color: #315b8a !important;
  font-size: 11px !important;
  font-weight: 700;
}
.crm-leads-table-wrap { width: 100%; overflow-x: auto !important; }
.crm-leads-table {
  width: 100%;
  min-width: 920px;
  border-collapse: separate !important;
  border-spacing: 0;
  table-layout: fixed;
}
.crm-leads-table thead th {
  padding: 14px 14px !important;
  border-bottom: 1px solid #e2e8f0 !important;
  background: #f8fafc !important;
  color: #64748b !important;
  font-size: 10px !important;
  font-weight: 800 !important;
  letter-spacing: .065em;
}
.crm-leads-table tbody tr { background: #fff; transition: background .16s ease; }
.crm-leads-table tbody tr:hover { background: #f8fafc; }
.crm-leads-table tbody td {
  padding: 14px !important;
  border-bottom: 1px solid #edf1f5 !important;
  color: #334155;
  font-size: 12px !important;
}
.crm-leads-table tbody tr:last-child td { border-bottom: 0 !important; }
.crm-leads-status {
  padding: 5px 9px !important;
  border: 1px solid currentColor;
  border-color: color-mix(in srgb, currentColor 16%, transparent) !important;
  border-radius: 999px !important;
  font-size: 10px !important;
  font-weight: 750 !important;
  line-height: 1.25;
}
.crm-leads-table button {
  min-height: 30px;
  border-radius: 9px !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  transition: transform .16s ease, box-shadow .16s ease, background .16s ease;
}
.crm-leads-table button:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(15,39,71,.08); }
.crm-leads-table .crm-leads-detail-button { display:inline-flex; min-width:86px; min-height:36px !important; margin:2px 4px; align-items:center; justify-content:center; gap:7px; padding:0 13px !important; border:1px solid #dbe3ec !important; border-radius:10px !important; background:#fff !important; color:#102b4e !important; font-size:11px !important; font-weight:750 !important; white-space:nowrap; }
.crm-leads-table .crm-leads-detail-button:hover { border-color:#f0a800 !important; background:#fffbeb !important; }
.crm-leads-create-content { margin: 0 clamp(16px, 2.2vw, 32px) 28px !important; }
.crm-leads-create-back, .crm-leads-back-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  padding: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: #64748b !important;
  font-size: 12px !important;
  font-weight: 750 !important;
  cursor: pointer;
  transition: color .16s ease, transform .16s ease;
}
.crm-leads-create-back:hover, .crm-leads-back-button:hover { color: #102b4e !important; transform: translateX(-2px); }
.crm-leads-create-card {
  max-width: 1075px;
  overflow: hidden;
  margin: 0 auto;
  border: 1px solid #e2e8f0 !important;
  border-radius: 18px !important;
  background: #fff !important;
  box-shadow: 0 5px 22px rgba(15,39,71,.055);
}
.crm-leads-create-heading {
  padding: 20px 26px !important;
  border-bottom: 1px solid #edf1f5 !important;
  background: #f8fafc;
  color: #102b4e !important;
  font-size: 14px !important;
  font-weight: 800 !important;
}
.crm-leads-create-form { gap: 18px !important; padding: 24px 26px !important; }
.crm-leads-form-two-col { gap: 14px 18px !important; }
.crm-leads-create-form .input-label { display: block; margin-bottom: 7px; color: #475569; font-size: 12px; font-weight: 700; }
.crm-leads-create-form .input, .crm-leads-create-form input:not([type="file"]),
.crm-leads-create-form select, .crm-leads-create-form textarea {
  border: 1px solid #dbe3ec !important;
  border-radius: 10px !important;
  background: #fff !important;
  color: #1e293b !important;
  font-size: 13px !important;
  transition: border-color .16s ease, box-shadow .16s ease;
}
.crm-leads-create-form .input:focus, .crm-leads-create-form input:focus, .crm-leads-create-form select:focus, .crm-leads-create-form textarea:focus {
  border-color: #e4a008 !important;
  outline: none;
  box-shadow: 0 0 0 3px rgba(240,168,0,.12);
}
.crm-leads-create-form textarea { min-height: 100px; resize: vertical; }
.crm-leads-create-actions { padding-top: 8px !important; }

/* Form Prospek Baru: soft enterprise style, konsisten dengan modul MSDC.
   Aturan ini hanya berlaku di tampilan pembuatan prospek. */
.crm-leads-create .crm-leads-create-content {
  width: auto;
  max-width: 1200px;
  margin: 0 auto 32px !important;
  padding: 0 clamp(16px, 2.2vw, 32px);
}
.crm-leads-create-navigation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin: 4px 0 18px;
}
.crm-leads-create .crm-leads-create-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 43px;
  padding: 0 17px !important;
  border: 1px solid #f2d58b !important;
  border-radius: 12px;
  background: linear-gradient(180deg, #fffaf0 0%, #fff2cf 100%) !important;
  color: #916000 !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  box-shadow: 0 4px 12px rgba(220,157,20,.08);
  transition: transform .18s ease, background .18s ease, border-color .18s ease, box-shadow .18s ease;
}
.crm-leads-create .crm-leads-create-back:hover {
  transform: translateY(-1px);
  border-color: #e7bb51 !important;
  background: #ffebad !important;
  color: #805200 !important;
  box-shadow: 0 7px 18px rgba(220,157,20,.14);
}
.crm-leads-create-step {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border: 1px solid #e1e9f2;
  border-radius: 999px;
  background: #fff;
  color: #73869f;
  font-size: 11px;
  font-weight: 750;
}
.crm-leads-create .crm-leads-create-card {
  width: 100%;
  max-width: none;
  border: 1px solid #e1e9f3 !important;
  border-radius: 20px !important;
  background: #fff !important;
  box-shadow: 0 10px 30px rgba(15,39,71,.055);
}
.crm-leads-create .crm-leads-create-heading {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 23px 28px !important;
  border-bottom: 1px solid #e8eef5 !important;
  background: linear-gradient(105deg, #f7faff 0%, #fbfcff 68%, #fff9e9 100%) !important;
}
.crm-leads-create-heading-icon {
  display: inline-flex;
  width: 49px;
  height: 49px;
  flex: 0 0 49px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f5e3ae;
  border-radius: 15px;
  background: #fff1c7;
  color: #b47b0b;
}
.crm-leads-create-heading-copy { flex: 1; min-width: 0; }
.crm-leads-create-heading-copy h2 {
  margin: 0;
  color: #102b4e;
  font-size: 16px;
  font-weight: 850;
  letter-spacing: -.025em;
}
.crm-leads-create-heading-copy p {
  margin: 5px 0 0;
  color: #788ba2;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.55;
}
.crm-leads-create-heading-badge {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  min-height: 28px;
  padding: 0 11px;
  border: 1px solid #e3eaf4;
  border-radius: 999px;
  background: #fff;
  color: #53708e;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .025em;
}
.crm-leads-create .crm-leads-create-form {
  display: flex;
  flex-direction: column;
  gap: 17px !important;
  padding: 24px 28px 0 !important;
}
.crm-leads-create-section {
  padding: 18px 21px 20px;
  border: 1px solid #e9eff6;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
}
.crm-leads-create-section-head {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 19px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eef2f7;
}
.crm-leads-create-section-number {
  display: inline-flex;
  width: 33px;
  height: 33px;
  flex: 0 0 33px;
  align-items: center;
  justify-content: center;
  border: 1px solid #f2e4b9;
  border-radius: 11px;
  background: #fffaeb;
  color: #bb870f;
  font-size: 11px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}
.crm-leads-create-section-head h3 {
  margin: 0;
  color: #173452;
  font-size: 13px;
  font-weight: 800;
}
.crm-leads-create-section-head p {
  margin: 4px 0 0;
  color: #8a9aae;
  font-size: 11px;
  line-height: 1.45;
}
.crm-leads-create-section-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.crm-leads-create-section-fields--two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 17px;
}
.crm-leads-create .crm-leads-create-form .input-label {
  margin-bottom: 8px;
  color: #506783;
  font-size: 12px;
  font-weight: 750;
}
.crm-leads-create .crm-leads-create-form .input,
.crm-leads-create .crm-leads-create-form input:not([type="file"]),
.crm-leads-create .crm-leads-create-form select,
.crm-leads-create .crm-leads-create-form textarea {
  min-height: 45px;
  border: 1px solid #dae5f0 !important;
  border-radius: 11px !important;
  background: #fff !important;
  font-size: 13px !important;
  box-shadow: 0 1px 2px rgba(15,39,71,.015);
}
.crm-leads-create .crm-leads-create-form input:focus,
.crm-leads-create .crm-leads-create-form select:focus,
.crm-leads-create .crm-leads-create-form textarea:focus {
  border-color: #ebb64e !important;
  box-shadow: 0 0 0 3px rgba(240,168,0,.12);
}
.crm-leads-create .crm-leads-create-form input::placeholder,
.crm-leads-create .crm-leads-create-form textarea::placeholder { color: #a1aec0; }
.crm-leads-create .crm-leads-create-form textarea { min-height: 106px; }
.crm-leads-create .crm-leads-create-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 11px;
  margin: 3px -28px 0;
  padding: 18px 28px !important;
  border-top: 1px solid #e9eff6;
  background: #f8fafd;
}
.crm-leads-create .crm-leads-create-actions button {
  min-height: 42px;
  padding: 0 19px;
  border-radius: 11px;
  font-size: 12px;
  font-weight: 800;
}
.crm-leads-create .crm-leads-create-actions button[type="submit"] {
  background: #f7ab00;
  color: #092747;
  border-color: #f7ab00;
  box-shadow: 0 5px 14px rgba(247,171,0,.17);
}
.crm-leads-create .crm-leads-create-actions button[type="submit"]:hover:not(:disabled) {
  background: #ffbf35;
  border-color: #ffbf35;
}
@media (max-width: 760px) {
  .crm-leads-create .crm-leads-create-content { padding: 0 16px; }
  .crm-leads-create .crm-leads-create-form { padding: 16px 16px 0 !important; }
  .crm-leads-create-section { padding: 16px; }
  .crm-leads-create-section-fields--two { grid-template-columns: 1fr; }
  .crm-leads-create .crm-leads-create-actions { margin: 3px -16px 0; padding: 16px !important; }
  .crm-leads-create .crm-leads-create-heading { padding: 18px !important; }
  .crm-leads-create-heading-badge { display: none; }
}
@media (max-width: 480px) {
  .crm-leads-create .crm-leads-create-back { width: 100%; }
  .crm-leads-create-step { display: none; }
  .crm-leads-create .crm-leads-create-actions button { flex: 1 1 0; }
}
.crm-leads-detail-actions {
  display: flex !important;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px !important;
}
.crm-leads-next-opportunity {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 9px 15px !important;
  border: 1px solid #102b4e !important;
  border-radius: 11px !important;
  background: #102b4e !important;
  color: #fff !important;
  font-size: 12px !important;
  font-weight: 800 !important;
  text-decoration: none !important;
  box-shadow: 0 3px 8px rgba(16,43,78,.12);
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.crm-leads-next-opportunity:hover { transform: translateY(-2px); background: #173b66 !important; box-shadow: 0 7px 16px rgba(16,43,78,.18); }
.crm-leads-detail-card { padding: 22px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; box-shadow: 0 5px 22px rgba(15,39,71,.055); }
.crm-leads-detail-header { padding-bottom: 16px !important; margin-bottom: 18px !important; border-bottom: 1px solid #edf1f5 !important; }
.crm-leads-detail-grid { gap: 16px !important; }
.crm-leads-info-panel, .crm-leads-activity-panel {
  border: 1px solid #e2e8f0 !important;
  border-radius: 15px !important;
  background: #fff !important;
  box-shadow: 0 2px 8px rgba(15,23,42,.025);
}
.crm-leads-panel-heading {
  padding: 15px 18px !important;
  border-bottom: 1px solid #edf1f5 !important;
  background: #f8fafc;
  color: #102b4e !important;
  font-size: 13px !important;
  font-weight: 800 !important;
}
.crm-leads-panel-body { padding: 18px !important; }
.crm-leads-activity-panel .crm-leads-panel-body { max-height: 360px; }
.crm-leads-activity-item { border-bottom-color: #edf1f5 !important; }
.crm-leads-activity-item:last-child { border-bottom: 0 !important; }
.crm-leads-ui .input-error { border-radius: 10px; }
.crm-leads-activity-overlay, .crm-leads-export-overlay {
  position: fixed;
  inset: 0;
  z-index: 1350;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 39, 71, .56) !important;
  backdrop-filter: blur(3px);
}
.crm-leads-activity-dialog, .crm-leads-export-dialog {
  border: 1px solid rgba(226,232,240,.9);
  border-radius: 18px !important;
  background: #fff !important;
  box-shadow: 0 24px 70px rgba(15,39,71,.24) !important;
}
.crm-leads-modal-header {
  background: #102b4e !important;
  border-bottom: 3px solid #f0a800 !important;
}
.crm-leads-modal-section {
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  background: #fff !important;
}
.crm-leads-modal-footer { border-top: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
.crm-leads-export-section { border: 1px solid #e2e8f0 !important; border-radius: 14px !important; }
.crm-leads-export-option:hover, .crm-leads-export-option:focus-visible, .crm-leads-export-option:active {
  transform: translateY(-2px); border-color: #f0a800 !important; background: #fffbeb !important;
  box-shadow: 0 10px 22px rgba(240,168,0,.15) !important;
}
.crm-leads-export-option:active { transform: translateY(0) scale(.99); }
@media (max-width: 900px) {
  .crm-leads-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
}
@media (max-width: 760px) {
  .crm-leads-tabs { padding-left: 16px !important; padding-right: 16px !important; }
  .crm-leads-kpis { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
  .crm-leads-campaign-status { margin-left: 0; }
  .crm-leads-toolbar { align-items: stretch !important; }
  .crm-leads-search { flex-basis: 100%; max-width: none !important; }
  .crm-leads-filter { flex: 1 1 135px; min-width: 0; }
  .crm-leads-count { margin-left: 0; }
  .crm-leads-create-form { padding: 18px !important; }
  .crm-leads-form-two-col { grid-template-columns: 1fr !important; }
  .crm-leads-detail-card { padding: 16px; }
  .crm-leads-detail-grid { grid-template-columns: 1fr !important; }
  .crm-leads-detail-grid > section > div:nth-child(2) { grid-template-columns: 1fr !important; }
  .crm-leads-activity-overlay, .crm-leads-export-overlay { padding: 10px; }
  .crm-leads-activity-dialog, .crm-leads-export-dialog { max-width: 100% !important; max-height: calc(100vh - 20px) !important; }
}
@media (max-width: 640px) {
  .crm-leads-kpis { grid-template-columns: minmax(0, 1fr) !important; gap: 12px !important; }
  .crm-leads-kpi { min-height: 132px; padding: 1.05rem !important; }
  .crm-leads-create-heading { padding: 16px 18px !important; }
}
@media (prefers-reduced-motion: reduce) {
  .crm-leads-ui *, .crm-leads-activity-overlay *, .crm-leads-export-overlay * { scroll-behavior: auto !important; transition: none !important; animation-duration: .01ms !important; }
  .crm-leads-kpi:hover, .crm-leads-kpi:focus-visible { transform: none; }
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

function LeadPageStyles() {
  return <style>{LEADS_UI_STYLES}</style>;
}


function LeadCreatePage({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (lead: Lead) => void;
}) {
  const [form, setForm] = useState(EMPTY_LEAD_FORM);
  const [error, setError] = useState<string | null>(null);
  const [seqError, setSeqError] =
    useState<NumberSequenceNotConfiguredError | null>(null);
  const create = useCreateLead();

  const [salesSearch, setSalesSearch] = useState("");
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);

  const {
    data: picUsers,
    isLoading: loadingPicUsers,
    isError: picUsersError,
  } = useCrmPicUsers();

  const matchingPicUsers = (picUsers ?? []).filter((pic) =>
    `${pic.full_name} ${pic.position_title} ${pic.email ?? ""}`
      .toLowerCase()
      .includes(salesSearch.trim().toLowerCase())
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!form.company_name.trim()) {
      setError("Nama perusahaan wajib diisi.");
      return;
    }

    if (!form.pic_choice) {
      setError("Pilih PIC dari daftar pengguna sebelum menyimpan Lead.");
      return;
    }

    setError(null);

    try {
      const createdLead = await create.mutateAsync(form);
      onCreated(createdLead);
    } catch (err) {
      const seq = extractNumberSequenceError(err);

      if (seq) {
        setSeqError(seq);
        return;
      }

      setError(extractErrorMessage(err));
    }
  }

  return (
    <div className="crm-leads-ui crm-leads-create">
      <LeadPageStyles />
      <PageHeader
        title="Prospek Baru"
        subtitle="Tambahkan calon customer baru ke proses penjualan."
        containerClassName="px-7 pt-5 pb-2"
      />

      <div className="crm-leads-create-content">
        <div className="crm-leads-create-navigation">
          <button
            type="button"
            className="crm-leads-create-back crm-msdc-back-button"
            onClick={onBack}
          >
            <ArrowLeft size={17} strokeWidth={2.25} aria-hidden="true" />
            Kembali ke Prospek
          </button>
          <span className="crm-leads-create-step">Form Prospek Baru</span>
        </div>

        <div className="crm-leads-create-card">
          <div className="crm-leads-create-heading">
            <div className="crm-leads-create-heading-icon" aria-hidden="true">
              <Building2 size={22} strokeWidth={2} />
            </div>
            <div className="crm-leads-create-heading-copy">
              <h2>Informasi Prospek</h2>
              <p>Lengkapi informasi awal calon pelanggan untuk ditindaklanjuti oleh tim penjualan.</p>
            </div>
            <span className="crm-leads-create-heading-badge">Data Prospek</span>
          </div>

          <form className="crm-leads-create-form" onSubmit={handleSubmit}>
            <section className="crm-leads-create-section" aria-labelledby="prospek-section-identitas">
              <div className="crm-leads-create-section-head">
                <span className="crm-leads-create-section-number">01</span>
                <div>
                  <h3 id="prospek-section-identitas">Identitas & Kontak</h3>
                  <p>Informasi dasar perusahaan dan kontak yang dapat dihubungi.</p>
                </div>
              </div>
              <div className="crm-leads-create-section-fields">
                <InputField
              label="Nama Perusahaan *"
              required
              value={form.company_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  company_name: e.target.value,
                })
              }
              placeholder="mis. PT Contoh Indonesia"
            />

            <div
              className="crm-leads-form-two-col"
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "0 1rem",
              }}
            >
              <InputField
                label="Nama Contact"
                value={form.contact_name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    contact_name: e.target.value,
                  })
                }
                placeholder="Budi Santoso"
              />

              <InputField
                label="Telepon"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value,
                  })
                }
                placeholder="021-xxxxxxx"
              />
            </div>

            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              placeholder="contact@perusahaan.co.id"
            />
              </div>
            </section>

            <section className="crm-leads-create-section" aria-labelledby="prospek-section-pic">
              <div className="crm-leads-create-section-head">
                <span className="crm-leads-create-section-number">02</span>
                <div>
                  <h3 id="prospek-section-pic">Penanggung Jawab & Sumber</h3>
                  <p>Tentukan PIC serta kanal asal prospek untuk mempermudah tindak lanjut.</p>
                </div>
              </div>
              <div className="crm-leads-create-section-fields crm-leads-create-section-fields--two">
            {/* PIC */}
            <div>
              <label
                htmlFor="lead-pic"
                className="input-label"
              >
                PIC
              </label>

              <div style={{ position: "relative" }}>
                <input
                  id="lead-pic"
                  className="input"
                  type="text"
                  autoComplete="off"
                  role="combobox"
                  aria-expanded={salesDropdownOpen}
                  aria-controls="lead-pic-options"
                  aria-autocomplete="list"
                  value={
                    salesDropdownOpen
                      ? salesSearch
                      : form.pic
                  }
                  placeholder={
                    loadingPicUsers
                      ? "Memuat daftar PIC..."
                      : picUsersError
                        ? "Gagal memuat PIC"
                        : "Cari PIC berdasarkan nama atau jabatan..."
                  }
                  disabled={
                    loadingPicUsers ||
                    picUsersError
                  }
                  onFocus={() => {
                    setSalesSearch("");
                    setSalesDropdownOpen(true);
                  }}
                  onChange={(e) => {
                    setSalesSearch(e.target.value);
                    setSalesDropdownOpen(true);
                  }}
                  onBlur={() => {
                    setSalesDropdownOpen(false);
                    setSalesSearch("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSalesDropdownOpen(false);
                      e.currentTarget.blur();
                    }

                    if (
                      e.key === "Enter" &&
                      salesDropdownOpen
                    ) {
                      e.preventDefault();

                      if (matchingPicUsers.length === 1) {
                        setForm((prev) => ({
                          ...prev,
                          pic: matchingPicUsers[0].full_name,
                          pic_choice: matchingPicUsers[0].choice_id,
                          assigned_to: matchingPicUsers[0].user_id,
                          sales_employee_id: matchingPicUsers[0].employee_id,
                        }));

                        setSalesSearch("");
                        setSalesDropdownOpen(false);
                      }
                    }
                  }}
                />

                {salesDropdownOpen &&
                  !loadingPicUsers &&
                  !picUsersError && (
                    <div
                      id="lead-pic-options"
                      role="listbox"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 4px)",
                        left: 0,
                        right: 0,
                        zIndex: 30,
                        background: "#fff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        boxShadow:
                          "0 8px 20px rgba(0,0,0,0.12)",
                        maxHeight: 180,
                        overflowY: "auto",
                      }}
                    >
                      <button
                        type="button"
                        role="option"
                        aria-selected={!form.pic}
                        onMouseDown={(e) =>
                          e.preventDefault()
                        }
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            pic: "",
                            pic_choice: "",
                            assigned_to: null,
                            sales_employee_id: null,
                          }));

                          setSalesSearch("");
                          setSalesDropdownOpen(false);
                        }}
                        style={{
                          display: "block",
                          width: 118,
                          padding: "10px 12px",
                          textAlign: "left",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#64748b",
                        }}
                      >
                        — Belum dipilih —
                      </button>

                      {matchingPicUsers.length === 0 ? (
                        <div
                          style={{
                            padding: "12px",
                            color: "#64748b",
                            fontSize: "0.85rem",
                          }}
                        >
                          Tidak ada PIC yang cocok
                          dengan pencarian.
                        </div>
                      ) : (
                        matchingPicUsers.map((user) => (
                          <button
                            key={user.choice_id}
                            type="button"
                            role="option"
                            aria-selected={
                              form.pic_choice === user.choice_id
                            }
                            onMouseDown={(e) =>
                              e.preventDefault()
                            }
                            onClick={() => {
                              setForm((prev) => ({
                                ...prev,
                                pic: user.full_name,
                                pic_choice: user.choice_id,
                                assigned_to: user.user_id,
                                sales_employee_id: user.employee_id,
                              }));

                              setSalesSearch("");
                              setSalesDropdownOpen(false);
                            }}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "10px 12px",
                              textAlign: "left",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              color: "#16213d",
                              fontSize: "0.85rem",
                            }}
                          >
                            {user.full_name} —{" "}
                            {user.position_title}
                          </button>
                        ))
                      )}
                    </div>
                  )}
              </div>

              {picUsersError && (
                <div className="input-error">
                  Daftar PIC gagal dimuat.
                </div>
              )}
            </div>

            {/* SUMBER LEAD */}
            <div>
              <label className="input-label">
                Sumber
              </label>

              <select
                className="input"
                value={form.source}
                onChange={(e) =>
                  setForm({
                    ...form,
                    source: e.target.value,
                  })
                }
              >
                <option value="">
                  — Pilih Sumber —
                </option>
                <option value="website">Website</option>
                <option value="marketing">Marketing</option>
                <option value="event">Event</option>
                <option value="referral">Referral</option>
                <option value="sales">Sales</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
              </div>
            </section>

            <section className="crm-leads-create-section" aria-labelledby="prospek-section-kebutuhan">
              <div className="crm-leads-create-section-head">
                <span className="crm-leads-create-section-number">03</span>
                <div>
                  <h3 id="prospek-section-kebutuhan">Catatan Kebutuhan</h3>
                  <p>Tambahkan konteks awal atau kebutuhan calon pelanggan jika tersedia.</p>
                </div>
              </div>
              <div className="crm-leads-create-section-fields">
            {/* CATATAN */}
            <div>
              <label className="input-label">
                Catatan Kebutuhan Awal
                {form.source &&
                  ` (${form.source.replace("_", " ")})`}
              </label>

              <textarea
                className="input"
                rows={4}
                value={form.notes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    notes: e.target.value,
                  })
                }
                placeholder="Catatan tentang prospek ini..."
              />
            </div>
              </div>
            </section>

            {error && (
              <div className="input-error">
                {error}
              </div>
            )}

            {/* TOMBOL FORM */}
            <div className="crm-leads-create-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={onBack}
              >
                Batal
              </Button>

              <Button
                type="submit"
                disabled={create.isPending}
              >
                {create.isPending
                  ? "Menyimpan..."
                  : "Simpan Prospek"}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* PENGATURAN NOMOR OTOMATIS */}
      {seqError && (
        <NumberSequenceSetupModal
          moduleCode={seqError.module_code}
          suggestedPrefix={seqError.suggested_prefix}
          suggestedFormat={seqError.suggested_format}
          lockModuleCode
          onClose={() => setSeqError(null)}
          onCreated={() => {
            setSeqError(null);

            create                
            .mutateAsync(form)
            .then(onCreated)
            .catch((err) =>
                setError(extractErrorMessage(err))
              );
          }}
        />
      )}
    </div>
  );
}

function ActivityAttachment({
  fileId,
  mimeType,
  originalName,
}: {
  fileId?: number;
  mimeType?: string;
  originalName?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isImage = mimeType?.startsWith("image/");

  useEffect(() => {
    if (!fileId) {
      setBlobUrl(null);
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    setBlobUrl(null);
    setError(null);

    const endpoint = `/v1/core-platform/files/${fileId}/download`;

    apiClient
      .get(endpoint, { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(response.data as Blob);
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        if (!active) return;
        console.error("[ActivityAttachment] Error:", err);
        setError("Tidak bisa memuat gambar");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  if (!fileId) return null;

  return (
    <div
      style={{
        marginTop: "0.5rem",
        border: "1px solid var(--border)",
        borderRadius: 6,
        overflow: "hidden",
        maxWidth: 280,
      }}
    >
      {isImage ? (
        blobUrl ? (
          <img
            src={blobUrl}
            alt="Lampiran"
            style={{
              width: "100%",
              maxHeight: 100,
              objectFit: "cover",
              display: "block",
              cursor: "pointer",
            }}
            onClick={() => window.open(blobUrl, "_blank")}
            title="Klik untuk memperbesar"
          />
        ) : (
          <div
            style={{
              padding: "1rem",
              textAlign: "center",
              color: error ? "#dc2626" : "var(--grey)",
              fontSize: "0.78rem",
            }}
          >
            {error ?? "Memuat gambar..."}
          </div>
        )
      ) : (
        <div
          style={{
            padding: "0.6rem",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "0.75rem",
            color: "var(--grey)",
          }}
        >
          <span>📎</span>
          <span>{originalName ?? "Lampiran"}</span>
        </div>
      )}
    </div>
  );
}

function AddActivityModal({
  leadId,
  leadName,
  onClose,
  onAdded,
}: {
  leadId: number;
  leadName: string;
  onClose: () => void;
  onAdded: (a: ActivityItem) => void;
}) {
  const [type, setType] =
    useState<ActivityItem["type"]>("call");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 16)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    name: string;
    previewUrl: string;
  } | null>(null);

  const [uploadingFile, setUploadingFile] = useState(false);

  const TYPES = [
    {
      key: "call" as const,
      label: "📞 Telepon",
      color: "#6366f1",
    },
    {
      key: "whatsapp" as const,
      label: "💬 WhatsApp",
      color: "#16a34a",
    },
    {
      key: "email" as const,
      label: "✉️ Email",
      color: "#0891b2",
    },
    {
      key: "meeting" as const,
      label: "🤝 Meeting",
      color: "#d97706",
    },
    {
      key: "note" as const,
      label: "📝 Catatan",
      color: "#6b7280",
    },
  ];

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Ukuran file maksimal 50 MB.");
      return;
    }

    if (attachedFile?.previewUrl) {
      URL.revokeObjectURL(attachedFile.previewUrl);
    }

    const previewUrl = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";

    setAttachedFile({
      file,
      name: file.name,
      previewUrl,
    });

    setError(null);
  }

  function removeFile() {
    if (attachedFile?.previewUrl) {
      URL.revokeObjectURL(attachedFile.previewUrl);
    }

    setAttachedFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Judul aktivitas wajib diisi.");
      return;
    }

    setError(null);
    setSaving(true);

    try {
      let fileId: number | undefined;

      if (attachedFile) {
        setUploadingFile(true);

        const formData = new FormData();
        formData.append("file", attachedFile.file);
        formData.append("module_code", "crm-sales");
        formData.append("reference_type", "lead_activity");
        formData.append("reference_id", String(leadId));

        const uploadRes = await apiClient.post(
          "/v1/core-platform/files/upload",
          formData
        );

        const uploadData = uploadRes.data as {
          success?: boolean;
          data?: Record<string, unknown> | null;
          message?: string;
        };

        fileId =
          typeof uploadData.data === "object" &&
          uploadData.data !== null
            ? (uploadData.data.id as number | undefined)
            : undefined;

        setUploadingFile(false);
      }

      const res = await apiClient.post(
        `/v1/crm-sales/leads/${leadId}/activities`,
        {
          activity_type: type,
          title: title.trim(),
          description: description.trim(),
          performed_at: date,
          file_id: fileId,
        }
      );

      const apiData = (
        res.data as {
          data?: Record<string, unknown> | null;
          message?: string;
        }
      ).data ?? {};

      const newActivity: ActivityItem = {
        id: String(Date.now()),
        type,
        title: title.trim(),
        description: description.trim(),
        performed_by: "Saya",
        performed_at: date,
        file_id: apiData["file_id"] as number | undefined,
        original_name: apiData["original_name"] as
          | string
          | undefined,
        mime_type: apiData["mime_type"] as
          | string
          | undefined,
      };

      onAdded(newActivity);
      onClose();
    } catch (err) {
      console.error("[LeadActivity] Error:", err);
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  }

  return createPortal(
    <div
      className="crm-leads-activity-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1350,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(9,39,71,.52)",
      }}
    >
      <div
        className="crm-leads-activity-dialog"
        role="dialog"
        aria-modal="true"
        style={{
          width: 900,
          maxWidth: "calc(100% - 40px)",
          maxHeight: "calc(100vh - 40px)",
          overflow: "hidden",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 20px 60px rgba(9,39,71,.24)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER MODAL */}
        <div
          className="crm-leads-modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            padding: "18px 24px 18px 28px",
            color: "#fff",
            background: EXPORT_BRAND.navy,
            borderBottom: `4px solid ${EXPORT_BRAND.orange}`,
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                marginBottom: 4,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".04em",
                color: "#d2deea",
              }}
            >
              CRM &amp; SALES
            </div>

            <strong
              style={{
                fontSize: 15,
                lineHeight: 1.25,
              }}
            >
              Aktivitas: {leadName}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <img
              src={MSDC_EXPORT_LOGO}
              alt="MSDC Surabaya"
              style={{
                width: 108,
                height: 58,
                objectFit: "contain",
                flexShrink: 0,
              }}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              style={{
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                border: "1px solid rgba(255,255,255,.24)",
                borderRadius: 8,
                background: "rgba(255,255,255,.08)",
                color: "#fff",
                fontSize: 22,
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* FORM AKTIVITAS */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 135,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "24px 28px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* INFORMASI AKTIVITAS */}
            <div
              className="crm-leads-modal-section"
              style={{
                padding: "20px 22px",
                border: `1px solid ${EXPORT_BRAND.border}`,
                borderRadius: 12,
                background: "#fff",
              }}
            >
              <div
                style={{
                  marginBottom: 14,
                  color: EXPORT_BRAND.navyText,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Informasi Aktivitas
              </div>

              {/* PILIHAN METODE */}
              <div style={{ marginBottom: "1rem" }}>
                <label className="input-label">
                  Via / Metode
                </label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(5, minmax(0, 1fr))",
                    gap: "0.6rem",
                  }}
                >
                  {TYPES.map((t) => (
                    <button
                      type="button"
                      key={t.key}
                      onClick={() => setType(t.key)}
                      style={{
                        minHeight: 33,
                        padding: "0.55rem 0.4rem",
                        borderRadius: 8,
                        cursor: "pointer",
                        border: `1px solid ${
                          type === t.key
                            ? EXPORT_BRAND.navy
                            : EXPORT_BRAND.border
                        }`,
                        background:
                          type === t.key ? "#eef4fa" : "#fff",
                        color:
                          type === t.key
                            ? EXPORT_BRAND.navy
                            : EXPORT_BRAND.slate,
                        fontSize: "0.74rem",
                        fontWeight: 700,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* JUDUL DAN TANGGAL */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "minmax(0, 1.35fr) minmax(260px, .65fr)",
                  gap: "1rem",
                  marginBottom: "1rem",
                }}
              >
                <div>
                  <label className="input-label">
                    Judul Aktivitas *
                  </label>
                  <input
                    className="input"
                    value={title}
                    onChange={(e) =>
                      setTitle(e.target.value)
                    }
                    placeholder="mis. Follow up penawaran MSP"
                  />
                </div>

                <div>
                  <label className="input-label">
                    Tanggal &amp; Waktu
                  </label>
                  <input
                    className="input"
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              {/* CATATAN */}
              <div>
                <label className="input-label">
                  Catatan / Hasil
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="Hasil percakapan, jadwal follow up berikutnya, dll."
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>

            {/* LAMPIRAN */}
            <div
              className="crm-leads-modal-section"
              style={{
                padding: "20px 22px",
                border: `1px solid ${EXPORT_BRAND.border}`,
                borderRadius: 12,
                background: "#fff",
              }}
            >
              <div
                style={{
                  marginBottom: 12,
                  color: EXPORT_BRAND.navyText,
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                Lampiran / Foto Bukti
              </div>

              {!attachedFile ? (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.45rem",
                    minHeight: 116,
                    padding: "1rem",
                    border: `1.5px dashed ${EXPORT_BRAND.border}`,
                    borderRadius: 10,
                    cursor: "pointer",
                    color: EXPORT_BRAND.slate,
                    fontSize: "0.78rem",
                    background: EXPORT_BRAND.light,
                  }}
                >
                  <span style={{ fontSize: "1.4rem" }}>
                    📷
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: EXPORT_BRAND.navyText,
                    }}
                  >
                    Klik untuk upload foto atau dokumen
                  </span>
                  <span style={{ fontSize: "0.7rem" }}>
                    JPG, PNG, PDF — maks 50MB
                  </span>
                  <input
                    id="activity-file-input"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div
                  style={{
                    border: `1px solid ${EXPORT_BRAND.border}`,
                    borderRadius: 10,
                    overflow: "hidden",
                  }}
                >
                  {attachedFile.previewUrl && (
                    <img
                      src={attachedFile.previewUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: 190,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}

                  <div
                    style={{
                      padding: "0.7rem 0.85rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "1rem",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: EXPORT_BRAND.navyText,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {attachedFile.name}
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: "0.68rem",
                          color: EXPORT_BRAND.slate,
                        }}
                      >
                        {(
                          attachedFile.file.size / 1024
                        ).toFixed(1)}{" "}
                        KB
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      style={{
                        width: 30,
                        height: 30,
                        border: `1px solid ${EXPORT_BRAND.border}`,
                        borderRadius: 7,
                        background: "#fff",
                        cursor: "pointer",
                        color: EXPORT_BRAND.red,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="input-error">
                {error}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div
            className="crm-leads-modal-footer"
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.65rem",
              padding: "14px 28px",
              borderTop: `1px solid ${EXPORT_BRAND.border}`,
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Batal
            </Button>

            <Button
              type="submit"
              disabled={saving || uploadingFile}
              style={{
                minWidth: 150,
                background: EXPORT_BRAND.orange,
                color: EXPORT_BRAND.white,
                borderColor: EXPORT_BRAND.orange,
                fontWeight: 800,
              }}
            >
              {saving
                ? uploadingFile
                  ? "Mengupload file..."
                  : "Menyimpan..."
                : "Simpan Aktivitas"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

function LeadCard({
  card,
  onAddActivity,
  salesName,
  createdByName,
}: {
  card: LeadCardData;
  onAddActivity: () => void;
  salesName: string;
  createdByName: string;
}) {
  const { lead, activities } = card;
  const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.new;
  const sourceColor = SOURCE_CONFIG[lead.source ?? ""] ?? "#64748b";
  const kebutuhan = lead.notes || "—";
  const sales = salesName;

  return (
    <div className="crm-leads-detail-card">
      {/* HEADER DATA LEAD */}
      <div
        className="crm-leads-detail-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          paddingBottom: "1rem",
          marginBottom: "1rem",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "1.15rem",
              fontWeight: 800,
              color: "#16213d",
              marginBottom: "0.35rem",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {lead.company_name}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.4rem",
              fontSize: "0.78rem",
              color: "#64748b",
            }}
          >
            <span>{lead.lead_number}</span>
            <span>•</span>
            <span
              style={{
                display: "inline-block",
                padding: "3px 11px",
                borderRadius: 20,
                background: cfg.bg,
                color: cfg.color,
                fontSize: "0.68rem",
                fontWeight: 700,
              }}
            >
              {cfg.label}
            </span>
          </div>
        </div>
      </div>

      <div
        className="crm-leads-detail-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        {/* INFORMASI CALON CUSTOMER */}
        <section
          className="crm-leads-info-panel"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            className="crm-leads-panel-heading"
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #e5e7eb",
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#16213d",
            }}
          >
            Informasi Calon Customer
          </div>

          <div
            className="crm-leads-panel-body"
            style={{
              padding: "16px",
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px 24px",
            }}
          >
            {[
              ["NAMA CONTACT", lead.contact_name ?? "—"],
              ["TELEPON", lead.phone ?? "—"],
              ["SUMBER LEAD", lead.source ?? "—"],
              ["PIC", sales],
              ["DIBUAT OLEH", createdByName],
            ].map(([label, value]) => (
              <div key={label} style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#64748b",
                    fontWeight: 700,
                    marginBottom: 3,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color:
                      label === "SUMBER LEAD"
                        ? sourceColor
                        : "#16213d",
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                    textTransform:
                      label === "SUMBER LEAD"
                        ? "capitalize"
                        : undefined,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}

            {/* KEBUTUHAN AWAL */}
            <div
              style={{
                gridColumn: "1 / -1",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "#64748b",
                  fontWeight: 700,
                  marginBottom: 3,
                }}
              >
                KEBUTUHAN AWAL
              </div>

              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#16213d",
                  fontWeight: 600,
                  overflowWrap: "anywhere",
                }}
              >
                {kebutuhan}
              </div>
            </div>

            {/* EMAIL */}
            {lead.email && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#64748b",
                    fontWeight: 700,
                    marginBottom: 3,
                  }}
                >
                  EMAIL
                </div>

                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#16213d",
                    fontWeight: 600,
                    overflowWrap: "anywhere",
                  }}
                >
                  {lead.email}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* AKTIVITAS & FOLLOW UP */}
        <section
          className="crm-leads-activity-panel"
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <div
            className="crm-leads-panel-heading"
            style={{
              padding: "12px 14px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <span
              style={{
                fontSize: "0.88rem",
                fontWeight: 800,
                color: "#16213d",
              }}
            >
              Aktivitas &amp; Follow Up
            </span>

            <Button
              variant="secondary"
              onClick={onAddActivity}
              style={{
                padding: "6px 10px",
                fontSize: "0.7rem",
              }}
            >
              <Plus size={13} /> Tambah
            </Button>
          </div>

          <div
            className="crm-leads-panel-body"
            style={{
              padding: "10px 16px",
              maxHeight: 330,
              overflowY: "auto",
            }}
          >
            {activities.length === 0 ? (
              <div
                style={{
                  padding: "1.25rem 0",
                  color: "#94a3b8",
                  fontSize: "0.78rem",
                  textAlign: "center",
                }}
              >
                Belum ada aktivitas atau follow up.
              </div>
            ) : (
              activities.map((a, i) => (
                <div
                  key={a.id}
                  className="crm-leads-activity-item"
                  style={{
                    padding: "10px 0",
                    borderBottom:
                      i < activities.length - 1
                        ? "1px solid #e5e7eb"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "0.75rem",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.8rem",
                          }}
                        >
                          {TYPE_ICONS[a.type] ?? "•"}
                        </span>

                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#16213d",
                          }}
                        >
                          {a.title}
                        </span>

                        {/* SUMBER AKTIVITAS */}
                        {a.source &&
                          a.source !== "lead" && (
                            <span
                              style={{
                                padding: "2px 7px",
                                borderRadius: 99,
                                background: "#f1f5f9",
                                color: "#64748b",
                                fontSize: "0.62rem",
                                fontWeight: 700,
                              }}
                            >
                              {SOURCE_LABELS[a.source] ??
                                a.source}
                            </span>
                          )}

                        {/* LINK DETAIL */}
                        {a.link && (
                          <Link
                            to={a.link}
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--accent)",
                              fontWeight: 600,
                              textDecoration: "none",
                            }}
                          >
                            Lihat →
                          </Link>
                        )}
                      </div>

                      {/* DESKRIPSI AKTIVITAS */}
                      {a.description && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: "0.72rem",
                            color: "#64748b",
                            lineHeight: 1.45,
                          }}
                        >
                          {a.description}
                        </div>
                      )}

                      {/* LAMPIRAN */}
                      <ActivityAttachment
                        fileId={a.file_id}
                        mimeType={a.mime_type}
                        originalName={a.original_name}
                      />
                    </div>

                    {/* TANGGAL AKTIVITAS */}
                    <div
                      style={{
                        flexShrink: 0,
                        fontSize: "0.68rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(
                        a.performed_at
                      ).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

// FILTER BULAN DAN TAHUN
const BULAN = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Agu" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Okt" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Des" },
];

export function LeadListPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  // STATE PAGINATION
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(CRM_DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<LeadStatus | "">("");

  // FILTER JADWAL
  const [scheduleType, setScheduleType] =
    useState<"daily" | "monthly" | "all">("all");

  const [selectedMonth, setSelectedMonth] =
    useState(currentMonth);

  const [selectedYear, setSelectedYear] =
    useState(String(currentYear));

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  // TAB MARKETING DAN PROSPEK
  const [marketingSub, setMarketingSub] =
    useState<"marketing" | "lead-management">(
      "marketing"
    );

  // STATE FORM DAN MODAL
  const [showForm, setShowForm] = useState(false);
  const [showExportModal, setShowExportModal] =
    useState(false);

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [activityMap, setActivityMap] =
    useState<Record<number, ActivityItem[]>>({});

  const [addActivityFor, setAddActivityFor] =
    useState<{
      id: number;
      name: string;
    } | null>(null);

  // DATA USER DAN SALES
  const { data: salesUserList } =
    useUserList({ per_page: 100 });

  const { data: picUserList } =
    useCrmPicUsers();

  // FILTER TANGGAL
  const dateFrom =
    scheduleType === "daily"
      ? selectedDate
      : scheduleType === "monthly"
        ? firstDay(
            parseInt(selectedYear),
            selectedMonth
          )
        : undefined;

  const dateTo =
    scheduleType === "daily"
      ? selectedDate
      : scheduleType === "monthly"
        ? lastDay(
            parseInt(selectedYear),
            selectedMonth
          )
        : undefined;

  // FILTER STATUS
  const effectiveStatusFilter: LeadStatus | "" =
    marketingSub === "marketing"
      ? "converted"
      : statusFilter;

  // ===================================
  // PAGINATION: JUMLAH DATA SESUAI PILIHAN
  // ===================================

  const searchTerm = search.trim().toLowerCase();

  // MARKETING
  // Menggunakan pagination dari backend
  const {
    data: marketingData,
    isLoading: marketingLoading,
  } = useLeadList({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
    status: "converted",
    date_from: dateFrom,
    date_to: dateTo,
  });

  // PROSPEK
  // Mengambil data kemudian memfilter
  // sebelum melakukan pagination
  const {
    data: prospectRecords = [],
    isLoading: prospectLoading,
  } = useQuery({
    queryKey: [
      "crm-sales",
      "prospect-records",
      statusFilter,
      dateFrom,
      dateTo,
    ],

    enabled: marketingSub === "lead-management",

    queryFn: async (): Promise<Lead[]> => {
      const records: Lead[] = [];
      let currentPage = 1;

      while (true) {
        const response = await leadApi.list({
          page: currentPage,
          per_page: 100,
          status: statusFilter || undefined,
          date_from: dateFrom,
          date_to: dateTo,
        });

        records.push(...response.data.data);

        if (
          currentPage >= response.data.last_page ||
          response.data.data.length === 0
        ) {
          break;
        }

        currentPage += 1;
      }

      return records.filter(
        (lead) => lead.status !== "converted"
      );
    },
  });

  // FUNGSI SEARCH
  const matchesSearch = (lead: Lead): boolean => {
    if (!searchTerm) return true;

    const values = [
      lead.company_name,
      lead.contact_name,
      lead.email,
      lead.phone,
      lead.lead_number,
      lead.source,
      getSalesName(lead),
      lead.notes || "—",
    ];

    return values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(searchTerm)
    );
  };

  // FILTER HASIL PENCARIAN PROSPEK
  const matchingProspects =
    prospectRecords.filter(matchesSearch);

  // HITUNG JUMLAH HALAMAN PROSPEK
  const prospectTotalPages = Math.max(
    1,
    Math.ceil(
      matchingProspects.length / perPage
    )
  );

  // BAGI PROSPEK SESUAI JUMLAH DATA PER HALAMAN
  const prospectData = {
    data: matchingProspects.slice(
      (page - 1) * perPage,
      page * perPage
    ),

    total: matchingProspects.length,
    current_page: page,
    last_page: prospectTotalPages,
  };

  // PILIH DATA SESUAI TAB
  const data =
    marketingSub === "marketing"
      ? marketingData
      : prospectData;

  const isLoading =
    marketingSub === "marketing"
      ? marketingLoading
      : prospectLoading;

  const allLeads = data?.data ?? [];

  const marketingLeads = allLeads.filter(
    (lead) => lead.status === "converted"
  );

  const leadManagementLeads = allLeads.filter(
    (lead) => lead.status !== "converted"
  );

  const visibleLeads = (
    marketingSub === "marketing"
      ? marketingLeads
      : leadManagementLeads
  ).filter(matchesSearch);

  // CEGAH HALAMAN KOSONG
  // SAAT JUMLAH DATA BERKURANG
  useEffect(() => {
    if (
      !isLoading &&
      data &&
      page > data.last_page
    ) {
      setPage(Math.max(1, data.last_page));
    }
  }, [isLoading, data?.last_page, page]);

  // STATISTIK MARKETING
  const marketingStats = {
    total: data?.total ?? 0,

    baru: allLeads.filter(
      (lead) => lead.status === "new"
    ).length,

    followUp: allLeads.filter(
      (lead) => lead.status === "contacted"
    ).length,

    qualified: allLeads.filter(
      (lead) => lead.status === "qualified"
    ).length,
  };

  // STATISTIK PROSPEK
  const leadManagementStats = {
    followUp: leadManagementLeads.filter(
      (lead) => lead.status === "contacted"
    ).length,

    qualified: leadManagementLeads.filter(
      (lead) => lead.status === "qualified"
    ).length,

    won: leadManagementLeads.filter(
      (lead) => lead.status === "qualified"
    ).length,

    lost: leadManagementLeads.filter(
      (lead) => lead.status === "unqualified"
    ).length,
  };

  // ==========================================
  // KPI MARKETING
  // ==========================================

  const marketingKpiCards = [
    {
      label: "TOTAL PROSPEK",
      value: marketingStats.total,
      note: `▲ ${marketingStats.baru} baru`,
      noteColor: "#16a34a",
      icon: <Users size={19} strokeWidth={2.1} />,
      iconColor: "#2563EB",
      iconBackground: "#EFF6FF",
    },
    {
      label: "LEAD BARU",
      value: marketingStats.baru,
      note: "Minggu ini",
      noteColor: "#d99200",
      icon: <UserPlus size={19} strokeWidth={2.1} />,
      iconColor: "#059669",
      iconBackground: "#ECFDF5",
    },
    {
      label: "FOLLOW UP",
      value: marketingStats.followUp,
      note: "Dalam proses",
      noteColor: "#64748b",
      icon: <Clock size={19} strokeWidth={2.1} />,
      iconColor: "#D97706",
      iconBackground: "#FFFBEB",
    },
    {
      label: "QUALIFIED LEAD",
      value: marketingStats.qualified,
      note: "▲ Siap Opportunity",
      noteColor: "#16a34a",
      icon: <CheckCircle2 size={19} strokeWidth={2.1} />,
      iconColor: "#7C3AED",
      iconBackground: "#F5F3FF",
    },
  ];

  // ==========================================
  // KPI PROSPEK / LEAD MANAGEMENT
  // ==========================================

  const leadManagementKpiCards = [
    {
      label: "FOLLOW UP",
      value: leadManagementStats.followUp,
      note: "Dalam proses",
      noteColor: "#64748b",
      icon: <Clock size={19} strokeWidth={2.1} />,
      iconColor: "#D97706",
      iconBackground: "#FFFBEB",
    },
    {
      label: "QUALIFIED",
      value: leadManagementStats.qualified,
      note: "Siap Opportunity",
      noteColor: "#16a34a",
      icon: <CheckCircle2 size={19} strokeWidth={2.1} />,
      iconColor: "#059669",
      iconBackground: "#ECFDF5",
    },
    {
      label: "QUALIFIED / UNQUALIFIED",
      value: `${leadManagementStats.won} / ${leadManagementStats.lost}`,
      note: "Status kualifikasi Lead (bukan Opportunity)",
      noteColor: "#64748b",
      icon: <ClipboardList size={19} strokeWidth={2.1} />,
      iconColor: "#7C3AED",
      iconBackground: "#F5F3FF",
    },
  ];

  // KPI mengikuti tab yang sedang dipilih
  const activeKpiCards =
    marketingSub === "marketing"
      ? marketingKpiCards
      : leadManagementKpiCards;

  // ==========================================
  // MEMBACA FIELD TAMBAHAN LEAD
  // ==========================================

  function readLeadField(
    lead: Lead,
    keys: string[]
  ): string {
    const row = lead as unknown as Record<string, unknown>;

    for (const key of keys) {
      const value = row[key];

      if (
        typeof value === "string" &&
        value.trim()
      ) {
        return value;
      }

      if (typeof value === "number") {
        return String(value);
      }

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        const nested =
          value as Record<string, unknown>;

        for (const nestedKey of [
          "name",
          "full_name",
          "label",
          "title",
        ]) {
          const nestedValue = nested[nestedKey];

          if (
            typeof nestedValue === "string" &&
            nestedValue.trim()
          ) {
            return nestedValue;
          }
        }
      }
    }

    return "—";
  }

  // ==========================================
  // MENDAPATKAN NAMA SALES / PIC
  // ==========================================

  function getSalesName(lead: Lead): string {
    const direct =
      (picUserList ?? []).find(
        item =>
          item.employee_id != null && item.employee_id === lead.sales_employee_id
      ) ??
      (picUserList ?? []).find(
        item => item.user_id != null && item.user_id === lead.assigned_to
      );

    if (direct) {
      return direct.full_name;
    }

    // Untuk Lead historis, pencocokan nama
    // hanya dianggap valid jika unik dan utuh.
    const key = (lead.pic ?? "")
      .trim()
      .toLocaleLowerCase("id-ID");

    const matches = key
      ? (picUserList ?? []).filter(
          item =>
            item.full_name
              .trim()
              .toLocaleLowerCase("id-ID") === key ||
            item.user_name
              ?.trim()
              .toLocaleLowerCase("id-ID") === key
        )
      : [];

    return matches.length === 1
      ? matches[0].full_name
      : lead.pic?.trim() || "—";
  }

  // ==========================================
  // MENDAPATKAN NAMA PEMBUAT LEAD
  // ==========================================

  function getCreatedByName(lead: Lead): string {
    const value = readLeadField(lead, [
      "created_by_name",
      "creator_name",
      "created_by_user",
      "creator",
      "created_by",
    ]);

    if (value === "—") {
      return "—";
    }

    const user = salesUserList?.data?.find(
      item => String(item.id) === value.trim()
    );

    if (user) {
      return user.name;
    }

    return /^\d+$/.test(value.trim())
      ? `ID ${value.trim()}`
      : value;
  }

  // ==========================================
  // MEMBUKA DETAIL LEAD
  // ==========================================

  function openLeadDetail(lead: Lead) {
    setSelectedLead(lead);

    // Ambil aktivitas saat halaman detail dibuka
    if (!activityMap[lead.id]) {
      apiClient
        .get<{ data: ActivityItem[] }>(
          `/v1/crm-sales/leads/${lead.id}/activities`
        )
        .then((response) => {
          setActivityMap((prev) => ({
            ...prev,
            [lead.id]: response.data.data ?? [],
          }));
        })
        .catch(() => {});
    }
  }

  // ==========================================
  // MENAMBAHKAN AKTIVITAS KE RIWAYAT
  // ==========================================

  function handleActivityAdded(
    leadId: number,
    activity: ActivityItem
  ) {
    setActivityMap((prev) => ({
      ...prev,
      [leadId]: [
        activity,
        ...(prev[leadId] ?? []),
      ],
    }));
  }

  // ==========================================
  // MENGAMBIL DATA UNTUK EXPORT
  // ==========================================

  async function fetchExportLeads(): Promise<Lead[]> {
    const all: Lead[] = [];
    let currentPage = 1;

    while (true) {
      const response = await apiClient.get(
        "/v1/crm-sales/leads",
        {
          params: {
            page: currentPage,
            per_page: 500,
            status: effectiveStatusFilter || undefined,
            date_from: dateFrom,
            date_to: dateTo,
            search: search.trim() || undefined,
          },
        }
      );

      const payload = response.data as {
        data?: Lead[];
        last_page?: number;
      };

      all.push(...(payload.data ?? []));

      if (
        currentPage >= (payload.last_page ?? 1) ||
        !payload.data?.length
      ) {
        break;
      }

      currentPage++;
    }

    return all.filter((lead) =>
      marketingSub === "marketing"
        ? lead.status === "converted"
        : lead.status !== "converted"
    );
  }

  // ==========================================
  // JUDUL LAPORAN EXPORT
  // ==========================================

  function exportTitle() {
    return marketingSub === "marketing"
      ? "Marketing & Prospek - Customer"
      : "Marketing & Prospek - Lead Management";
  }

  // ==========================================
  // KPI LAPORAN EXPORT
  // ==========================================

  function buildExportKpis(leads: Lead[]) {
    if (marketingSub === "marketing") {
      return [
        {
          label: "TOTAL PELANGGAN",
          value: String(leads.length),
          note: "Lead yang sudah menjadi customer",
          color: EXPORT_BRAND.green,
        },
        {
          label: "WEBSITE",
          value: String(
            leads.filter(
              (lead) => lead.source === "website"
            ).length
          ),
          note: "Sumber Situs Web",
          color: EXPORT_BRAND.slate,
        },
        {
          label: "REFERRAL",
          value: String(
            leads.filter(
              (lead) => lead.source === "referral"
            ).length
          ),
          note: "Sumber Referral",
          color: EXPORT_BRAND.slate,
        },
        {
          label: "EVENT / LAINNYA",
          value: String(
            leads.filter(
              (lead) =>
                lead.source !== "website" &&
                lead.source !== "referral"
            ).length
          ),
          note: "Sumber lainnya",
          color: EXPORT_BRAND.slate,
        },
      ];
    }

    const followUp = leads.filter(
      (lead) => lead.status === "contacted"
    ).length;

    const qualified = leads.filter(
      (lead) => lead.status === "qualified"
    ).length;

    const won = leads.filter(
      (lead) => lead.status === "qualified"
    ).length;

    const lost = leads.filter(
      (lead) => lead.status === "unqualified"
    ).length;

    return [
      {
        label: "FOLLOW UP",
        value: String(followUp),
        note: "Dalam proses",
        color: EXPORT_BRAND.slate,
      },
      {
        label: "QUALIFIED",
        value: String(qualified),
        note: "Siap Opportunity",
        color: EXPORT_BRAND.green,
      },
      {
        label: "WON",
        value: String(won),
        note: "Lead dimenangkan",
        color: EXPORT_BRAND.green,
      },
      {
        label: "LOST",
        value: String(lost),
        note: "Lead tidak berlanjut",
        color: EXPORT_BRAND.red,
      },
    ];
  }

  // ==========================================
  // MENYIAPKAN BARIS DATA LAPORAN
  // ==========================================

  function exportRows(leads: Lead[]) {
    const sourceLabel: Record<string, string> = {
      website: "Situs Web",
      marketing: "Marketing",
      event: "Event",
      referral: "Referral",
      sales: "Sales",
      other: "Lainnya",
    };

    return leads.map((lead) => {
      const kebutuhan = readLeadField(lead, [
        "need",
        "needs",
        "requirement",
        "requirements",
        "service_interest",
        "interested_service",
        "service_name",
      ]);

      const sales = getSalesName(lead);

      const contactDate = readLeadField(lead, [
        "last_contact_at",
        "contacted_at",
        "contact_date",
        "updated_at",
        "created_at",
      ]);

      return {
        customer: lead.company_name,
        pic: lead.contact_name ?? "—",
        source:
          sourceLabel[lead.source ?? ""] ??
          lead.source ??
          "—",
        sales,
        service: kebutuhan,
        date:
          contactDate === "—"
            ? "—"
            : formatDate(contactDate),
        status:
          STATUS_CONFIG[lead.status]?.label ??
          lead.status,
      };
    });
  }

  // ==========================================
  // EXPORT LAPORAN KE PDF
  // ==========================================

  async function handleExportPdf() {
    setShowExportModal(false);

    const exportedAt = new Date();
    const leads = await fetchExportLeads();
    const rows = exportRows(leads);
    const kpis = buildExportKpis(leads);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    const drawHeader = () => {
      drawMsdcPdfHeader(doc, {
        title: exportTitle(),
        subtitle: "Aktivitas marketing, calon customer, dan proses lead",
        docLabel: "Laporan Prospek",
        marginX: 10,
      });

      doc.setTextColor(EXPORT_BRAND.slate);
      doc.setFontSize(7.5);

      doc.text("MSDC Surabaya | CRM & Sales", 10, 43);

      doc.text(
        `Diekspor: ${exportDateText(exportedAt)}`,
        W - 10,
        43,
        {
          align: "right",
        }
      );
    };

    drawHeader();

    let y = 50;
    const gap = 3;
    const cardW =
      (W - 20 - gap * (kpis.length - 1)) /
      kpis.length;

    // KARTU RINGKASAN KPI
    kpis.forEach((kpi, index) => {
      const x = 10 + index * (cardW + gap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(229, 231, 235);
      doc.roundedRect(x, y, cardW, 18, 2, 2, "FD");

      doc.setTextColor(EXPORT_BRAND.slate);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.2);
      doc.text(kpi.label, x + 3, y + 5);

      doc.setTextColor(EXPORT_BRAND.navyText);
      doc.setFontSize(11);
      doc.text(kpi.value, x + 3, y + 11);

      doc.setTextColor(kpi.color);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(5.7);
      doc.text(kpi.note, x + 3, y + 15.5, {
        maxWidth: cardW - 6,
      });
    });

    y += 25;

    // JUDUL TABEL LAPORAN
    doc.setTextColor(EXPORT_BRAND.navyText);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);

    doc.text(
      marketingSub === "marketing"
        ? "Daftar Customer"
        : "Daftar Lead Management",
      10,
      y
    );

    y += 3;

    const marketing =
      marketingSub === "marketing";

    // TABEL DATA LAPORAN
    autoTable(doc, {
      startY: y,
      head: [
        marketing
          ? [
              "Calon Pelanggan",
              "Nama Contact",
              "Sumber",
              "PIC",
              "Catatan",
              "Tgl Kontak",
            ]
          : [
              "Calon Pelanggan",
              "Nama Contact",
              "Sumber",
              "PIC",
              "Catatan",
              "Tgl Kontak",
              "Status",
            ],
      ],

      body: rows.map((row) =>
        marketing
          ? [
              row.customer,
              row.pic,
              row.source,
              row.sales,
              row.service,
              row.date,
            ]
          : [
              row.customer,
              row.pic,
              row.source,
              row.sales,
              row.service,
              row.date,
              row.status,
            ]
      ),

      theme: "grid",

      margin: {
        left: 10,
        right: 10,
        top: 50,
        bottom: 12,
      },

      styles: {
        font: "helvetica",
        fontSize: 6.4,
        cellPadding: 1.8,
        textColor: EXPORT_BRAND.navyText,
        lineColor: EXPORT_BRAND.border,
        lineWidth: 0.15,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: EXPORT_BRAND.navy,
        textColor: "#FFFFFF",
        fontStyle: "bold",
      },

      alternateRowStyles: {
        fillColor: EXPORT_BRAND.light,
      },

      didDrawPage: drawHeader,
    });

    // NOMOR HALAMAN PDF
    const pages = doc.getNumberOfPages();

    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setTextColor(EXPORT_BRAND.slate);
      doc.setFontSize(7);

      doc.text(
        `Halaman ${page} / ${pages}`,
        W - 10,
        H - 5,
        {
          align: "right",
        }
      );
    }

    // DOWNLOAD PDF
    const suffix = marketing
      ? "customer"
      : "lead-management";

    doc.save(
      `msdc-${suffix}-${exportedAt
        .toISOString()
        .slice(0, 10)}.pdf`
    );
  }

  async function handleExportExcel() {
    setShowExportModal(false);

    try {
    const exportedAt = new Date();
    const leads = await fetchExportLeads();
    const rows = exportRows(leads);
    const kpis = buildExportKpis(leads);
    const marketing = marketingSub === "marketing";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MSDC Surabaya - CRM & Sales";
    workbook.company = "MSDC Surabaya";
    workbook.created = exportedAt;

    const ws = workbook.addWorksheet(
      marketing ? "Marketing Customer" : "Lead Management",
      {
        views: [{ showGridLines: false }],
        pageSetup: {
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      }
    );

    for (let column = 1; column <= 8; column += 1) {
      ws.getColumn(column).width = 18;
    }

    for (let row = 1; row <= 4; row += 1) {
      for (let column = 1; column <= 8; column += 1) {
        ws.getCell(row, column).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF092747" },
        };
      }
    }

    const msdcImage = workbook.addImage({
      base64: MSDC_EXPORT_LOGO,
      extension: "png",
    });

    ws.addImage(msdcImage, {
      tl: { col: 0.1, row: 0.05 },
      ext: { width: 150, height: 82 },
    });

    ws.mergeCells("C2:F2");
    ws.getCell("C2").value = exportTitle();
    ws.getCell("C2").font = {
      name: "Aptos Display",
      size: 18,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    ws.getCell("C2").alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    ws.mergeCells("C3:F3");
    ws.getCell("C3").value =
      "Aktivitas marketing, calon customer, dan proses lead";
    ws.getCell("C3").font = {
      size: 9,
      color: { argb: "FFD2DEEA" },
    };
    ws.getCell("C3").alignment = {
      horizontal: "center",
    };

    ws.mergeCells("G2:H2");
    ws.getCell("G2").value = "CRM & SALES";
    ws.getCell("G2").font = {
      size: 10,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    ws.getCell("G2").alignment = {
      horizontal: "right",
    };

    ws.mergeCells("G3:H3");
    ws.getCell("G3").value =
      "MSDC Surabaya | Laporan Prospek";
    ws.getCell("G3").font = {
      size: 8,
      color: { argb: "FFD2DEEA" },
    };
    ws.getCell("G3").alignment = {
      horizontal: "right",
    };

    for (let column = 1; column <= 8; column += 1) {
      ws.getCell(5, column).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF7AB00" },
      };
    }

    ws.getRow(5).height = 5;

    ws.mergeCells("A6:D6");
    ws.getCell("A6").value =
      "MSDC Surabaya | CRM & Sales";
    ws.getCell("A6").font = {
      size: 9,
      bold: true,
      color: { argb: "FF64748B" },
    };

    ws.mergeCells("E6:H6");
    ws.getCell("E6").value =
      `Diekspor: ${exportDateText(exportedAt)}`;
    ws.getCell("E6").alignment = {
      horizontal: "right",
    };
    ws.getCell("E6").font = {
      size: 9,
      color: { argb: "FF64748B" },
    };

    let row = 8;

    // KARTU KPI
    kpis.forEach((kpi, index) => {
      const startColumn = 1 + index * 2;
      const endColumn = startColumn + 1;

      ws.mergeCells(
        row, startColumn, row, endColumn
      );
      ws.mergeCells(
        row + 1, startColumn, row + 1, endColumn
      );
      ws.mergeCells(
        row + 2, startColumn, row + 2, endColumn
      );

      ws.getCell(row, startColumn).value = kpi.label;
      ws.getCell(row + 1, startColumn).value = kpi.value;
      ws.getCell(row + 2, startColumn).value = kpi.note;

      ws.getCell(row, startColumn).font = {
        size: 8,
        bold: true,
        color: { argb: "FF64748B" },
      };

      ws.getCell(row + 1, startColumn).font = {
        size: 14,
        bold: true,
        color: { argb: "FF16213D" },
      };

      ws.getCell(row + 2, startColumn).font = {
        size: 8,
        color: {
          argb:
            kpi.color === EXPORT_BRAND.red
              ? "FFDC2626"
              : kpi.color === EXPORT_BRAND.green
                ? "FF16A34A"
                : "FF64748B",
        },
      };

      for (
        let rr = row;
        rr <= row + 2;
        rr += 1
      ) {
        for (
          let cc = startColumn;
          cc <= endColumn;
          cc += 1
        ) {
          ws.getCell(rr, cc).fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: {
              argb: "FFF8FAFC",
            },
          };

          ws.getCell(rr, cc).border = {
            top: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
            bottom: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
            left: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
            right: {
              style: "thin",
              color: { argb: "FFE5E7EB" },
            },
          };
        }
      }
    });

    row += 5;

    // JUDUL DAFTAR
    ws.mergeCells(row, 1, row, 8);
    ws.getCell(row, 1).value = marketing
      ? "Daftar Customer"
      : "Daftar Lead Management";

    ws.getCell(row, 1).font = {
      size: 11,
      bold: true,
      color: { argb: "FF16213D" },
    };

    row += 1;

    // HEADER TABEL
    const headers = marketing
      ? [
          "Calon Pelanggan",
          "Nama Contact",
          "Sumber",
          "PIC",
          "Catatan",
          "Tgl Kontak",
        ]
      : [
          "Calon Pelanggan",
          "Nama Contact",
          "Sumber",
          "PIC",
          "Catatan",
          "Tgl Kontak",
          "Status",
        ];

    headers.forEach((header, index) => {
      const cell = ws.getCell(row, index + 1);

      cell.value = header;
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF092747" },
      };
      cell.font = {
        bold: true,
        size: 8,
        color: { argb: "FFFFFFFF" },
      };
      cell.alignment = {
        vertical: "middle",
        wrapText: true,
      };
    });

    row += 1;

    // ISI TABEL
    rows.forEach((item, rowIndex) => {
      const values = marketing
        ? [
            item.customer,
            item.pic,
            item.source,
            item.sales,
            item.service,
            item.date,
          ]
        : [
            item.customer,
            item.pic,
            item.source,
            item.sales,
            item.service,
            item.date,
            item.status,
          ];

      values.forEach((value, index) => {
        const cell = ws.getCell(
          row,
          index + 1
        );

        cell.value = value;
        cell.font = {
          size: 8,
          color: { argb: "FF16213D" },
          bold: index === 0,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb:
              rowIndex % 2
                ? "FFF8FAFC"
                : "FFFFFFFF",
          },
        };
        cell.border = {
          bottom: {
            style: "hair",
            color: { argb: "FFE5E7EB" },
          },
        };
        cell.alignment = {
          vertical: "top",
          wrapText: true,
        };
      });

      row += 1;
    });

    // UKURAN KOLOM
    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 22;
    ws.getColumn(3).width = 16;
    ws.getColumn(4).width = 20;
    ws.getColumn(5).width = 28;
    ws.getColumn(6).width = 18;
    ws.getColumn(7).width = 18;
    ws.getColumn(8).width = 12;

    ws.views = [
      {
        state: "frozen",
        ySplit: 6,
        showGridLines: false,
      },
    ];

    ws.headerFooter.oddFooter =
      "&LMSDC Surabaya - CRM & Sales&CMarketing & Prospek&RPage &P / &N";

    // DOWNLOAD EXCEL
    const buffer =
      await workbook.xlsx.writeBuffer();

    const suffix = marketing
      ? "customer"
      : "lead-management";

    downloadBlob(
      new Blob(
        [buffer as unknown as BlobPart],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      ),
      `msdc-${suffix}-${exportedAt
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
    } catch (error) {
      console.error("Gagal mengekspor Marketing/Prospek ke Excel:", error);
      window.alert("File Excel gagal dibuat atau diunduh. Silakan coba kembali.");
    }
  }

  // ==========================================
  // TAMPILAN FORM TAMBAH PROSPEK
  // ==========================================

  
  if (showForm) {
    return (
      <LeadCreatePage
        onBack={() => setShowForm(false)}
        onCreated={(createdLead) => {
          setShowForm(false);
          openLeadDetail(createdLead);
        }}
      />
    );
  }
  
  // ==========================================
  // TAMPILAN DETAIL PROSPEK
  // ==========================================

  if (selectedLead) {
    return (
      <div className="crm-leads-ui crm-leads-detail">
        <LeadPageStyles />
        <PageHeader
          title="Detail Prospek"
          subtitle="Informasi calon customer dan riwayat aktivitas prospek."
          containerClassName="px-7 pt-5 pb-2"
        />

        <div
          className="crm-leads-content"
          style={{
            margin: "0 2rem 2rem",
            paddingTop: "1rem",
          }}
        >
          {/* Aksi kontekstual Lead: kembali di kiri, lanjut Opportunity di kanan */}
          <div className="crm-leads-detail-actions" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "1rem" }}>
            <button type="button" className="crm-leads-back-button crm-msdc-back-button" onClick={() => { setSelectedLead(null); setAddActivityFor(null); }}>
              <ArrowLeft size={17} strokeWidth={2.25} aria-hidden="true" /> Kembali ke Prospek
            </button>
            {selectedLead.status !== "unqualified" && selectedLead.status !== "converted" && (
              <Link className="crm-leads-next-opportunity" to={`/crm-sales/opportunities?create=1&lead_id=${selectedLead.id}`}
                style={{ display: "inline-flex", alignItems: "center", padding: "0.7rem 0.95rem", borderRadius: 8,
                  background: "#F7AB00", color: "#fff", fontSize: "0.8rem", fontWeight: 800, textDecoration: "none" }}>
                Lanjut ke Opportunity →
              </Link>
            )}
          </div>

          {/* INFORMASI DETAIL LEAD */}
          <LeadCard
            salesName={getSalesName(selectedLead)}
            createdByName={getCreatedByName(selectedLead)}
            card={{
              lead: selectedLead,
              expanded: true,
              activities: activityMap[selectedLead.id] ?? [],
            }}
            onAddActivity={() =>
              setAddActivityFor({
                id: selectedLead.id,
                name: selectedLead.company_name,
              })
            }
          />
        </div>


        {/* MODAL TAMBAH AKTIVITAS */}
        {addActivityFor && (
          <AddActivityModal
            leadId={addActivityFor.id}
            leadName={addActivityFor.name}
            onClose={() => setAddActivityFor(null)}
            onAdded={(activity) => {
              handleActivityAdded(
                addActivityFor.id,
                activity
              );
              setAddActivityFor(null);
            }}
          />
        )}
      </div>
    );
  }

  // ==========================================
  // HALAMAN UTAMA MARKETING & PROSPEK
  // ==========================================

  return (
    <div className="crm-leads-ui crm-leads-list">
      <LeadPageStyles />
      <PageHeader
        title="Marketing & Prospek"
        subtitle="Aktivitas marketing, calon customer, dan proses lead"
        containerClassName="px-7 pt-5 pb-2"
      />

      {/* NAVIGASI TAB MARKETING DAN PROSPEK */}
      <div
        className="crm-leads-tabs"
        style={{
          display: "flex",
          gap: 8,
          padding: "0 2rem 1.25rem",
        }}
      >
        {/* TAB MARKETING */}
        <button
          type="button"
          onClick={() => {
            setMarketingSub("marketing");
            setSearch("");
            setStatusFilter("");
            setPage(1);
          }}
          className={`crm-leads-tab ${marketingSub === "marketing" ? "is-active" : ""}`}
          style={{
            padding: "8px 16px",
            fontSize: "0.78rem",
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background:
              marketingSub === "marketing"
                ? "#0b1c33"
                : "#f1f5f9",
            color:
              marketingSub === "marketing"
                ? "#fff"
                : "#64748b",
          }}
        >
          Marketing
        </button>

        {/* TAB PROSPEK */}
        <button
          type="button"
          onClick={() => {
            setMarketingSub("lead-management");
            setSearch("");

            if (statusFilter === "converted") {
              setStatusFilter("");
            }

            setPage(1);
          }}
          className={`crm-leads-tab ${marketingSub === "lead-management" ? "is-active" : ""}`}
          style={{
            padding: "8px 16px",
            fontSize: "0.78rem",
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background:
              marketingSub === "lead-management"
                ? "#0b1c33"
                : "#f1f5f9",
            color:
              marketingSub === "lead-management"
                ? "#fff"
                : "#64748b",
          }}
        >
          Prospek
        </button>

        {marketingSub === "marketing" && (
          <div className="crm-leads-campaign-status" aria-label="Campaign aktif: 0, belum terhubung">
            <span className="crm-leads-campaign-status__icon" aria-hidden="true">
              <Activity size={15} strokeWidth={2.1} />
            </span>
            <span>Campaign Aktif</span>
            <strong>0</strong>
            <span>Belum terhubung</span>
          </div>
        )}
      </div>

      {/* KARTU KPI SESUAI TAB */}
      <div className="crm-leads-kpis">
        {activeKpiCards.map((k) => (
          <article
            key={k.label}
            className="crm-leads-kpi"
            role="group"
            tabIndex={0}
            aria-label={`${k.label}: ${k.value}`}
          >
            <div className="crm-leads-kpi__heading">
              <span
                className="crm-leads-kpi__icon"
                style={{
                  color: k.iconColor,
                  backgroundColor: k.iconBackground,
                }}
                aria-hidden="true"
              >
                {k.icon}
              </span>
              <span className="crm-leads-kpi__label">{k.label}</span>
            </div>

            <div className="crm-leads-kpi__content">
              <div className="crm-leads-kpi__value">{k.value}</div>
              <div
                className="crm-leads-kpi__note"
                style={{ color: k.noteColor }}
              >
                {k.note}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* DAFTAR MARKETING & PROSPEK */}
      <div
        className="crm-leads-list-card"
        style={{
          margin: "0 2rem 1.25rem",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        {/* HEADER DAFTAR CUSTOMER */}
        {marketingSub === "marketing" && (
          <div
            className="crm-leads-list-heading"
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <h3
              className="crm-leads-list-title"
              style={{
                margin: 0,
                fontSize: "0.86rem",
                color: "#16213d",
                fontWeight: 800,
              }}
            >
              Daftar Customer
            </h3>

            <Button
              style={{ fontSize: "0.76rem" }}
              onClick={() => setShowForm(true)}
            >
              <Plus size={14} /> Prospek Baru
            </Button>
          </div>
        )}

        {/* TOOLBAR SEARCH DAN FILTER */}
        <div
          className="crm-leads-toolbar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            flexWrap: "wrap",
          }}
        >
          {/* SEARCH */}
          <div
            className="crm-leads-search"
            style={{
              flex: 1,
              minWidth: 240,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#f1f5f9",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "9px 12px",
            }}
          >
            <Search size={16} color="#64748b" />

            <input
              className="crm-leads-search-input"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari lead, PIC, atau kebutuhan..."
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "0.78rem",
                color: "#16213d",
              }}
            />
          </div>

          {/* FILTER STATUS PROSPEK */}
          {marketingSub === "lead-management" && (
            <select
              className="crm-leads-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(
                  e.target.value as LeadStatus | ""
                );
                setPage(1);
              }}
              style={{
                height: 38,
                padding: "0 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                background: "#fff",
                color: "#16213d",
                fontSize: "0.76rem",
              }}
            >
              <option value="">Semua Status</option>

              {Object.entries(STATUS_CONFIG)
                .filter(([value]) => value !== "converted")
                .map(([value, cfg]) => (
                  <option key={value} value={value}>
                    {cfg.label}
                  </option>
                ))}
            </select>
          )}

          {/* FILTER JADWAL */}
          <select
            className="crm-leads-filter"
            value={scheduleType}
            onChange={(e) => {
              setScheduleType(
                e.target.value as
                  | "daily"
                  | "monthly"
                  | "all"
              );
              setPage(1);
            }}
            style={{
              height: 38,
              padding: "0 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#fff",
              color: "#16213d",
              fontSize: "0.76rem",
            }}
          >
            <option value="all">Semua Tanggal</option>
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
          </select>

          {/* FILTER HARIAN */}
          {scheduleType === "daily" && (
            <input
              className="crm-leads-filter"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              style={{
                height: 38,
                padding: "0 10px",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                fontSize: "0.76rem",
              }}
            />
          )}

          {/* FILTER BULANAN */}
          {scheduleType === "monthly" && (
            <>
              <select
                className="crm-leads-filter"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setPage(1);
                }}
                style={{
                  height: 38,
                  padding: "0 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: "0.76rem",
                }}
              >
                {BULAN.map((m) => (
                  <option
                    key={m.value}
                    value={m.value}
                  >
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                className="crm-leads-filter"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setPage(1);
                }}
                style={{
                  height: 38,
                  padding: "0 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: "0.76rem",
                }}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => currentYear - 2 + i
                ).map((year) => (
                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* JUMLAH DATA */}
          <span
            className="crm-leads-count"
            style={{
              fontSize: "0.7rem",
              color: "#64748b",
              whiteSpace: "nowrap",
            }}
          >
            {data?.total ?? 0} data ditemukan
          </span>

          {/* TOMBOL EXPORT */}
          <Button
            variant="secondary"
            style={{ fontSize: "0.78rem" }}
            onClick={() => setShowExportModal(true)}
          >
            <Download size={13} /> Export
          </Button>
        </div>

        {/* LOADING */}
        {isLoading && <LoadingState />}

        {/* DATA KOSONG */}
        {!isLoading && visibleLeads.length === 0 && (
          <EmptyState
            title={
              marketingSub === "marketing"
                ? "Belum Ada Pelanggan"
                : "Lead tidak ditemukan"
            }
            subtitle={
              marketingSub === "marketing"
                ? "Lead yang sudah menjadi customer akan muncul di sini."
                : "Coba ubah kata kunci pencarian atau filter status."
            }
          />
        )}

        {/* TABEL DATA MARKETING & PROSPEK */}
        {!isLoading && visibleLeads.length > 0 && (
<div
  className="crm-leads-table-wrap"
  style={{
    width: "100%",
    overflow: "hidden",
  }}
>
  <table
    className="crm-leads-table"
    style={{
      width: "100%",
      maxWidth: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
    }}
  >
                <colgroup>
              <col style={{ width: "19%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              </colgroup>

              <thead>
                <tr>
                  {[
                    "Calon Pelanggan",
                    "Nama Contact",
                    "Sumber",
                    "PIC",
                    "Tgl Kontak",
                    "Status",
                    "Aksi",
                  ].map((head) => (
                    <th
                      key={head}
                      className="crm-leads-table-head-cell"
                      style={{
                        textAlign: "left",
                        fontSize: "0.68rem",
                        lineHeight: 1.3,
                        color: "#64748b",
                        fontWeight: 700,
                        padding: "13px 12px",
                        borderBottom: "1px solid #e5e7eb",
                        textTransform: "uppercase",
                        letterSpacing: "0.2px",
                        background: "#fff",
                        whiteSpace: "normal",
                        overflowWrap: "anywhere",
                        verticalAlign: "middle",
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleLeads.map((lead) => {
                  const cfg =
                    STATUS_CONFIG[lead.status] ??
                    STATUS_CONFIG.new;

                  const sales = getSalesName(lead);

                  const contactDate = readLeadField(
                    lead,
                    [
                      "last_contact_at",
                      "contacted_at",
                      "contact_date",
                      "updated_at",
                      "created_at",
                    ]
                  );

                  const sourceLabel: Record<
                    string,
                    string
                  > = {
                    website: "Situs Web",
                    marketing: "Marketing",
                    event: "Event",
                    referral: "Referral",
                    sales: "Sales",
                    other: "Lainnya",
                  };

                  const cellStyle = {
                    padding: "13px 12px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "0.77rem",
                    lineHeight: 1.4,
                    verticalAlign: "middle",
                    minWidth: 0,
                    overflow: "hidden",
                  } as const;

                  const ellipsisStyle = {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  } as const;

                  return (
                    <tr key={lead.id} className="crm-leads-table-row">
                      {/* CALON PELANGGAN */}
                      <td
                        style={{
                          ...cellStyle,
                          color: "#16213d",
                          fontWeight: 700,
                        }}
                        title={lead.company_name}
                      >
                        <div style={ellipsisStyle}>
                          {lead.company_name}
                        </div>
                      </td>

                      {/* NAMA CONTACT */}
                      <td
                        style={{
                          ...cellStyle,
                          color: "#16213d",
                        }}
                        title={
                          lead.contact_name ?? "—"
                        }
                      >
                        <div style={ellipsisStyle}>
                          {lead.contact_name ?? "—"}
                        </div>
                      </td>

                      {/* SUMBER */}
                      <td
                        style={{
                          ...cellStyle,
                          color: "#64748b",
                        }}
                        title={
                          sourceLabel[
                            lead.source ?? ""
                          ] ??
                          lead.source ??
                          "—"
                        }
                      >
                        <div style={ellipsisStyle}>
                          {sourceLabel[
                            lead.source ?? ""
                          ] ??
                            lead.source ??
                            "—"}
                        </div>
                      </td>

                      {/* PIC */}
                      <td
                        style={{
                          ...cellStyle,
                          color: "#16213d",
                        }}
                        title={sales}
                      >
                        <div style={ellipsisStyle}>
                          {sales}
                        </div>
                      </td>

                      {/* TANGGAL KONTAK */}
                      <td
                        style={{
                          ...cellStyle,
                          color: "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {contactDate === "—"
                          ? "—"
                          : formatDate(
                              contactDate
                            )}
                      </td>

                      {/* STATUS LEAD */}
                      <td
                        style={{
                          ...cellStyle,
                          overflow: "visible",
                        }}
                      >
                        <span
                          className="crm-leads-status"
                          style={{
                            display: "inline-block",
                            maxWidth: "100%",
                            padding: "3px 9px",
                            borderRadius: 20,
                            fontSize: "0.62rem",
                            lineHeight: 1.25,
                            fontWeight: 700,
                            background: cfg.bg,
                            color: cfg.color,
                            whiteSpace: "normal",
                            textAlign: "center",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {cfg.label}
                        </span>
                      </td>

                      {/* TOMBOL DETAIL */}
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: "center",
                          overflow: "visible",
                          paddingLeft: 16,
                          paddingRight: 16,
                        }}
                      >
                        <Button
                          variant="secondary"
                          className="crm-leads-detail-button"
                          onClick={() => openLeadDetail(lead)}
                        >
                          <Eye size={14} aria-hidden="true" /> Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* =====================================
            PAGINATION MARKETING & PROSPEK
            PILIHAN 10 / 20 / 50 DATA PER HALAMAN
        ===================================== */}

        {data && data.total > 0 && (
          <CrmPagination
            currentPage={data.current_page}
            lastPage={data.last_page}
            total={data.total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </div>

      {/* =====================================
          MODAL EXPORT PDF / EXCEL
      ===================================== */}

      {showExportModal && (
        <ExportFormatModal
          onClose={() => setShowExportModal(false)}
          onPdf={handleExportPdf}
          onExcel={handleExportExcel}
          reportTitle={marketingSub === "marketing" ? "Marketing" : "Prospek"}
          reportDescription={marketingSub === "marketing"
            ? "Daftar customer hasil konversi lead pada tab Marketing."
            : "Daftar lead yang sedang dikelola pada tab Prospek."}
          reportFields="Calon Pelanggan, Nama Contact, Sumber, PIC, Tgl Kontak, dan Status."
        />
      )}
    </div>
  );
}

const MSDC_EXPORT_LOGO = MSDC_PDF_LOGO;

const EXPORT_BRAND = {
  navy: "#092747",
  navyText: "#16213d",
  orange: "#f7ab00",
  slate: "#64748b",
  muted: "#94a3b8",
  border: "#e5e7eb",
  light: "#f8fafc",
  white: "#ffffff",
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#d99200",
};

function firstDay(year: number, month: string) {
  return `${year}-${month}-01`;
}

function lastDay(year: number, month: string) {
  const d = new Date(year, Number(month), 0);
  return `${year}-${month}-${String(d.getDate()).padStart(2, "0")}`;
}

function ExportFormatModal({
  onClose, onPdf, onExcel, reportTitle, reportDescription, reportFields,
}: {
  onClose: () => void;
  onPdf: () => void | Promise<void>;
  onExcel: () => void | Promise<void>;
  reportTitle: string;
  reportDescription: string;
  reportFields: string;
}) {
  const optionStyle = {
    display: "flex", minHeight: 126, alignItems: "flex-start", gap: 14,
    padding: "18px 20px", textAlign: "left", cursor: "pointer",
    border: `1px solid ${EXPORT_BRAND.border}`, borderRadius: 14,
    background: "#fff", transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease, background-color .2s ease",
  } as const;

  return createPortal(
    <div className="crm-leads-export-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }} style={{
      position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1300,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      background: "rgba(15, 23, 42, .56)", backdropFilter: "blur(4px)",
    }}>
      <div className="crm-leads-export-dialog" role="dialog" aria-modal="true" aria-label={`Export ${reportTitle}`} style={{
        width: 760, maxWidth: "calc(100% - 24px)", maxHeight: "calc(100vh - 40px)", overflow: "auto",
        border: 0, borderRadius: 20, background: "#fff",
        boxShadow: "0 24px 70px rgba(15, 23, 42, .22)",
      }}>
        <div className="crm-leads-modal-header" style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          padding: "18px 24px", color: EXPORT_BRAND.navyText, background: "#f8fafc", borderBottom: "1px solid #e2e8f0",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13, minWidth: 0 }}>
            <span aria-hidden="true" style={{
              display: "inline-flex", width: 42, height: 42, flex: "0 0 42px", alignItems: "center",
              justifyContent: "center", borderRadius: 13, border: "1px solid #fde68a", color: "#b77900", background: "#fffbeb",
            }}><Download size={19} /></span>
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: 3, color: "#b77900", fontSize: 10, fontWeight: 800, letterSpacing: ".11em" }}>CRM &amp; SALES</div>
              <strong style={{ display: "block", color: "#ffffff", fontSize: 15, lineHeight: 1.25 }}>Export Report</strong>
              <span style={{ display: "block", marginTop: 3, color: "#dbe7f3", fontSize: 11 }}>{reportTitle} - Marketing &amp; Prospek</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <img src={MSDC_EXPORT_LOGO} alt="MSDC Surabaya" style={{ width: 88, height: 48, objectFit: "contain" }} />
            <button type="button" onClick={onClose} aria-label="Tutup" style={{
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", border: "1px solid #e2e8f0", borderRadius: 10,
              background: "#fff", color: "#64748b", fontSize: 22, lineHeight: 1,
            }}>×</button>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{
            marginBottom: 18, padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: 12,
            border: `1px solid ${EXPORT_BRAND.border}`, borderRadius: 13, background: "#f8fafc",
          }}>
            <span aria-hidden="true" style={{
              display: "inline-flex", width: 34, height: 34, flex: "0 0 34px", alignItems: "center",
              justifyContent: "center", borderRadius: 10, color: "#2563eb", background: "#eff6ff",
            }}><ClipboardList size={17} /></span>
            <div style={{ minWidth: 0 }}>
              <strong style={{ display: "block", color: EXPORT_BRAND.navyText, fontSize: 13, fontWeight: 800 }}>Data yang diekspor: {reportTitle}</strong>
              <p style={{ margin: "4px 0 0", color: EXPORT_BRAND.slate, fontSize: 11, lineHeight: 1.55 }}>{reportDescription}</p>
              <p style={{ margin: "6px 0 0", color: "#94a3b8", fontSize: 10, lineHeight: 1.5 }}>Isi file: {reportFields}</p>
            </div>
          </div>

          <h3 style={{ margin: "0 0 6px", color: EXPORT_BRAND.navyText, fontSize: 15, fontWeight: 800 }}>Pilih format file</h3>
          <p style={{ margin: "0 0 18px", color: EXPORT_BRAND.slate, fontSize: 12, lineHeight: 1.55 }}>
            Data yang diunduh mengikuti tab aktif, pencarian, filter status, dan periode yang sedang dipilih.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
            <button type="button" className="crm-leads-export-option" onClick={() => void onPdf()} style={optionStyle}>
              <span aria-hidden="true" style={{
                display: "inline-flex", width: 42, height: 42, flex: "0 0 42px", alignItems: "center", justifyContent: "center",
                borderRadius: 12, color: "#dc2626", background: "#fef2f2",
              }}><FileText size={20} /></span>
              <span style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
                <strong style={{ color: EXPORT_BRAND.navyText, fontSize: 13 }}>PDF</strong>
                <span style={{ color: EXPORT_BRAND.slate, fontSize: 11, lineHeight: 1.55 }}>Laporan {reportTitle} dengan identitas MSDC, siap dicetak atau dibagikan.</span>
              </span>
            </button>
            <button type="button" className="crm-leads-export-option" onClick={() => void onExcel()} style={optionStyle}>
              <span aria-hidden="true" style={{
                display: "inline-flex", width: 42, height: 42, flex: "0 0 42px", alignItems: "center", justifyContent: "center",
                borderRadius: 12, color: "#059669", background: "#ecfdf5",
              }}><FileSpreadsheet size={20} /></span>
              <span style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 2 }}>
                <strong style={{ color: EXPORT_BRAND.navyText, fontSize: 13 }}>Excel (.xlsx)</strong>
                <span style={{ color: EXPORT_BRAND.slate, fontSize: 11, lineHeight: 1.55 }}>Spreadsheet dengan kolom sesuai data pada tab yang sedang dibuka.</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
