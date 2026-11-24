import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, CheckCircle2, Lock, FileCheck2, ClipboardList, Package, ShieldCheck } from "lucide-react";
import type { SalesOrderDetail, SalesOrderStatus, } from "../types/salesOrder";
import { useSalesOrder, useConfirmSalesOrderWithFile, } from "../api/useSalesOrders";
import { CreateContractFromSoModal } from "./CreateContractFromSoModal";
import { ResourceAvailabilityCard } from "./ResourceAvailabilityCard";
import { Button } from "@shared/components/Button";
import { FileUploadField } from "@shared/components/FileUploadField";
import { CrmPdfPreviewModal } from "../components/CrmPdfPreviewModal";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { ErrorState } from "@shared/components/ErrorState";
import { fileApi } from "@shared/api/fileApi";
import { apiClient } from "@shared/lib/api-client";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { salesOrderApi } from "../api/salesOrderApi";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
const STATUS_LABELS: Record<SalesOrderStatus, string> = {
    pending: "Pending",
    provisioning: "Provisioning",
    active: "Aktif",
    cancelled: "Dibatalkan",
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

/* Detail Sales Order sejajar dengan standar UI Prospek/Quotation. */
.crm-sales-order-ui .crm-so-back-button { display:inline-flex; align-items:center; justify-content:center; align-self:flex-start; gap:9px; min-height:43px; width:max-content; max-width:100%; margin:0 !important; padding:10px 16px !important; border:1px solid #f1ce75; border-radius:12px; background:linear-gradient(115deg,#fffaf0,#fff0ca); color:#8b5b00 !important; text-decoration:none; font-size:12px; font-weight:800; box-shadow:0 4px 13px rgba(219,160,18,.07); }
.crm-sales-order-ui .crm-so-back-button:hover { background:linear-gradient(115deg,#fff2d2,#ffe8aa); border-color:#e8b943; }
.crm-sales-order-ui .crm-so-detail-header { display:flex !important; flex-direction:row; align-items:center !important; gap:24px !important; background:linear-gradient(110deg,#f3f8ff 0%,#fff 53%,#fff3d7 100%) !important; padding:23px 26px !important; border:1px solid #e1e9f3 !important; border-radius:20px !important; box-shadow:0 7px 23px rgba(15,39,71,.045); }
.crm-sales-order-ui .crm-so-detail-identity { display:flex; min-width:0; align-items:center; gap:16px; flex:1 1 320px; }
.crm-sales-order-ui .crm-so-hero-icon { display:grid; flex:0 0 56px; place-items:center; width:56px; height:56px; border-radius:16px; background:#ffedbf; border:1px solid #f3d78e; color:#b57a00; }
.crm-sales-order-ui .crm-so-hero-text {min-width:0;}
.crm-sales-order-ui .crm-so-detail-kicker { font-size:10.5px; font-weight:800; letter-spacing:.07em; color:#7c91a8; margin-bottom:5px; }
.crm-sales-order-ui .crm-so-detail-identity [style] {overflow-wrap:anywhere;}
.crm-sales-order-ui .crm-so-detail-actions { display:flex; flex:0 1 auto; align-items:center; justify-content:flex-end; gap:11px; flex-wrap:wrap; }
.crm-sales-order-ui .crm-so-reference { margin:0 !important; min-height:56px; justify-content:center; padding:9px 13px !important; background:#fffaf0 !important; border:1px solid #f2dfae !important; border-radius:12px !important; }
.crm-sales-order-ui .crm-so-detail-actions button { display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:10px 16px !important; border:1px solid #dce5f0 !important; border-radius:12px !important; background:#fff !important; color:#143657 !important; font-size:12px !important; font-weight:750 !important; white-space:normal; }
.crm-sales-order-ui .crm-so-detail-actions button:hover:not(:disabled) { border-color:#f0c966 !important; background:#fff9ee !important; }
.crm-sales-order-ui .crm-so-pdf-error { flex-basis:100%; color:#b91c1c; font-size:11px; text-align:right; }
.crm-sales-order-ui .crm-so-info-grid { gap:14px !important; }
.crm-sales-order-ui .crm-so-info-grid > div { padding:15px !important; border-radius:13px; border:1px solid #e8eff7 !important; background:linear-gradient(180deg,#fff 0%,#fafcff 100%); }
@media(max-width:940px){ .crm-sales-order-ui .crm-so-detail-header { flex-wrap:wrap; } .crm-sales-order-ui .crm-so-detail-actions { justify-content:flex-start; } }
@media(max-width:620px){ .crm-sales-order-ui .crm-so-detail-header {padding:18px !important;} .crm-sales-order-ui .crm-so-hero-icon {width:44px;height:44px;flex-basis:44px;} .crm-sales-order-ui .crm-so-detail-actions {width:100%;} .crm-sales-order-ui .crm-so-detail-actions button {width:100%;} }


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

export function SalesOrderDetailPage() {
    const params = useParams<{
        id: string;
    }>();
    const soId = params.id
        ? Number(params.id)
        : undefined;
    const { data: so, isLoading, isError, error, } = useSalesOrder(soId);
    const organizationId = useActiveOrgId();
    const [officialPdf, setOfficialPdf] = useState<Blob | null>(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [pdfError, setPdfError] = useState<string | null>(null);
    async function openOfficialSof() {
        if (!soId || !organizationId || pdfLoading) { if (!organizationId) setPdfError("Pilih organisasi aktif terlebih dahulu."); return; }
        setPdfLoading(true); setPdfError(null);
        try {
            const response = await apiClient.get(salesOrderApi.printPdfUrl(soId, organizationId), { responseType: "blob" });
            setOfficialPdf(response.data as Blob);
        } catch (error) { setPdfError(extractErrorMessage(error)); }
        finally { setPdfLoading(false); }
    }
    return (<div className="crm-sales-order-ui">
      <style>{SALES_ORDER_UI_STYLES}</style>
      <PageHeader
  title="SO & Invoice"
  subtitle="Sales order dan status invoice ke Finance"
  containerClassName="px-7 pt-5 pb-2"
/>


      <main className="crm-so-page" style={styles.page}>
        <div className="crm-so-tabs" style={styles.subTabs}>
          <div className="crm-so-tab is-active" style={styles.activeTab}>
            Sales Order
          </div>


          <div className="crm-so-tab" style={styles.inactiveTab}>
            Invoice
          </div>
        </div>


        {isLoading && <LoadingState />}


        {isError && (<ErrorState message={extractErrorMessage(error)}/>)}


        {so && (<div className="crm-so-content-stack" style={styles.contentStack}>
            {/* =============================== */}
            {/* HEADER DETAIL                   */}
            {/* =============================== */}


            <Link to="/crm-sales/sales-orders" className="crm-so-back-button crm-msdc-back-button">
              <ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" /> Kembali ke Sales Order
            </Link>

            <section className="crm-so-detail-header" style={styles.detailHeader}>
              <div className="crm-so-detail-identity">
                <span className="crm-so-hero-icon" aria-hidden="true"><ClipboardList size={25} strokeWidth={1.9} /></span>
                <div className="crm-so-hero-text">
                  <div className="crm-so-detail-kicker">DETAIL SALES ORDER</div>
                  <div style={styles.detailTitle}>{so.so_number}</div>
                  <div style={styles.detailSub}>
                    <span>{so.customer?.company_name ?? "—"}</span>
                    <span>•</span>
                    <StatusBadge status={so.status}/>
                  </div>
                </div>
              </div>
              <div className="crm-so-detail-actions">
                {so.quotation && (
                  <div className="crm-so-reference" style={styles.referenceBox}>
                    <span style={styles.referenceLabel}>DARI QUOTATION</span>
                    <strong style={styles.mono}>{so.quotation.quotation_number}</strong>
                  </div>
                )}
                <Button variant="secondary" disabled={pdfLoading} onClick={openOfficialSof}>
                  <FileText size={16} /> {pdfLoading ? "Memuat SOF..." : "Preview / Download SOF Resmi"}
                </Button>
                {pdfError && <small role="alert" className="crm-so-pdf-error">{pdfError}</small>}
              </div>
            </section>

                        {/* =============================== */}
            {/* INFORMASI SALES ORDER           */}
            {/* =============================== */}


            <section className="crm-so-panel" style={styles.card}>
              <div className="crm-so-card-header" style={styles.cardHeader}>
                <div className="crm-so-card-heading">
                  <ClipboardList size={18} strokeWidth={2.2} />
                  <h3 style={styles.cardTitle}>Informasi Sales Order</h3>
                </div>
              </div>


              <div style={styles.cardBody}>
                <div className="crm-so-info-grid" style={styles.infoGrid}>
                  <InfoItem label="No. Sales Order" value={so.so_number} mono/>


                  <InfoItem label="Tanggal Order" value={formatDate(so.order_date)}/>


                  <InfoItem label="Customer" value={so.customer?.company_name ?? "—"}/>


                  <InfoItem label="Quotation" value={so.quotation?.quotation_number ?? "—"} mono/>


                  <InfoItem label="Total Nilai" value={formatCurrency(so.total_amount)} highlight/>


                  <div>
                    <div style={styles.infoLabel}>
                      STATUS
                    </div>


                    <StatusBadge status={so.status}/>
                  </div>
                </div>
              </div>
            </section>


            {/* =============================== */}
            {/* ITEM LAYANAN                    */}
            {/* =============================== */}


            <section className="crm-so-panel" style={styles.card}>
              <div className="crm-so-card-header" style={styles.cardHeader}>
                <div className="crm-so-card-heading">
                  <Package size={18} strokeWidth={2.2} />
                  <h3 style={styles.cardTitle}>Item Layanan</h3>
                </div>
              </div>


              <div style={styles.tableWrap}>
                <table className="crm-so-table" style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>
                        DESKRIPSI
                      </th>


                      <th style={styles.th}>
                        TIPE
                      </th>


                      <th style={{
                ...styles.th,
                textAlign: "right",
            }}>
                        QTY
                      </th>


                      <th style={{
                ...styles.th,
                textAlign: "right",
            }}>
                        HARGA
                      </th>


                      <th style={{
                ...styles.th,
                textAlign: "right",
            }}>
                        JUMLAH
                      </th>
                    </tr>
                  </thead>


                  <tbody>
                    {(so.lines ?? []).map((line) => (<tr key={line.id}>
                        <td style={styles.td}>
                          {line.description}
                        </td>


                        <td style={{
                    ...styles.td,
                    textTransform: "capitalize",
                }}>
                          {line.service_type.replace(/_/g, " ")}
                        </td>


                        <td style={{
                    ...styles.td,
                    ...styles.mono,
                    textAlign: "right",
                }}>
                          {line.quantity}
                        </td>


                        <td style={{
                    ...styles.td,
                    ...styles.mono,
                    textAlign: "right",
                }}>
                          {formatCurrency(line.unit_price)}
                        </td>


                        <td style={{
                    ...styles.td,
                    ...styles.mono,
                    textAlign: "right",
                    fontWeight: 700,
                }}>
                          {formatCurrency(line.amount)}
                        </td>
                      </tr>))}


                    {(so.lines?.length ?? 0) === 0 && (<tr>
                        <td colSpan={5} style={styles.emptyCell}>
                          Belum ada item layanan.
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>
            </section>


            {officialPdf && <CrmPdfPreviewModal title={`Service Order Form ${so.so_number}`} blob={officialPdf}
              filename={`SOF_${so.so_number}.pdf`} onClose={() => setOfficialPdf(null)} />}
            {/* LOGIC ASLI RESOURCE TETAP */}
            <ResourceAvailabilityCard so={so}/>


            {/* LOGIC ASLI APPROVAL / CONTRACT TETAP */}
            {so.source_contract ? (<ContractIssuedCard so={so}/>) : (<ApprovalCard so={so}/>)}
          </div>)}
      </main>
    </div>);
}
function StatusBadge({ status, }: {
    status: SalesOrderStatus;
}) {
    let background = "#f1f5f9";
    let color = COLORS.slate;
    if (status === "provisioning") {
        background = COLORS.orangeLight;
        color = COLORS.orangeDark;
    }
    if (status === "active") {
        background = COLORS.greenLight;
        color = COLORS.green;
    }
    if (status === "cancelled") {
        background = COLORS.redLight;
        color = COLORS.red;
    }
    return (<span style={{
            padding: "4px 11px",
            borderRadius: "999px",
            background,
            color,
            fontSize: "10.5px",
            fontWeight: 700,
            display: "inline-block",
        }}>
      {STATUS_LABELS[status]}
    </span>);
}
function InfoItem({ label, value, mono = false, highlight = false, }: {
    label: string;
    value: string;
    mono?: boolean;
    highlight?: boolean;
}) {
    return (<div>
      <div style={styles.infoLabel}>
        {label}
      </div>


      <div style={{
            ...styles.infoValue,
            ...(mono ? styles.mono : {}),
            color: highlight
                ? COLORS.orangeDark
                : COLORS.navyText,
        }}>
        {value}
      </div>
    </div>);
}
/* ========================================================= */
/* CONTRACT ISSUED                                           */
/* ========================================================= */
function ContractIssuedCard({ so, }: {
    so: SalesOrderDetail;
}) {
    return (<section className="crm-so-panel" style={styles.card}>
      <div className="crm-so-card-header" style={styles.cardHeader}>
        <div className="crm-so-card-heading">
          <ShieldCheck size={18} strokeWidth={2.2} />
          <h3 style={styles.cardTitle}>Approval Client</h3>
        </div>
      </div>


      <div style={styles.cardBody}>
        <div style={styles.successBox}>
          <CheckCircle2 size={17}/>


          <span>
            Sales Order ini diterbitkan otomatis dari Contract{" "}


            <Link to={`/crm-sales/contracts/${so.source_contract!.id}`} style={{
            color: "#15803d",
            fontFamily: "monospace",
            fontWeight: 700,
        }}>
              {so.source_contract!.contract_number}
            </Link>{" "}


            yang sudah disetujui Finance & Legal dan
            ditandatangani klien.
          </span>
        </div>


        <div style={{ marginTop: "16px" }}>
          {so.po_file_id ? (<ViewSignedPdfButton fileId={so.po_file_id} label="Lihat Dokumen Tanda Tangan Klien"/>) : (<p style={styles.note}>
              Dokumen tanda tangan belum tersedia.
            </p>)}
        </div>
      </div>
    </section>);
}
/* ========================================================= */
/* PDF PREVIEW                                               */
/* ========================================================= */
function ViewSignedPdfButton({ fileId, label, }: {
    fileId: number;
    label: string;
}) {
    const [blob, setBlob] = useState<Blob | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    async function handleClick() {
        setError(null);
        setIsLoading(true);
        try {
            const res = await fileApi.previewBlob(fileId);
            setBlob(res.data);
        }
        catch {
            setError("Gagal memuat file.");
        }
        finally {
            setIsLoading(false);
        }
    }
    return (<>
      <Button variant="secondary" onClick={handleClick} disabled={isLoading}>
        <FileCheck2 size={15}/>


        {isLoading
            ? "Memuat..."
            : label}
      </Button>


      {error && (<div className="input-error" style={{
                marginTop: "8px",
            }}>
          {error}
        </div>)}


      {blob && (<CrmPdfPreviewModal title={label} blob={blob} filename={`${label}.pdf`} onClose={() => setBlob(null)}/>)}
    </>);
}
/* ========================================================= */
/* APPROVAL CLIENT                                           */
/* ========================================================= */
function ApprovalCard({ so, }: {
    so: SalesOrderDetail;
}) {
    const confirmMutation = useConfirmSalesOrderWithFile(so.id);
    const [error, setError] = useState<string | null>(null);
    const [confirmedInvoice, setConfirmedInvoice,] = useState<{
        invoice_number: string;
        total_amount: string;
    } | null>(null);
    const [showContractConfirm, setShowContractConfirm,] = useState(false);
    async function handleUploaded(fileId: number) {
        setError(null);
        setConfirmedInvoice(null);
        try {
            const result = await confirmMutation.mutateAsync(fileId);
            if (result.invoice) {
                setConfirmedInvoice(result.invoice);
            }
        }
        catch (err) {
            setError(extractErrorMessage(err));
        }
    }
    return (<section className="crm-so-panel" style={styles.card}>
      <div className="crm-so-card-header" style={styles.cardHeader}>
        <div>
          <div className="crm-so-card-heading">
            <ShieldCheck size={18} strokeWidth={2.2} />
            <h3 style={styles.cardTitle}>Approval Client</h3>
          </div>


          <p style={{
            ...styles.note,
            marginTop: "4px",
            marginBottom: 0,
        }}>
            Upload PO / approval bertanda tangan dari client.
          </p>
        </div>
      </div>


      <div style={styles.cardBody}>
        <p style={{
            ...styles.note,
            marginTop: 0,
        }}>
          Sales Order otomatis dikonfirmasi menjadi{" "}
          <strong>Aktif</strong> dan AR Invoice dibuat
          otomatis setelah file approval berhasil diunggah.
        </p>


        {!so.resources_reserved_at ? (<div style={styles.warningBox}>
            <Lock size={17}/>


            <span>
              Reservasi resource
              rack/IP/listrik/bandwidth/cross-connect
              terlebih dahulu sebelum upload approval client.
            </span>
          </div>) : (<FileUploadField label="File PO / Approval Client" currentFileId={so.po_file_id} moduleCode="CrmSales" referenceType="sales_order_approval" referenceId={so.id} accept=".pdf,.jpg,.jpeg,.png" onUploaded={handleUploaded}/>)}


        {confirmMutation.isPending && (<p style={styles.note}>
            Menyimpan konfirmasi & membuat invoice...
          </p>)}


        {error && (<div className="input-error" style={{
                marginTop: "10px",
            }}>
            {error}
          </div>)}


        {confirmedInvoice && (<div style={{
                ...styles.successBox,
                marginTop: "12px",
            }}>
            <CheckCircle2 size={17}/>


            <span>
              AR Invoice{" "}


              <strong style={styles.mono}>
                {confirmedInvoice.invoice_number}
              </strong>{" "}


              (
              {formatCurrency(confirmedInvoice.total_amount)}
              ) berhasil dibuat otomatis.
            </span>
          </div>)}


        {so.status === "active" && (<div style={styles.contractSection}>
            {(so.contracts?.length ?? 0) > 0 ? (<div style={styles.successBox}>
                <CheckCircle2 size={17}/>


                <span>
                  Contract{" "}


                  <strong style={styles.mono}>
                    {so.contracts![0]
                    .contract_number}
                  </strong>{" "}


                  sudah dibuat dari Sales Order ini.
                </span>
              </div>) : (<>
                <Button variant="secondary" onClick={() => setShowContractConfirm(true)}>
                  <FileText size={15}/>
                  Buat Contract dari Sales Order Ini
                </Button>


                <p style={styles.note}>
                  Opsional untuk layanan recurring /
                  berlangganan. Contract hanya dapat dibuat
                  1× per Sales Order.
                </p>
              </>)}
          </div>)}


        {showContractConfirm && (<CreateContractFromSoModal soId={so.id} soNumber={so.so_number} soTotalAmount={so.total_amount} onClose={() => setShowContractConfirm(false)}/>)}
      </div>
    </section>);
}
const styles = {
    page: {
        minHeight: "calc(100vh - 64px)",
        padding: "0 clamp(16px, 2.2vw, 32px) 52px",
        background: COLORS.page,
    },
    subTabs: {
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
    },
    activeTab: {
        padding: "8px 16px",
        borderRadius: "8px",
        background: COLORS.navy,
        color: COLORS.white,
        fontWeight: 700,
        fontSize: "12px",
    },
    inactiveTab: {
        padding: "8px 16px",
        borderRadius: "8px",
        background: "#eef2f7",
        color: COLORS.slate,
        fontWeight: 700,
        fontSize: "12px",
    },
    contentStack: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },
    detailHeader: {
        padding: "20px 22px",
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "16px",
        boxShadow: "0 4px 20px -8px rgba(15,39,71,.09)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px",
    },
    backLink: {
        color: COLORS.slate,
        fontWeight: 700,
        fontSize: "12px",
        textDecoration: "none",
    },
    detailTitle: {
        marginTop: "8px",
        fontSize: "18px",
        color: COLORS.navy,
        fontWeight: 800,
    },
    detailSub: {
        marginTop: "5px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
        fontSize: "12px",
        color: COLORS.slate,
    },
    referenceBox: {
        padding: "9px 12px",
        border: `1px solid ${COLORS.border}`,
        borderRadius: "8px",
        background: "#f8fafc",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "12px",
    },
    referenceLabel: {
        fontSize: "10px",
        color: COLORS.slate,
        fontWeight: 700,
    },
    card: {
        background: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px -8px rgba(15,39,71,.09)",
    },
    cardHeader: {
        padding: "17px 22px",
        borderBottom: `1px solid ${COLORS.border}`,
    },
    cardTitle: {
        margin: 0,
        color: COLORS.navy,
        fontSize: "13.5px",
        fontWeight: 800,
    },
    cardBody: {
        padding: "20px",
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "20px 28px",
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
        borderBottom: `1px solid ${COLORS.border}`,
        whiteSpace: "nowrap",
    },
    td: {
        padding: "12px 14px",
        color: COLORS.navyText,
        fontSize: "12px",
        borderBottom: `1px solid ${COLORS.border}`,
    },
    mono: {
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    emptyCell: {
        padding: "24px",
        textAlign: "center",
        fontSize: "12px",
        color: COLORS.slate,
    },
    note: {
        color: COLORS.slate,
        fontSize: "12px",
        lineHeight: 1.6,
    },
    successBox: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#15803d",
        fontSize: "12px",
        lineHeight: 1.5,
    },
    warningBox: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        padding: "10px 12px",
        borderRadius: "8px",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        color: "#92400e",
        fontSize: "12px",
        lineHeight: 1.5,
    },
    contractSection: {
        marginTop: "20px",
        paddingTop: "20px",
        borderTop: `1px solid ${COLORS.border}`,
    },
} as const;
