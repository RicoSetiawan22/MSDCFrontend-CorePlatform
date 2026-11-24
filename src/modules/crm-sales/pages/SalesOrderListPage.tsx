import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { salesOrderApi, type CrmInvoiceApiRow } from "../api/salesOrderApi";
import { extractErrorMessage } from "@shared/types/api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Clock, Server, CheckCircle2, XCircle, FileText, Download, Send, AlertTriangle, ShoppingCart, Eye, type LucideIcon } from "lucide-react";
import { useSalesOrderList, useUpdateSalesOrderStatus } from "../api/useSalesOrders";
import { CrmPagination, CRM_DEFAULT_PER_PAGE } from "../components/CrmPagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import type { SalesOrder, SalesOrderStatus } from "../types/salesOrder";
import { MSDC_PDF_LOGO } from "../lib/pdfBrand";
const STATUS_LABELS: Record<SalesOrderStatus, string> = {
    pending: "Pending",
    provisioning: "Provisioning",
    active: "Aktif",
    cancelled: "Dibatalkan",
};
const NEXT_STAGE: Partial<Record<SalesOrderStatus, SalesOrderStatus>> = {
    pending: "provisioning",
    provisioning: "active",
};
const COLORS = {
    navy: "#0b1c33",
    navyText: "#16213d",
    slate: "#64748b",
    orange: "#f2a602",
    orangeDark: "#d99200",
    orangeLight: "#fef3c7",
    green: "#16a34a",
    greenLight: "#dcfce7",
    red: "#dc2626",
    redLight: "#fee2e2",
    border: "#e5e7eb",
    page: "#f5f7fa",
    white: "#ffffff",
};

const SALES_ORDER_UI_STYLES = `
.crm-sales-order-ui {
  --crm-so-navy: #102b4e;
  --crm-so-gold: #f0a800;
  --crm-so-text: #0f2946;
  --crm-so-muted: #64748b;
  --crm-so-border: #e2e8f0;
  --crm-so-surface: #ffffff;
  --crm-so-page: #f5f7fb;
  color: var(--crm-so-text);
}
.crm-sales-order-ui .crm-so-page {
  min-height: calc(100vh - 64px);
  padding: 0 clamp(16px, 2.2vw, 32px) 52px !important;
  background: var(--crm-so-page) !important;
}
.crm-sales-order-ui .crm-so-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
}
.crm-sales-order-ui .crm-so-tab {
  min-height: 40px;
  padding: 9px 16px !important;
  border: 1px solid var(--crm-so-border) !important;
  border-radius: 11px !important;
  background: #fff !important;
  color: #64748b !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  cursor: pointer;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease, color .18s ease;
}
.crm-sales-order-ui .crm-so-tab:hover {
  transform: translateY(-1px);
  border-color: #cbd5e1 !important;
  box-shadow: 0 4px 12px rgba(15,39,71,.07);
}
.crm-sales-order-ui .crm-so-tab.is-active {
  border-color: #102b4e !important;
  background: #102b4e !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(16,43,78,.16);
}
.crm-sales-order-ui .crm-so-tab:focus-visible,
.crm-sales-order-ui button:focus-visible,
.crm-sales-order-ui a:focus-visible,
.crm-sales-order-ui select:focus-visible,
.crm-sales-order-ui input:focus-visible {
  outline: 3px solid rgba(247,171,0,.35);
  outline-offset: 2px;
}
.crm-sales-order-ui .crm-so-kpi-grid {
  display: grid !important;
  width: 100%;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 16px !important;
  margin-bottom: 20px !important;
}
.crm-sales-order-ui .crm-so-kpi-card {
  display: flex;
  min-width: 0;
  min-height: 142px;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 19px !important;
  border: 1px solid rgba(226,232,240,.92) !important;
  border-radius: 16px !important;
  outline: none;
  background: linear-gradient(180deg,#fff 0%,#fcfdff 100%) !important;
  box-shadow: 0 2px 8px rgba(0,0,0,.04) !important;
  transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .2s ease;
}
.crm-sales-order-ui .crm-so-kpi-card:hover {
  transform: translateY(-4px);
  border-color: #cbd5e1 !important;
  box-shadow: 0 12px 26px rgba(15,23,42,.09) !important;
}
.crm-sales-order-ui .crm-so-kpi-card:focus-visible {
  transform: translateY(-2px);
  outline: 3px solid rgba(247,171,0,.66);
  outline-offset: 3px;
  box-shadow: 0 8px 20px rgba(15,23,42,.09) !important;
}
.crm-sales-order-ui .crm-so-kpi-heading {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}
.crm-sales-order-ui .crm-so-kpi-icon {
  display: inline-flex;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  transition: transform .22s cubic-bezier(.16,1,.3,1);
}
.crm-sales-order-ui .crm-so-kpi-card:hover .crm-so-kpi-icon {
  transform: scale(1.06) rotate(-3deg);
}
.crm-sales-order-ui .crm-so-kpi-label {
  overflow: hidden;
  color: #64748b;
  font-size: .7rem;
  font-weight: 800;
  letter-spacing: .055em;
  line-height: 1.45;
  text-overflow: ellipsis;
  text-transform: uppercase;
}
.crm-sales-order-ui .crm-so-kpi-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}
.crm-sales-order-ui .crm-so-kpi-value {
  overflow-wrap: anywhere;
  color: #0f2946;
  font-size: clamp(1.65rem,2.2vw,2rem);
  font-weight: 850;
  letter-spacing: -.045em;
  line-height: 1.08;
  font-variant-numeric: tabular-nums;
}
.crm-sales-order-ui .crm-so-kpi-note {
  color: #64748b;
  font-size: .73rem;
  font-weight: 500;
  line-height: 1.45;
}
.crm-sales-order-ui .crm-so-panel {
  overflow: hidden;
  border: 1px solid var(--crm-so-border) !important;
  border-radius: 16px !important;
  background: #fff !important;
  box-shadow: 0 4px 20px -8px rgba(15,39,71,.09);
}
.crm-sales-order-ui .crm-so-card-header {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 10px;
  padding: 17px 22px !important;
  border-bottom: 1px solid #edf1f5 !important;
  background: #fff;
}
.crm-sales-order-ui .crm-so-card-heading {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #102b4e;
}
.crm-sales-order-ui .crm-so-card-heading svg {
  flex: 0 0 auto;
  color: #d99200;
}
.crm-sales-order-ui .crm-so-toolbar {
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px !important;
  padding: 15px 22px !important;
  border-bottom: 1px solid #edf1f5 !important;
  background: #f8fafc !important;
}
.crm-sales-order-ui .crm-so-search {
  flex: 1 1 260px;
  max-width: 560px;
  border-radius: 10px !important;
  background: #fff !important;
}
.crm-sales-order-ui .crm-so-select {
  min-width: 180px;
  border-radius: 10px !important;
  background: #fff !important;
}
.crm-sales-order-ui .crm-so-table tbody tr {
  transition: background .16s ease;
}
.crm-sales-order-ui .crm-so-table tbody tr:hover {
  background: #f8fafc;
}
.crm-sales-order-ui .crm-so-table th {
  padding-top: 13px !important;
  padding-bottom: 13px !important;
  background: #f8fafc;
  color: #64748b !important;
  font-size: 10.5px !important;
  letter-spacing: .045em;
}
.crm-sales-order-ui .crm-so-table td {
  padding-top: 13px !important;
  padding-bottom: 13px !important;
}
.crm-sales-order-ui .crm-so-action {
  border-radius: 9px !important;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
}
.crm-sales-order-ui .crm-so-action:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15,39,71,.08);
}
.crm-sales-order-ui .crm-so-detail-header {
  padding: 22px 24px !important;
  border: 1px solid var(--crm-so-border) !important;
  border-radius: 16px !important;
  background: #fff !important;
  box-shadow: 0 4px 20px -8px rgba(15,39,71,.09);
}
.crm-sales-order-ui .crm-so-info-grid {
  display: grid;
  grid-template-columns: repeat(3,minmax(0,1fr)) !important;
  gap: 20px 28px !important;
}
.crm-sales-order-ui .crm-so-info-grid > div {
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #edf1f5;
  border-radius: 12px;
  background: #fbfcfe;
}
.crm-sales-order-ui .crm-so-content-stack {
  gap: 18px !important;
}
@media (max-width: 1024px) {
  .crm-sales-order-ui .crm-so-kpi-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
  .crm-sales-order-ui .crm-so-info-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
}
@media (max-width: 640px) {
  .crm-sales-order-ui .crm-so-kpi-grid { grid-template-columns: minmax(0,1fr) !important; gap: 12px !important; }
  .crm-sales-order-ui .crm-so-kpi-card { min-height: 124px; }
  .crm-sales-order-ui .crm-so-info-grid { grid-template-columns: minmax(0,1fr) !important; }
  .crm-sales-order-ui .crm-so-detail-header { flex-direction: column; }
  .crm-sales-order-ui .crm-so-toolbar { align-items: stretch; }
  .crm-sales-order-ui .crm-so-select { width: 100%; }
  .crm-sales-order-ui .crm-so-search { max-width: none; }
}
@media (prefers-reduced-motion: reduce) {
  .crm-sales-order-ui .crm-so-kpi-card,
  .crm-sales-order-ui .crm-so-kpi-icon,
  .crm-sales-order-ui .crm-so-tab,
  .crm-sales-order-ui .crm-so-action,
  .crm-sales-order-ui .crm-so-table tbody tr { transition: none !important; }
  .crm-sales-order-ui .crm-so-kpi-card:hover,
  .crm-sales-order-ui .crm-so-tab:hover,
  .crm-sales-order-ui .crm-so-action:hover:not(:disabled) { transform: none !important; }
}

/* Penyeragaman halaman Sales Order & Invoice terhadap form Prospek/Quotation. */
.crm-sales-order-ui .crm-so-toolbar {
  display:grid !important; grid-template-columns:minmax(0,1fr) minmax(180px,215px) !important;
  align-items:center !important; gap:12px !important; padding:16px 22px !important;
  background:linear-gradient(180deg,#f9fbff 0%,#f4f8fc 100%) !important;
}
.crm-sales-order-ui .crm-so-search { display:flex !important; flex:unset !important; width:100% !important; min-width:0; max-width:none !important; height:46px !important; min-height:46px !important; padding:0 15px !important; border:1px solid #dce6f1 !important; border-radius:12px !important; box-sizing:border-box; }
.crm-sales-order-ui .crm-so-search input { min-width:0; flex:1; width:100%; font-size:13px !important; }
.crm-sales-order-ui .crm-so-select { min-width:0 !important; width:100% !important; height:46px !important; min-height:46px; box-sizing:border-box; padding:0 12px !important; border:1px solid #dce6f1 !important; border-radius:12px !important; color:#344d68 !important; font-weight:700 !important; font-size:12px !important; }
.crm-sales-order-ui .crm-so-toolbar :is(input,select):focus-visible { border-color:#ecb338 !important; outline:3px solid #ffedbb !important; outline-offset:0; }
.crm-sales-order-ui .crm-so-panel { border:1px solid #e2eaf3 !important; border-radius:19px !important; box-shadow:0 7px 22px rgba(17,39,68,.04) !important; }
.crm-sales-order-ui .crm-so-card-header { padding:18px 22px !important; background:linear-gradient(110deg,#f8fbff 0%,#fff 65%,#fff8e9 100%) !important; }
.crm-sales-order-ui .crm-so-card-heading svg { background:#fff1cc; border-radius:10px; padding:6px; width:34px; height:34px; color:#c08100; }
.crm-sales-order-ui .crm-so-card-heading h3 { font-size:14px !important; }
.crm-sales-order-ui .crm-so-kpi-grid { gap:16px !important; }
.crm-sales-order-ui .crm-so-kpi-card { border-radius:18px !important; min-height:136px; background:linear-gradient(180deg,#fff 0%,#fcfdff 100%) !important; border-color:#e5edf5 !important; box-shadow:0 4px 16px rgba(15,39,71,.038) !important; }
.crm-sales-order-ui .crm-so-table th { white-space:nowrap; background:#f6f9fd !important; }
.crm-sales-order-ui .crm-so-table td { vertical-align:middle; }
.crm-sales-order-ui .crm-so-table tbody tr:nth-child(even) { background:#fbfcff; }
.crm-sales-order-ui .crm-so-action { min-height:35px; border-radius:10px !important; }
.crm-sales-order-ui .crm-so-detail-button { display:inline-flex; min-width:86px; min-height:36px !important; align-items:center; justify-content:center; gap:7px; margin:2px 3px; padding:0 13px !important; border:1px solid #dbe3ec !important; border-radius:10px !important; background:#fff !important; color:#102b4e !important; font-size:11px !important; font-weight:750 !important; white-space:nowrap; }
.crm-sales-order-ui .crm-so-detail-button:hover:not(:disabled) { border-color:#f0a800 !important; background:#fffbeb !important; color:#102b4e !important; }
/* Detail Invoice dengan tombol kembali di atas kartu. */
.crm-sales-order-ui .crm-so-invoice-detail { display:flex; flex-direction:column; gap:17px; }
.crm-sales-order-ui .crm-so-back-button { display:inline-flex; align-items:center; justify-content:center; align-self:flex-start; width:max-content; max-width:100%; gap:9px; min-height:43px; margin:0 !important; padding:9px 15px !important; border:1px solid #f1ce75 !important; border-radius:12px !important; background:linear-gradient(115deg,#fffaf0 0%,#fff0ca 100%) !important; color:#895900 !important; text-decoration:none; font-weight:800 !important; font-size:12px !important; box-shadow:0 4px 13px rgba(219,160,18,.07); cursor:pointer; }
.crm-sales-order-ui .crm-so-back-button:hover { background:linear-gradient(115deg,#fff2d2,#ffe8aa) !important; border-color:#e8b943 !important; }
.crm-sales-order-ui .crm-so-detail-header { background:linear-gradient(110deg,#f3f8ff 0%,#fff 53%,#fff3d7 100%) !important; border:1px solid #e1e9f3 !important; border-radius:20px !important; padding:22px 24px !important; box-shadow:0 7px 23px rgba(15,39,71,.045) !important; }
.crm-sales-order-ui .crm-so-invoice-detail .crm-so-detail-header > div:first-child { min-width:0; }
.crm-sales-order-ui .crm-so-invoice-detail .crm-so-detail-header { align-items:center; gap:16px; }
.crm-sales-order-ui .crm-so-invoice-detail .crm-so-detail-header button { border-color:#f1d793 !important; border-radius:11px !important; min-height:41px; padding:9px 16px !important; background:#fffaf0 !important; color:#986000 !important; font-weight:800; }
@media(max-width:700px){
  .crm-sales-order-ui .crm-so-toolbar {grid-template-columns:minmax(0,1fr) !important;}
  .crm-sales-order-ui .crm-so-detail-header {flex-direction:column; align-items:stretch !important;}
  .crm-sales-order-ui .crm-so-kpi-card {min-height:124px;}
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

const KPI_ICON_CONFIG: Record<string, { Icon: LucideIcon; color: string; background: string; description: string }> = {
    PENDING: { Icon: Clock, color: "#D97706", background: "#FFF7ED", description: "Jumlah pada halaman ini" },
    PROVISIONING: { Icon: Server, color: "#2563EB", background: "#EFF6FF", description: "Jumlah pada halaman ini" },
    AKTIF: { Icon: CheckCircle2, color: "#16A34A", background: "#F0FDF4", description: "Jumlah pada halaman ini" },
    DIBATALKAN: { Icon: XCircle, color: "#DC2626", background: "#FEF2F2", description: "Jumlah pada halaman ini" },
    ISSUED: { Icon: FileText, color: "#2563EB", background: "#EFF6FF", description: "Dari invoice yang dimuat" },
    "PENDING FINANCE": { Icon: Send, color: "#D97706", background: "#FFF7ED", description: "Dari invoice yang dimuat" },
    PAID: { Icon: CheckCircle2, color: "#16A34A", background: "#F0FDF4", description: "Dari invoice yang dimuat" },
    OVERDUE: { Icon: AlertTriangle, color: "#DC2626", background: "#FEF2F2", description: "Dari invoice yang dimuat" },
};
/* Invoice ditampilkan dari AR Invoice nyata yang ditautkan ke Sales Order CRM. */
type InvoiceStatus = "issued" | "sent" | "paid" | "overdue";
interface InvoiceRow {
    invoiceId: number;
    id: string;
    customer: string;
    salesOrder: string;
    invoiceDate: string;
    dueDate: string;
    total: number;
    status: InvoiceStatus;
    payment: string;
    financeHandoffStatus: string | null;
    isDemo?: boolean;
}
function mapCrmInvoice(row: CrmInvoiceApiRow): InvoiceRow {
    const status: InvoiceStatus = row.status === "paid" ? "paid" : row.is_overdue ? "overdue"
        : row.finance_handoff_status ? "sent" : "issued";
    return {
        invoiceId: row.id,
        id: row.invoice_number,
        customer: row.customer_name,
        salesOrder: row.sales_order_number,
        invoiceDate: row.invoice_date || "—",
        dueDate: row.due_date || "—",
        total: Number(row.total_amount) || 0,
        status,
        payment: row.status === "paid" ? "Lunas" : row.is_overdue ? "Terlambat"
            : Number(row.paid_amount) > 0 ? "Sebagian dibayar" : "Belum dibayar",
        financeHandoffStatus: row.finance_handoff_status,
    };
}
/* Fallback DEMO dari tampilan lama saat server JTV belum menyediakan API Invoice CRM.
 * Jangan pernah gunakan ini sebagai transaksi nyata atau untuk mengirim ke Finance. */
const DEMO_INVOICES: InvoiceRow[] = [
    {
        invoiceId: 0,
        financeHandoffStatus: null,
        isDemo: true,
        id: "INV-2026-201",
        customer: "PT. Cloud Nusantara",
        salesOrder: "SO-2026-140",
        invoiceDate: "4 Agu 2026",
        dueDate: "18 Agu 2026",
        total: 48000000,
        status: "issued",
        payment: "Belum Dibayar",
    },
    {
        invoiceId: 0,
        financeHandoffStatus: null,
        isDemo: true,
        id: "INV-2026-200",
        customer: "PT. Data Prima Solusi",
        salesOrder: "SO-2026-138",
        invoiceDate: "15 Jul 2026",
        dueDate: "29 Jul 2026",
        total: 56000000,
        status: "paid",
        payment: "Lunas",
    },
    {
        invoiceId: 0,
        financeHandoffStatus: null,
        isDemo: true,
        id: "INV-2026-199",
        customer: "PT. Net Solusi Global",
        salesOrder: "SO-2026-139",
        invoiceDate: "29 Jul 2026",
        dueDate: "12 Agu 2026",
        total: 36000000,
        status: "overdue",
        payment: "Terlambat",
    },
];
export function SalesOrderListPage() {
    const [activeTab, setActiveTab,] = useState<"sales-order" | "invoice">("sales-order");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(CRM_DEFAULT_PER_PAGE);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter,] = useState<SalesOrderStatus | "">("");
    const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
    /* API ASLI TEMPAT MAGANG */
    const { data, isLoading, } = useSalesOrderList({
        page,
        per_page: perPage,
        search: search || undefined,
        status: statusFilter ||
            undefined,
    });
    /*
     * KPI dihitung dari data yang
     * sudah diterima pada halaman ini.
     * Tidak menambah endpoint API baru.
     */
    const salesSummary = useMemo(() => {
        const rows = data?.data ?? [];
        return {
            pending: rows.filter((item) => item.status ===
                "pending").length,
            provisioning: rows.filter((item) => item.status ===
                "provisioning").length,
            active: rows.filter((item) => item.status ===
                "active").length,
            cancelled: rows.filter((item) => item.status ===
                "cancelled").length,
        };
    }, [data]);

    /*
     * Detail Invoice tetap berada di file SalesOrderListPage ini.
     * Tidak membuat page/component file baru dan tidak menambah route.
     * Saat tombol Detail diklik, daftar Invoice diganti dengan tampilan
     * detail penuh seperti pola halaman Detail Sales Order.
     */
    if (selectedInvoice) {
        return (<div className="crm-sales-order-ui">
          <style>{SALES_ORDER_UI_STYLES}</style>
          <PageHeader
  title="Detail Invoice"
  subtitle="Informasi invoice dan status pembayaran"
  containerClassName="px-7 pt-5 pb-2"
/>

          <main className="crm-so-page" style={styles.page}>
            <InvoiceDetail invoice={selectedInvoice} onBack={() => setSelectedInvoice(null)}/>
          </main>
        </div>);
    }

    return (<div className="crm-sales-order-ui">
      <style>{SALES_ORDER_UI_STYLES}</style>
      <PageHeader
       title="SO & Invoice"
       subtitle="Sales order dan status invoice ke Finance"
       containerClassName="px-7 pt-5 pb-2"
      />


      <main className="crm-so-page" style={styles.page}>
        {/* =============================== */}
        {/* SUBTAB                          */}
        {/* =============================== */}


        <div className="crm-so-tabs" style={styles.subTabs}>
          <button type="button" className={`crm-so-tab ${activeTab === "sales-order" ? "is-active" : ""}`} onClick={() => setActiveTab("sales-order")} style={{
            ...styles.tabButton,
            ...(activeTab ===
                "sales-order"
                ? styles.activeTab
                : styles.inactiveTab),
        }}>
            Sales Order
          </button>


          <button type="button" className={`crm-so-tab ${activeTab === "invoice" ? "is-active" : ""}`} onClick={() => setActiveTab("invoice")} style={{
            ...styles.tabButton,
            ...(activeTab ===
                "invoice"
                ? styles.activeTab
                : styles.inactiveTab),
        }}>
            Invoice
          </button>
        </div>


        {activeTab ===
            "sales-order" ? (<>
            {/* =============================== */}
            {/* KPI SALES ORDER                 */}
            {/* =============================== */}


            <div className="crm-so-kpi-grid" style={styles.kpiGrid}>
              <KpiCard label="PENDING" value={salesSummary.pending}/>


              <KpiCard label="PROVISIONING" value={salesSummary.provisioning}/>


              <KpiCard label="AKTIF" value={salesSummary.active}/>


              <KpiCard label="DIBATALKAN" value={salesSummary.cancelled}/>
            </div>


            {/* =============================== */}
            {/* SALES ORDER LIST                */}
            {/* =============================== */}


            <section className="crm-so-panel" style={styles.card}>
              <div className="crm-so-card-header" style={styles.cardHeader}>
                <div className="crm-so-card-heading">
                  <ShoppingCart size={18} strokeWidth={2.2} />
                  <h3 style={styles.cardTitle}>Daftar Sales Order</h3>
                </div>
              </div>


              <div className="crm-so-toolbar" style={styles.toolbar}>
                <div className="crm-so-search" style={styles.searchBox}>
                  <Search size={16} color={COLORS.slate}/>


                  <input type="text" placeholder="Cari SO..." value={search} onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
            }} style={styles.searchInput}/>
                </div>


                <select className="crm-so-select" value={statusFilter} onChange={(e) => {
                setStatusFilter(e.target.value as SalesOrderStatus | "");
                setPage(1);
            }} style={styles.select}>
                  <option value="">
                    Semua Status
                  </option>


                  {Object.entries(STATUS_LABELS).map(([value, label,]) => (<option key={value} value={value}>
                        {label}
                      </option>))}
                </select>
              </div>


              {isLoading && (<LoadingState />)}


              {data &&
                data.data.length === 0 && (<div style={styles.emptyWrapper}>
                    <EmptyState title="Belum Ada Sales Order" subtitle="Sales Order dibuat dari quotation yang sudah disetujui."/>
                  </div>)}


              {data &&
                data.data.length > 0 && (<>
                    <div style={styles.tableWrap}>
                      <table className="crm-so-table" style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>
                              NO SO
                            </th>


                            <th style={styles.th}>
                              TANGGAL
                            </th>


                            <th style={styles.th}>
                              TOTAL
                            </th>


                            <th style={styles.th}>
                              STATUS
                            </th>


                            <th style={styles.th}>
                              AKSI
                            </th>
                          </tr>
                        </thead>


                        <tbody>
                          {data.data.map((so) => (<SalesOrderRow key={so.id} so={so}/>))}
                        </tbody>
                      </table>
                    </div>


                    <CrmPagination
                      currentPage={data.current_page}
                      lastPage={data.last_page}
                      total={data.total}
                      perPage={perPage}
                      onPageChange={setPage}
                      onPerPageChange={setPerPage}
                    />
                  </>)}
            </section>
          </>) : (<InvoiceSection onDetail={(invoice) => setSelectedInvoice(invoice)}/>)}
      </main>
    </div>);
}
/* ========================================================= */
/* SALES ORDER ROW                                           */
/* ========================================================= */
function SalesOrderRow({ so, }: {
    so: SalesOrder;
}) {
    const navigate = useNavigate();
    const statusMutation = useUpdateSalesOrderStatus(so.id);
    const nextStage = NEXT_STAGE[so.status];
    return (<tr className="crm-so-table-row">
      <td style={styles.td}>
        <button type="button" className="crm-so-action" onClick={() => navigate(`/crm-sales/sales-orders/${so.id}`)} style={styles.linkButton}>
          {so.so_number}
        </button>
      </td>


      <td style={{
            ...styles.td,
            color: COLORS.slate,
        }}>
        {formatDate(so.order_date)}
      </td>


      <td style={{
            ...styles.td,
            ...styles.mono,
        }}>
        {formatCurrency(Number(so.total_amount))}
      </td>


      <td style={styles.td}>
        <SalesStatusBadge status={so.status}/>
      </td>


      <td style={styles.td}>
        <div style={styles.actions}>
          {nextStage && (<button type="button" className="crm-so-action" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(nextStage)} style={styles.secondaryButton}>
              {statusMutation.isPending
                ? "Memproses..."
                : "Next Stage"}
            </button>)}


          <button type="button" className="crm-so-action crm-so-detail-button" onClick={() => navigate(`/crm-sales/sales-orders/${so.id}`)} title="Lihat detail sales order">
            <Eye size={14} aria-hidden="true" /> Detail
          </button>
        </div>
      </td>
    </tr>);
}
function SalesStatusBadge({ status, }: {
    status: SalesOrderStatus;
}) {
    let background = "#f1f5f9";
    let color = COLORS.slate;
    if (status === "provisioning") {
        background =
            COLORS.orangeLight;
        color =
            COLORS.orangeDark;
    }
    if (status === "active") {
        background =
            COLORS.greenLight;
        color = COLORS.green;
    }
    if (status === "cancelled") {
        background =
            COLORS.redLight;
        color = COLORS.red;
    }
    return (<span style={{
            ...styles.badge,
            background,
            color,
        }}>
      {STATUS_LABELS[status]}
    </span>);
}
/* ========================================================= */
/* KPI                                                       */
/* ========================================================= */
function KpiCard({ label, value, }: {
    label: string;
    value: number;
}) {
    const config = KPI_ICON_CONFIG[label] ?? KPI_ICON_CONFIG.PENDING;
    const Icon = config.Icon;
    return (<div className="crm-so-kpi-card" style={styles.kpiCard} tabIndex={0} role="group" aria-label={`${label}: ${value}`}>
      <div className="crm-so-kpi-heading">
        <span className="crm-so-kpi-icon" style={{ background: config.background, color: config.color }}>
          <Icon size={19} strokeWidth={2.2} />
        </span>
        <span className="crm-so-kpi-label">{label}</span>
      </div>
      <div className="crm-so-kpi-content">
        <strong className="crm-so-kpi-value">{value}</strong>
        <span className="crm-so-kpi-note">{config.description}</span>
      </div>
    </div>);
}
/* ========================================================= */
/* INVOICE                                                   */
/* ========================================================= */
function InvoiceSection({ onDetail, }: {
    onDetail: (invoice: InvoiceRow) => void;
}) {
    const [search, setSearch,] = useState("");
    const [status, setStatus,] = useState<InvoiceStatus | "">("");
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["crm-sales", "real-invoices"],
        queryFn: async () => (await salesOrderApi.listInvoices({ per_page: 100 })).data,
    });
    const responseStatus = (error as { response?: { status?: number } } | null)?.response?.status;
    const errorText = isError ? extractErrorMessage(error).toLowerCase() : "";
    const demoMode = isError && (responseStatus === 404 || errorText.includes("endpoint tidak ditemukan") || errorText.includes("404 not found"));
    const rows = useMemo(() => demoMode ? DEMO_INVOICES : (data?.data ?? []).map(mapCrmInvoice), [data, demoMode]);
    const summary = useMemo(() => ({
        issued: rows.filter(item => item.status === "issued").length,
        sent: rows.filter(item => item.status === "sent").length,
        paid: rows.filter(item => item.status === "paid").length,
        overdue: rows.filter(item => item.status === "overdue").length,
    }), [rows]);
    const invoices = useMemo(() => {
        const keyword = search.toLowerCase().trim();
        return rows.filter(invoice => (
            (!keyword || invoice.id.toLowerCase().includes(keyword)
                || invoice.customer.toLowerCase().includes(keyword)
                || invoice.salesOrder.toLowerCase().includes(keyword))
            && (!status || invoice.status === status)
        ));
    }, [rows, search, status]);
    return (<>
      <div className="crm-so-kpi-grid" style={styles.kpiGrid}>
        <KpiCard label="ISSUED" value={summary.issued}/>


        <KpiCard label="PENDING FINANCE" value={summary.sent}/>


        <KpiCard label="PAID" value={summary.paid}/>


        <KpiCard label="OVERDUE" value={summary.overdue}/>
      </div>


      <section className="crm-so-panel" style={styles.card}>
        <div className="crm-so-card-header" style={styles.cardHeader}>
          <div>
            <div className="crm-so-card-heading">
              <FileText size={18} strokeWidth={2.2} />
              <h3 style={styles.cardTitle}>Daftar Invoice</h3>
            </div>


            <p style={styles.cardSub}>
              Status invoice dari Sales Order
            </p>
          </div>
        </div>


        <div className="crm-so-toolbar" style={styles.toolbar}>
          <div className="crm-so-search" style={styles.searchBox}>
            <Search size={16} color={COLORS.slate}/>


            <input type="text" placeholder="Cari Invoice..." value={search} onChange={(e) => setSearch(e.target.value)} style={styles.searchInput}/>
          </div>


          <select className="crm-so-select" value={status} onChange={(e) => setStatus(e.target.value as InvoiceStatus | "")} style={styles.select}>
            <option value="">
              Semua Status
            </option>


            <option value="issued">
              Issued
            </option>


            <option value="sent">
              Menunggu Finance
            </option>


            <option value="paid">
              Paid
            </option>


            <option value="overdue">
              Overdue
            </option>
          </select>
        </div>


        {isLoading && <LoadingState label="Memuat Invoice asli..." />}
        {demoMode && <div style={{ padding: "0.75rem 1rem", background: "#fffbeb", color: "#92400e", fontSize: 13 }}>
        </div>}
        {isError && !demoMode && <div style={styles.emptyCell}>API Invoice CRM gagal dimuat: {extractErrorMessage(error)}</div>}
        {!isLoading && (!isError || demoMode) && <div style={styles.tableWrap}>
          <table className="crm-so-table" style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>
                  INVOICE
                </th>


                <th style={styles.th}>
                  CUSTOMER
                </th>


                <th style={styles.th}>
                  SALES ORDER
                </th>


                <th style={styles.th}>
                  TGL INVOICE
                </th>


                <th style={styles.th}>
                  DUE DATE
                </th>


                <th style={styles.th}>
                  TOTAL
                </th>


                <th style={styles.th}>
                  STATUS
                </th>


                <th style={styles.th}>
                  PAYMENT
                </th>


                <th style={styles.th}>
                  AKSI
                </th>
              </tr>
            </thead>


            <tbody>
              {invoices.map((invoice) => (<tr key={invoice.id}>
                    <td style={{
                ...styles.td,
                ...styles.mono,
                fontWeight: 700,
            }}>
                      {invoice.id}
                    </td>


                    <td style={styles.td}>
                      {invoice.customer}
                    </td>


                    <td style={{
                ...styles.td,
                ...styles.mono,
                color: COLORS.slate,
            }}>
                      {invoice.salesOrder}
                    </td>


                    <td style={{
                ...styles.td,
                color: COLORS.slate,
            }}>
                      {invoice.invoiceDate}
                    </td>


                    <td style={{
                ...styles.td,
                color: COLORS.slate,
            }}>
                      {invoice.dueDate}
                    </td>


                    <td style={{
                ...styles.td,
                ...styles.mono,
            }}>
                      {formatCurrency(invoice.total)}
                    </td>


                    <td style={styles.td}>
                      <InvoiceBadge status={invoice.status}/>
                    </td>


                    <td style={{
                ...styles.td,
                color: COLORS.slate,
            }}>
                      {invoice.payment}
                    </td>


                    <td style={styles.td}>
                      <button type="button" className="crm-so-action crm-so-detail-button" onClick={() => onDetail(invoice)} title="Lihat detail invoice">
                        <Eye size={14} aria-hidden="true" /> Detail
                      </button>
                    </td>
                  </tr>))}


              {invoices.length === 0 && (<tr>
                  <td colSpan={9} style={styles.emptyCell}>
                    Invoice tidak ditemukan.
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>}
      </section>
    </>);
}
function InvoiceBadge({ status, }: {
    status: InvoiceStatus;
}) {
    const labels: Record<InvoiceStatus, string> = {
        issued: "Issued",
        sent: "Menunggu Finance",
        paid: "Paid",
        overdue: "Overdue",
    };
    let background = "#f1f5f9";
    let color = COLORS.slate;
    if (status === "issued") {
        background =
            COLORS.orangeLight;
        color =
            COLORS.orangeDark;
    }
    if (status === "paid") {
        background =
            COLORS.greenLight;
        color = COLORS.green;
    }
    if (status === "overdue") {
        background =
            COLORS.redLight;
        color = COLORS.red;
    }
    return (<span style={{
            ...styles.badge,
            background,
            color,
        }}>
      {labels[status]}
    </span>);
}
/* ========================================================= */
/* DETAIL INVOICE                                            */
/* ========================================================= */
function InvoiceDetail({ invoice, onBack, }: {
    invoice: InvoiceRow;
    onBack: () => void;
}) {

  const queryClient = useQueryClient();
  const [isSending, setIsSending] = useState(false);
  const [handoffStatus, setHandoffStatus] = useState(invoice.financeHandoffStatus);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  async function handleSendToFinance() {
    if (invoice.isDemo || handoffStatus || isSending) return;
    if (!window.confirm(`Catat invoice ${invoice.id} ke antrean handoff Finance?`)) return;
    setIsSending(true);
    setHandoffError(null);
    try {
      const response = await salesOrderApi.sendInvoiceToFinance(invoice.invoiceId);
      setHandoffStatus(response.data.finance_handoff_status);
      setHandoffMessage(response.data.message);
      await queryClient.invalidateQueries({ queryKey: ["crm-sales", "real-invoices"] });
    } catch (error) {
      setHandoffError(extractErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  function handleDownloadInvoice() {
  const printWindow = window.open("", "_blank", "width=900,height=700");

  if (!printWindow) {
    window.alert("Popup diblokir browser. Izinkan popup untuk mengunduh invoice.");
    return;
  }

  const statusLabel =
    invoice.status === "issued"
      ? "Issued"
      : invoice.status === "sent"
        ? "Sent"
        : invoice.status === "paid"
          ? "Paid"
          : "Overdue";

  const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const printable = {
    id: escapeHtml(invoice.id), customer: escapeHtml(invoice.customer),
    salesOrder: escapeHtml(invoice.salesOrder), invoiceDate: escapeHtml(invoice.invoiceDate),
    dueDate: escapeHtml(invoice.dueDate), payment: escapeHtml(invoice.payment),
  };
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>${printable.id}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            font-family: Arial, Helvetica, sans-serif;
            color: #16213d;
            background: #ffffff;
          }

          .invoice {
            max-width: 900px;
            margin: 0 auto;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          }

          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: center;
            height: 100px;
            padding: 0 32px;
            color: #ffffff;
            background: #092747;
            border-bottom: 6px solid #f7ab00;
          }

          .header .logo img {
            display: block;
            height: 46px;
          }

          .header .center {
            text-align: center;
          }

          .header h1 {
            margin: 0;
            font-size: 22px;
          }

          .header p {
            margin: 6px 0 0;
            font-size: 11px;
            color: #cbd5e1;
          }

          .header .right {
            text-align: right;
            font-size: 11px;
            line-height: 1.5;
            color: #cbd5e1;
          }

          .header .right strong {
            color: #ffffff;
          }

          .content {
            padding: 28px 32px;
          }

          .invoice-number {
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 6px;
          }

          .customer {
            color: #64748b;
            margin-bottom: 26px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 28px;
          }

          .label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 6px;
          }

          .value {
            font-size: 14px;
            font-weight: 700;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          th,
          td {
            padding: 14px 16px;
            border: 1px solid #e5e7eb;
            text-align: left;
            font-size: 13px;
          }

          th {
            background: #f8fafc;
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
          }

          .total {
            margin-top: 20px;
            text-align: right;
            font-size: 18px;
            font-weight: 800;
          }

          .footer {
            margin-top: 32px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            color: #64748b;
            font-size: 11px;
          }

          @media print {
            body {
              padding: 0;
            }

            .invoice {
              border: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="invoice">
          ${invoice.isDemo ? '<div style="padding:8px;text-align:center;background:#fef3c7;font-weight:700;color:#92400e">CONTOH / DEMO — BUKAN INVOICE RESMI</div>' : ''}
          <div class="header">
            <div class="logo"><img src="${MSDC_PDF_LOGO}" alt="MSDC Surabaya" /></div>
            <div class="center">
              <h1>Invoice</h1>
              <p>Informasi invoice dan status pembayaran</p>
            </div>
            <div class="right">
              <strong>CRM &amp; SALES</strong><br />
              MSDC Surabaya<br />
              Dokumen Invoice
            </div>
          </div>

          <div class="content">
            <div class="invoice-number">${printable.id}</div>

            <div class="customer">
              ${printable.customer}
            </div>

            <div class="info-grid">
              <div>
                <div class="label">Sales Order</div>
                <div class="value">${printable.salesOrder}</div>
              </div>

              <div>
                <div class="label">Tanggal Invoice</div>
                <div class="value">${printable.invoiceDate}</div>
              </div>

              <div>
                <div class="label">Due Date</div>
                <div class="value">${printable.dueDate}</div>
              </div>

              <div>
                <div class="label">Status</div>
                <div class="value">${statusLabel}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Deskripsi</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Layanan sesuai Sales Order ${printable.salesOrder}</td>
                  <td>${formatCurrency(invoice.total)}</td>
                </tr>
              </tbody>
            </table>

            <div class="total">
              Total Tagihan: ${formatCurrency(invoice.total)}
            </div>

            <div class="footer">
              Payment: ${printable.payment}
            </div>
          </div>

        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
  }, 300);
}

    return (<div className="crm-so-invoice-detail" style={styles.invoiceDetail}>
      <button type="button" className="crm-so-back-button crm-msdc-back-button" onClick={onBack}>
        <ArrowLeft size={17} aria-hidden="true" /> Kembali ke daftar Invoice
      </button>
      <section className="crm-so-detail-header" style={styles.detailHeader}>
        <div>
          <div style={styles.detailTitle}>
            {invoice.id}
          </div>


          <div style={styles.detailSub}>
            <span>
              {invoice.customer}
            </span>


            <span>•</span>


            <InvoiceBadge status={invoice.status}/>
          </div>
        </div>


<button
  type="button"
  className="crm-so-action"
  onClick={handleDownloadInvoice}
  style={styles.outlineButton}
>
  <Download size={16} aria-hidden="true" /> Download Invoice
</button>
      </section>


      <section className="crm-so-panel" style={styles.card}>
        <div className="crm-so-card-header" style={styles.cardHeader}>
          <div className="crm-so-card-heading">
            <FileText size={18} strokeWidth={2.2} />
            <h3 style={styles.cardTitle}>Invoice Preview</h3>
          </div>
        </div>


        <div style={styles.cardBody}>
          <div style={styles.infoGrid}>
            <InvoiceInfo label="Sales Order" value={invoice.salesOrder}/>


            <InvoiceInfo label="Tanggal Invoice" value={invoice.invoiceDate}/>


            <InvoiceInfo label="Due Date" value={invoice.dueDate}/>


            <InvoiceInfo label="Payment" value={invoice.payment}/>
          </div>


          <div style={{
            ...styles.tableWrap,
            marginTop: "20px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
        }}>
            <table className="crm-so-table" style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    DESKRIPSI
                  </th>


                  <th style={styles.th}>
                    TOTAL
                  </th>
                </tr>
              </thead>


              <tbody>
                <tr>
                  <td style={styles.td}>
                    Layanan sesuai
                    Sales Order{" "}
                    {invoice.salesOrder}
                  </td>


                  <td style={{
            ...styles.td,
            ...styles.mono,
        }}>
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div style={styles.totalInvoice}>
            Total Tagihan:{" "}
            {formatCurrency(invoice.total)}
          </div>
        </div>
      </section>


      <div style={styles.invoiceActions}>
        <button type="button" className="crm-so-action" onClick={handleSendToFinance} disabled={isSending || !!handoffStatus || !!invoice.isDemo}
          style={{ ...styles.primaryButton, opacity: isSending || handoffStatus || invoice.isDemo ? 0.65 : 1,
            cursor: isSending || handoffStatus || invoice.isDemo ? "not-allowed" : "pointer" }}>
          {invoice.isDemo ? "Send to Finance" : isSending ? "Mengirim..." : handoffStatus ? "Tercatat di Handoff Finance" : "Send to Finance"}
        </button>
      </div>
      {handoffError && <p style={{ ...styles.invoiceNote, color: "#b91c1c" }}>{handoffError}</p>}
      {handoffMessage && <p style={{ ...styles.invoiceNote, color: "#166534" }}>{handoffMessage}</p>}
      {invoice.isDemo && <p style={{ ...styles.invoiceNote, color: "#92400e" }}>
      </p>}
      <p style={styles.invoiceNote}>
        Pengiriman ini mencatat Invoice yang sudah ada ke antrean CRM. Status "menunggu Finance"
        belum berarti Invoice tampil di daftar Billing Integration, karena diperlukan adapter penerimaan dari tim Finance.
      </p>
    </div>);
}
function InvoiceInfo({ label, value, }: {
    label: string;
    value: string;
}) {
    return (<div>
      <div style={styles.infoLabel}>
        {label}
      </div>


      <div style={styles.infoValue}>
        {value}
      </div>
    </div>);
}
const styles = {
    page: {
        minHeight: "calc(100vh - 64px)",
        padding: "0 32px 60px",
        background: COLORS.page,
    },
    subTabs: {
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
    },
    tabButton: {
        border: "none",
        borderRadius: "8px",
        padding: "8px 16px",
        fontSize: "0.75rem",
        fontWeight: 700,
        cursor: "pointer",
    },
    activeTab: {
        background: COLORS.navy,
        color: COLORS.white,
    },
    inactiveTab: {
        background: "#eef2f7",
        color: COLORS.slate,
    },
    kpiGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "20px",
    },
    kpiCard: {
        minHeight: "142px",
        padding: "18px 19px",
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,.04)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },
    kpiLabel: {
        color: COLORS.slate,
        fontSize: "11px",
        fontWeight: 700,
    },
    kpiValue: {
        marginTop: "10px",
        color: COLORS.navy,
        fontSize: "20px",
        fontWeight: 800,
    },
    card: {
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "20px",
        boxShadow: "0 4px 20px -8px rgba(15,39,71,.09)",
    },
    cardHeader: {
        minHeight: "55px",
        padding: "15px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
    },
    cardTitle: {
        margin: 0,
        color: COLORS.navy,
        fontSize: "0.85rem",
        fontWeight: 800,
    },
    cardSub: {
        margin: "4px 0 0",
        color: COLORS.slate,
        fontSize: "11px",
    },
    cardBody: {
        padding: "20px",
    },
    toolbar: {
        padding: "14px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "grid",
        gridTemplateColumns: "minmax(250px, 1fr) 180px",
        gap: "12px",
    },
    searchBox: {
        height: "40px",
        padding: "0 12px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        background: COLORS.white,
    },
    searchInput: {
        width: "100%",
        height: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        color: COLORS.navyText,
        fontSize: "0.75rem",
    },
    select: {
        height: "40px",
        padding: "0 11px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        background: COLORS.white,
        color: COLORS.navyText,
        fontSize: "0.75rem",
        outline: "none",
    },
    tableWrap: {
        width: "100%",
        overflowX: "auto",
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    th: {
        padding: "11px 14px",
        textAlign: "left",
        color: COLORS.slate,
        fontSize: "10.8px",
        fontWeight: 700,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${COLORS.border}`,
    },
    td: {
        padding: "12px 14px",
        color: COLORS.navyText,
        fontSize: "12px",
        whiteSpace: "nowrap",
        borderBottom: `1px solid ${COLORS.border}`,
    },
    mono: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    linkButton: {
        padding: 0,
        border: "none",
        background: "none",
        color: COLORS.navy,
        fontFamily: "monospace",
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
    },
    badge: {
        display: "inline-block",
        padding: "4px 11px",
        borderRadius: "999px",
        fontSize: "10.5px",
        fontWeight: 700,
    },
    actions: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    outlineButton: {
        minHeight: "31px",
        padding: "5px 10px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "6px",
        background: COLORS.white,
        color: COLORS.navy,
        fontSize: "11px",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        cursor: "pointer",
    },
    secondaryButton: {
        minHeight: "31px",
        padding: "5px 10px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "6px",
        background: "#f1f5f9",
        color: COLORS.navy,
        fontSize: "11px",
        fontWeight: 700,
        cursor: "pointer",
    },
    primaryButton: {
        padding: "9px 16px",
        border: "none",
        borderRadius: "8px",
        background: COLORS.orange,
        color: COLORS.white,
        fontSize: "12px",
        fontWeight: 700,
    },
    emptyWrapper: {
        padding: "20px",
    },
    emptyCell: {
        padding: "22px",
        textAlign: "center",
        color: COLORS.slate,
        fontSize: "12px",
    },
    invoiceDetail: {
        marginTop: 0,
    },
    detailHeader: {
        padding: "20px 22px",
        marginBottom: "18px",
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "10px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "20px",
    },
    backButton: {
        padding: 0,
        border: "none",
        background: "transparent",
        color: COLORS.slate,
        fontSize: "12px",
        fontWeight: 700,
        cursor: "pointer",
    },
    detailTitle: {
        marginTop: "8px",
        color: COLORS.navy,
        fontSize: "18px",
        fontWeight: 800,
    },
    detailSub: {
        marginTop: "5px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        color: COLORS.slate,
        fontSize: "12px",
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: "20px",
    },
    infoLabel: {
        marginBottom: "5px",
        color: COLORS.slate,
        fontSize: "10.5px",
        fontWeight: 700,
        textTransform: "uppercase",
    },
    infoValue: {
        color: COLORS.navyText,
        fontSize: "12.5px",
        fontWeight: 700,
    },
    totalInvoice: {
        marginTop: "16px",
        color: COLORS.navy,
        fontSize: "14px",
        fontWeight: 800,
        textAlign: "right",
    },
    invoiceActions: {
        display: "flex",
        justifyContent: "flex-end",
    },
    invoiceNote: {
        marginTop: "10px",
        color: COLORS.slate,
        fontSize: "11px",
        lineHeight: 1.5,
    },
} as const;
