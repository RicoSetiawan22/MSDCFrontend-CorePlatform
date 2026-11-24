import { useState, Fragment } from "react";

import { useParams, Link, useNavigate } from "react-router-dom";

import { FileCheck2, FileText, Eye, Send, MapPin, Lock, LayoutGrid, PackageCheck, Server, Wifi, FlaskConical, RefreshCw, ArrowLeft } from "lucide-react";

import { useContract, useTerminateContract, useSubmitContractApproval, useConfirmSignedDocument, useSetContractSite, useContractResourceStatus, useIssueSalesOrderFromContract } from "../api/useContracts";

import { Button } from "@shared/components/Button";

import { PageHeader } from "@shared/components/PageHeader";

import { LoadingState } from "@shared/components/LoadingState";

import { ErrorState } from "@shared/components/ErrorState";

import { EmptyState } from "@shared/components/EmptyState";

import { FileUploadField } from "@shared/components/FileUploadField";

import { Modal } from "@shared/components/Modal";


import { ContractLetterModal } from "./ContractLetterModal";




import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@shared/lib/format";

import { extractErrorMessage } from "@shared/types/api";

import type { ContractDetail, ContractStatus } from "../types/contract";

import { useSiteList, useSite } from "@modules/data-center-ops/api/useSites";

import { useRackList } from "@modules/data-center-ops/api/useRacks";

import { RackVisualPicker } from "@modules/data-center-ops/components/rack";

import type { Rack } from "@modules/data-center-ops/types/rack";



const DETAIL_COLORS = {

  navy: "#0b2748",

  navyText: "#16213d",

  slate: "#64748b",

  muted: "#94a3b8",

  border: "#dfe5ec",

  page: "#f4f7fb",

  white: "#ffffff",

  green: "#16a34a",

  red: "#dc2626",

  orange: "#f5a400",

};


const CONTRACT_DETAIL_STYLES = `
.crm-contract-detail-page { min-height:100%; background:#f5f7fa !important; color:#16213d; }
.crm-contract-detail-page section,.crm-contract-detail-page .content-card { overflow:hidden; border:1px solid #e2e8f0 !important; border-radius:16px !important; background:#fff !important; box-shadow:0 4px 18px rgba(15,23,42,.045); }
.crm-contract-detail-page section > div:first-child { border-color:#edf1f5; }
.crm-contract-detail-page table { width:100%; border-collapse:separate !important; border-spacing:0; }
.crm-contract-detail-page thead th { padding:13px 12px !important; background:#f8fafc !important; border-bottom:1px solid #e2e8f0 !important; color:#64748b !important; font-size:10px !important; font-weight:800 !important; letter-spacing:.055em; }
.crm-contract-detail-page tbody td { padding:12px !important; border-bottom:1px solid #edf1f5 !important; color:#334155; font-size:12px !important; }
.crm-contract-detail-page tbody tr:hover td { background:#f8fafc; }
.crm-contract-detail-page input,.crm-contract-detail-page select,.crm-contract-detail-page textarea { border-color:#dbe3ec !important; border-radius:10px !important; }
.crm-contract-detail-page input:focus,.crm-contract-detail-page select:focus,.crm-contract-detail-page textarea:focus { border-color:#e4a008 !important; box-shadow:0 0 0 3px rgba(240,168,0,.12) !important; outline:none !important; }
.crm-contract-detail-page button { border-radius:10px !important; transition:transform .16s ease,box-shadow .16s ease; }
.crm-contract-detail-page button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.crm-contract-detail-page button:focus-visible,.crm-contract-detail-page a:focus-visible { outline:3px solid rgba(247,171,0,.35); outline-offset:2px; }
.crm-contract-detail-page a { transition:color .16s ease; }
.crm-contract-detail-page .crm-contract-tabs { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:16px !important; }
.crm-contract-detail-page .crm-contract-tabs > a { min-height:36px; padding:8px 15px !important; border-radius:10px !important; font-size:12px !important; }
@media (max-width:760px) { .crm-contract-detail-page > div[style*='padding: 0 2rem'] { padding-left:16px !important; padding-right:16px !important; } .crm-contract-detail-page section > div:first-child { flex-wrap:wrap; } }
@media (prefers-reduced-motion:reduce) { .crm-contract-detail-page button,.crm-contract-detail-page a { transition:none !important; } }

/* Baris dokumen resmi: tetap rapi saat normal, hover, dan loading. */
.crm-contract-detail-page .crm-contract-document-preview {
  width:100%; min-height:62px; display:flex; align-items:center; justify-content:space-between;
  gap:14px; padding:11px 14px; background:#f8fafc; border:1px solid #e2e8f0;
  border-radius:12px !important; color:#16213d; text-align:left; cursor:pointer;
  transition:background-color .16s ease,border-color .16s ease !important;
  box-shadow:none !important;
}
.crm-contract-detail-page .crm-contract-document-preview:hover:not(:disabled) {
  background:#f1f5f9; border-color:#cbd5e1; transform:none !important; box-shadow:none !important;
}
.crm-contract-detail-page .crm-contract-document-preview:disabled { cursor:wait; opacity:.7; }
.crm-contract-detail-page .crm-contract-document-info {
  display:flex; align-items:center; gap:11px; min-width:0; flex:1;
}
.crm-contract-detail-page .crm-contract-document-icon {
  width:36px; height:36px; flex:0 0 36px; display:grid; place-items:center;
  border-radius:10px; color:#9a6700; background:#fff3ce;
}
.crm-contract-detail-page .crm-contract-document-text { display:flex; flex-direction:column; gap:3px; min-width:0; }
.crm-contract-detail-page .crm-contract-document-title {
  font-size:12.5px; font-weight:700; line-height:1.3; color:#16213d;
}
.crm-contract-detail-page .crm-contract-document-subtitle {
  font-size:11px; line-height:1.3; color:#64748b;
}
.crm-contract-detail-page .crm-contract-document-action {
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
  padding:7px 10px; flex-shrink:0; white-space:nowrap;
  border-radius:8px; border:1px solid #e2e8f0; background:#fff;
  color:#0b2748; font-size:11.5px; font-weight:700;
}
/* Header identitas mengikuti bentuk dan gradasi Prospek / Opportunity Baru. */
.crm-contract-detail-page section.crm-contract-detail-hero {
  border: 1px solid #e1e9f3 !important;
  border-radius: 20px !important;
  background: linear-gradient(105deg, #f3f8ff 0%, #fafcff 48%, #fff2d5 100%) !important;
  box-shadow: 0 8px 28px rgba(15,39,71,.045) !important;
}
.crm-contract-detail-page .crm-contract-detail-hero > div:first-child {
  padding: 24px 27px !important;
  align-items: center !important;
  gap: 18px !important;
}
.crm-contract-detail-page .crm-contract-detail-hero__identity {
  display: flex; align-items: center; flex: 1 1 340px;
  gap: 16px; min-width: 0;
}
.crm-contract-detail-page .crm-contract-detail-hero__icon {
  display: flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; flex: 0 0 56px;
  border: 1px solid #f5de9e; border-radius: 17px;
  background: #fff1c7; color: #b47b0b;
}
.crm-contract-detail-page .crm-contract-detail-hero__text { min-width: 0; flex: 1; }
.crm-contract-detail-page .crm-contract-detail-hero__number {
  font-size: 21px !important; font-weight: 850 !important;
  line-height: 1.3 !important; letter-spacing: -.025em !important;
  color: #102b4e !important;
}
.crm-contract-detail-page .crm-contract-detail-hero__actions {
  display: flex; align-items: center; flex-wrap: wrap;
  justify-content: flex-end; gap: 8px;
}
.crm-contract-detail-page .crm-contract-detail-back { display:inline-flex !important; align-items:center; gap:9px; align-self:flex-start; width:max-content; max-width:100%; min-height:42px; margin:0 !important; padding:9px 13px; border:1px solid #f3c96a; border-radius:12px; background:linear-gradient(120deg,#fffaf0 0%,#fff1ce 100%); color:#8c5800 !important; font-size:.74rem !important; font-weight:800 !important; box-shadow:0 3px 9px rgba(219,160,18,.06); }
.crm-contract-detail-page .crm-contract-detail-back:hover { color:#754a00 !important; background:linear-gradient(120deg,#fff1cf 0%,#ffe7a9 100%); border-color:#edbe52; box-shadow:0 6px 16px rgba(219,160,18,.14); }
.crm-contract-detail-page section:not(.crm-contract-detail-hero) { border-color:#e5ebf3 !important; border-radius:18px !important; box-shadow:0 4px 15px rgba(15,39,71,.035); }
.crm-contract-detail-page .crm-contract-document-preview { background:linear-gradient(120deg,#f8fafc,#fffaf0); }
.crm-contract-detail-page section h2,.crm-contract-detail-page section h3 { letter-spacing:-.012em; }
@media (max-width:760px) {
  .crm-contract-detail-page .crm-contract-detail-hero > div:first-child { padding:18px !important; flex-wrap:wrap !important; }
  .crm-contract-detail-page .crm-contract-detail-hero__identity { flex-basis:100%; }
  .crm-contract-detail-page .crm-contract-detail-hero__actions { justify-content:flex-start; }
}
@media (max-width:420px) {
  .crm-contract-detail-page .crm-contract-detail-hero__icon { width:46px; height:46px; flex-basis:46px; border-radius:14px; }
  .crm-contract-detail-page .crm-contract-detail-hero__number { font-size:17px !important; overflow-wrap:anywhere; }
}
@media (max-width:420px) {
  .crm-contract-detail-page .crm-contract-document-preview { gap:9px; padding:10px; }
  .crm-contract-detail-page .crm-contract-document-action { padding:7px 8px; }
}

/* Tombol kembali dan area detail sejajar dengan header dan modul lain. */
.crm-contract-detail-page .crm-contract-detail-back { padding:11px 17px !important; gap:10px; box-shadow:0 5px 14px rgba(180,123,11,.065); transition:background .18s ease,border-color .18s ease,box-shadow .18s ease,transform .18s ease; }
.crm-contract-detail-page .crm-contract-detail-back:hover { transform:translateY(-1px); }
.crm-contract-detail-page .crm-contract-detail-hero__actions > button { min-height:42px; border-radius:11px !important; }
@media(max-width:760px){ .crm-contract-detail-page .crm-contract-detail-back { min-height:42px; } }


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





function readContractDetailText(

  contract: ContractDetail,

  keys: string[],

  fallback = "—"

): string {

  const row = contract as unknown as Record<string, unknown>;



  for (const key of keys) {

    const value = row[key];



    if (typeof value === "string" && value.trim()) return value;

    if (typeof value === "number") return String(value);



    if (value && typeof value === "object" && !Array.isArray(value)) {

      const nested = value as Record<string, unknown>;



      for (const nestedKey of [

        "name",

        "label",

        "company_name",

        "so_number",

        "payment_term_name",

        "billing_cycle_name",

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



  return fallback;

}



const STATUS_LABELS: Record<ContractStatus, string> = {

  draft: "Draft",

  pending_finance_approval: "Menunggu Approval Finance",

  pending_legal_approval: "Menunggu Approval Legal",

  sent_to_client: "Terkirim ke Klien",

  active: "Aktif",

  expiring_soon: "Akan Berakhir",

  expired: "Berakhir",

  terminated: "Dihentikan",

};



/** Lokasi & Kunci Resource, Layanan, dan SLA HANYA bisa diedit selama

 * 'draft' - staf pilih Site + kunci rack/slot + definisikan SLA DULU

 * sebelum "Ajukan Approval", supaya Finance & Legal me-review PERSIS

 * resource yang akan dipakai (SAMA persis dengan

 * ContractManagementService::LOCKED_STATUSES di backend). Begitu diajukan,

 * SEMUANYA beku sampai akhir - termasuk setelah 'active' (SO diterbitkan

 * OTOMATIS begitu klien tanda tangan, lihat confirmSignedDocument()).

 * Balik editable lagi HANYA kalau Finance/Legal REJECT (balik ke 'draft'). */

function isContractLocked(status: ContractStatus): boolean {

  return status !== "draft";

}



function LockedBadge() {

  return (

    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: 4, background: "#f3f4f6", color: "#6b7280" }}>

      <Lock size={10} /> Terkunci selama approval

    </span>

  );

}



const STATUS_BADGE: Record<ContractStatus, string> = {

  draft: "inactive",

  pending_finance_approval: "prospect",

  pending_legal_approval: "prospect",

  sent_to_client: "prospect",

  active: "active",

  expiring_soon: "inactive",

  expired: "churned",

  terminated: "churned",

};



export function ContractDetailPage() {

  const params = useParams<{ id: string }>();

  const navigate = useNavigate();

  const contractId = params.id ? Number(params.id) : undefined;

  const { data: contract, isLoading, isError, error } = useContract(contractId);

  const terminateMutation = useTerminateContract(contractId ?? 0);

  const submitApprovalMutation = useSubmitContractApproval(contractId ?? 0);

  const confirmSignedMutation = useConfirmSignedDocument(contractId ?? 0);

  // Dipakai gerbang tombol "Ajukan Approval" - jangan biarkan diajukan

  // sebelum resource (rack/slot) selesai dikunci, supaya Finance & Legal

  // benar-benar me-review lokasi yang sudah final (lihat pertanyaan sama di

  // ResourceLockSection - query key React Query yang sama, tidak nge-fetch

  // dobel).

  const { data: lockStatus } = useContractResourceStatus(contractId, !!contract?.site_id);


  const [submitError, setSubmitError] = useState<string | null>(null);

  const [signedError, setSignedError] = useState<string | null>(null);



  // Surat resmi Contract & SLA berasal dari PDF backend (penandatangan read-only).

  const [letterOpen, setLetterOpen] = useState(false);



  async function handleTerminate() {

    if (!contract) return;

    if (!confirm(`Terminate kontrak ${contract.contract_number}? Tindakan ini irreversible.`)) return;

    try { await terminateMutation.mutateAsync(); }

    catch (err) { alert(extractErrorMessage(err)); }

  }



  async function handleSubmitApproval() {

    if (!contract) return;

    if (!confirm(`Ajukan kontrak ${contract.contract_number} untuk approval Finance, Legal, Manager, EPM1, dan EPM2? Site, Rack, dan SLA terkunci sampai seluruh approval selesai.`)) return;

    setSubmitError(null);

    try { await submitApprovalMutation.mutateAsync(contract); }

    catch (err) { setSubmitError(extractErrorMessage(err)); }

  }



  async function handleSignedUploaded(fileId: number) {

    setSignedError(null);

    try { await confirmSignedMutation.mutateAsync(fileId); }

    catch (err) { setSignedError(extractErrorMessage(err)); }

  }



  // Pratinjau DULU (iframe di PdfPreviewModal) sebelum diunduh/dicetak -

  // dokumen RESMI, lengkap dengan TTD/QR EPM1 & EPM2 dari approval

  // masing-masing, serta baris "Mengetahui" Finance/Legal/Manager,

  // sama pola dengan Quotation/dokumen procurement lainnya di app ini.




  return (

    <div className="crm-contract-detail-page" style={{ minHeight: "100%", background: DETAIL_COLORS.page }}>
      <style>{CONTRACT_DETAIL_STYLES}</style>

      <PageHeader
        title="Kontrak & SLA"
        subtitle="Kontrak berjalan dan performa layanan"
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

            background: DETAIL_COLORS.navy,

            color: "#fff",

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

            color: DETAIL_COLORS.slate,

            fontSize: "0.76rem",

            fontWeight: 700,

            textDecoration: "none",

          }}

        >

          SLA

        </Link>



        <Link

          to="/crm-sales/contracts/renewals"

          style={{

            padding: "8px 15px",

            borderRadius: 8,

            color: DETAIL_COLORS.slate,

            fontSize: "0.76rem",

            fontWeight: 700,

            textDecoration: "none",

          }}

        >

          Perpanjangan

        </Link>

      </div>



      {isLoading && <LoadingState />}

      {isError && <ErrorState message={extractErrorMessage(error)} />}



      {contract && (

        <div

          style={{

            display: "flex",

            flexDirection: "column",

            gap: "1rem",

          }}

        >

          <Link
            className="crm-contract-detail-back crm-msdc-back-button"
            to="/crm-sales/contracts"
            aria-label="Kembali ke daftar Kontrak"
            style={{ textDecoration: "none" }}
          >
            <ArrowLeft size={17} strokeWidth={2.2} aria-hidden="true" />
            <span>Kembali ke daftar Kontrak</span>
          </Link>

          {/* Header detail kontrak konsisten dengan kartu soft MSDC */}

          <section className="crm-contract-detail-hero"

            style={{

              background: DETAIL_COLORS.white,

              border: `1px solid ${DETAIL_COLORS.border}`,

              borderRadius: 10,

              overflow: "hidden",

            }}

          >

            <div

              style={{

                padding: "1rem 1.15rem",

                display: "flex",

                alignItems: "flex-start",

                justifyContent: "space-between",

                gap: "1rem",

              }}

            >

              <div className="crm-contract-detail-hero__identity">
                <span className="crm-contract-detail-hero__icon" aria-hidden="true">
                  <FileCheck2 size={26} strokeWidth={2} />
                </span>
                <div className="crm-contract-detail-hero__text">



                <div
                  className="crm-contract-detail-hero__number"
                  style={{

                    color: DETAIL_COLORS.navyText,

                    fontSize: "1.15rem",

                    lineHeight: 1.2,

                    fontWeight: 800,

                    marginBottom: "0.35rem",

                  }}

                >

                  {contract.contract_number}

                </div>



                <div

                  style={{

                    display: "flex",

                    alignItems: "center",

                    flexWrap: "wrap",

                    gap: "0.4rem",

                    color: DETAIL_COLORS.slate,

                    fontSize: "0.74rem",

                  }}

                >

                  <span>{contract.customer?.company_name ?? "—"}</span>

                  <span>•</span>

                  <span className={`badge badge-${STATUS_BADGE[contract.status]}`}>

                    {STATUS_LABELS[contract.status]}

                  </span>

                </div>

              </div>

              </div>

              <div
                className="crm-contract-detail-hero__actions"
                style={{

                  display: "flex",

                  alignItems: "center",

                  flexWrap: "wrap",

                  justifyContent: "flex-end",

                  gap: "0.5rem",

                }}

              >

<Button

                  variant="secondary"

                  onClick={() => setLetterOpen(true)}

                  title="Tampilkan surat resmi Contract & SLA dari backend"

                >

                  <FileText size={14} />

                  Surat Kontrak & SLA

                </Button>



                {contract.status === "draft" && (

                  <Button

                    variant="secondary"

                    disabled={

                      submitApprovalMutation.isPending || !lockStatus?.ok

                    }

                    title={

                      !lockStatus?.ok

                        ? "Kunci dulu semua resource sebelum diajukan approval"

                        : undefined

                    }

                    onClick={handleSubmitApproval}

                  >

                    <Send size={14} />

                    {submitApprovalMutation.isPending

                      ? "Mengajukan..."

                      : "Ajukan Approval"}

                  </Button>

                )}



                {contract.status === "active" && (

                  <>

                    <Button

                      variant="secondary"

                      onClick={() => navigate(`/crm-sales/contracts/renewals/${contract.id}`)}

                    >

                      <RefreshCw size={14} />

                      Perpanjangan

                    </Button>



                    <Button

                      variant="danger"

                      disabled={terminateMutation.isPending}

                      onClick={handleTerminate}

                    >

                      {terminateMutation.isPending ? "Memproses..." : "Akhiri Kontrak"}

                    </Button>

                  </>

                )}

              </div>

            </div>

          </section>



          {/* Ringkasan utama: Detail Kontrak + Dokumen */}

          <div

            style={{

              display: "grid",

              gridTemplateColumns: "1.3fr 1fr",

              gap: "1rem",

            }}

          >

            <section

              style={{

                background: DETAIL_COLORS.white,

                border: `1px solid ${DETAIL_COLORS.border}`,

                borderRadius: 10,

                overflow: "hidden",

              }}

            >

              <div

                style={{

                  padding: "0.9rem 1.15rem",

                  borderBottom: `1px solid ${DETAIL_COLORS.border}`,

                  color: DETAIL_COLORS.navyText,

                  fontSize: "0.82rem",

                  fontWeight: 800,

                }}

              >

                Detail Kontrak

              </div>



              <div

                style={{

                  padding: "1rem 1.15rem",

                  display: "grid",

                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",

                  gap: "1rem 1.4rem",

                }}

              >

                {[

                  [

                    "SALES ORDER",

                    contract.sales_order?.so_number ?? "—",

                  ],

                  [

                    "NILAI",

                    formatCurrency(Number(contract.monthly_value ?? 0)),

                  ],

                  [

                    "TANGGAL MULAI",

                    formatDate(contract.start_date),

                  ],

                  [

                    "TANGGAL BERAKHIR",

                    formatDate(contract.end_date),

                  ],

                  [

                    "METODE PEMBAYARAN",

                    readContractDetailText(

                      contract,

                      ["payment_term", "payment_term_name"],

                      "—"

                    ),

                  ],

                  [

                    "PENAGIHAN",

                    readContractDetailText(

                      contract,

                      ["billing_cycle", "billing_cycle_name"],

                      "—"

                    ),

                  ],

                ].map(([label, value]) => (

                  <div key={label} style={{ minWidth: 0 }}>

                    <div

                      style={{

                        marginBottom: 3,

                        color: DETAIL_COLORS.slate,

                        fontSize: "0.63rem",

                        fontWeight: 800,

                      }}

                    >

                      {label}

                    </div>



                    <div

                      style={{

                        color: DETAIL_COLORS.navyText,

                        fontSize: "0.76rem",

                        fontWeight: 700,

                        overflowWrap: "anywhere",

                      }}

                    >

                      {value}

                    </div>

                  </div>

                ))}

              </div>

            </section>



            <section

              style={{

                background: DETAIL_COLORS.white,

                border: `1px solid ${DETAIL_COLORS.border}`,

                borderRadius: 10,

                overflow: "hidden",

              }}

            >

              <div

                style={{

                  padding: "0.9rem 1.15rem",

                  borderBottom: `1px solid ${DETAIL_COLORS.border}`,

                  color: DETAIL_COLORS.navyText,

                  fontSize: "0.82rem",

                  fontWeight: 800,

                }}

              >

                Dokumen

              </div>



              <div style={{ padding: "0.75rem 1.15rem 1rem" }}>

                <button
                  type="button"
                  className="crm-contract-document-preview"
                  onClick={() => setLetterOpen(true)}
                  aria-label="Preview Dokumen Kontrak Resmi"
                >
                  <span className="crm-contract-document-info">
                    <span className="crm-contract-document-icon" aria-hidden="true">
                      <FileText size={17} />
                    </span>
                    <span className="crm-contract-document-text">
                      <span className="crm-contract-document-title">Dokumen Kontrak Resmi</span>
                      <span className="crm-contract-document-subtitle">Dokumen PDF</span>
                    </span>
                  </span>
                  <span className="crm-contract-document-action">
                    <Eye size={14} aria-hidden="true" />
                    Preview
                  </span>
                </button>



                {contract.signed_file && (

                  <div

                    style={{

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "space-between",

                      gap: "0.75rem",

                      padding: "0.7rem 0",

                      borderBottom: `1px solid ${DETAIL_COLORS.border}`,

                      color: DETAIL_COLORS.navyText,

                      fontSize: "0.72rem",

                    }}

                  >

                    <span

                      style={{

                        display: "flex",

                        alignItems: "center",

                        gap: "0.45rem",

                        minWidth: 0,

                      }}

                    >

                      <FileCheck2 size={14} color={DETAIL_COLORS.green} />

                      <span

                        style={{

                          overflow: "hidden",

                          textOverflow: "ellipsis",

                          whiteSpace: "nowrap",

                        }}

                      >

                        {contract.signed_file.original_name}

                      </span>

                    </span>



                    <strong style={{ color: DETAIL_COLORS.green }}>

                      Tertanda tangan

                    </strong>

                  </div>

                )}



                {(contract.addenda ?? []).map(addendum => (

                  <div

                    key={addendum.id}

                    style={{

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "space-between",

                      gap: "0.75rem",

                      padding: "0.7rem 0",

                      borderBottom: `1px solid ${DETAIL_COLORS.border}`,

                      color: DETAIL_COLORS.navyText,

                      fontSize: "0.72rem",

                    }}

                  >

                    <span

                      style={{

                        display: "flex",

                        alignItems: "center",

                        gap: "0.45rem",

                      }}

                    >

                      <FileText size={14} color={DETAIL_COLORS.slate} />

                      {addendum.addendum_number}

                    </span>



                    <span style={{ color: DETAIL_COLORS.slate }}>

                      {formatDate(addendum.effective_date)}

                    </span>

                  </div>

                ))}



                {!contract.signed_file &&

                  (contract.addenda ?? []).length === 0 && (

                    <div

                      style={{

                        padding: "0.9rem 0 0.2rem",

                        color: DETAIL_COLORS.muted,

                        fontSize: "0.7rem",

                      }}

                    >

                      Belum ada dokumen tambahan yang terdaftar.

                    </div>

                  )}

              </div>

            </section>

          </div>



          {/* Workflow/approval tetap dipertahankan */}

          {(contract.status === "pending_finance_approval" ||

            contract.status === "pending_legal_approval") && (

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: "0.5rem",

                background: "#fffbeb",

                border: "1px solid #fde68a",

                borderRadius: 8,

                padding: "0.75rem 0.9rem",

                fontSize: "0.78rem",

                color: "#92400e",

              }}

            >

              <Send size={16} />

              {contract.status === "pending_finance_approval"

                ? "Menunggu approval Finance, lalu Legal, Manager, EPM1, dan EPM2."

                : "Persetujuan lanjutan Legal, Manager, EPM1, dan EPM2 sedang diproses. PDF resmi dikirim setelah EPM2 menyetujui."}

            </div>

          )}



          {submitError && (

            <div className="input-error">{submitError}</div>

          )}



          {contract.status === "sent_to_client" && (

            <section

              style={{

                background: DETAIL_COLORS.white,

                border: `1px solid ${DETAIL_COLORS.border}`,

                borderRadius: 10,

                padding: "1rem",

              }}

            >

              <div

                style={{

                  display: "flex",

                  alignItems: "center",

                  gap: "0.5rem",

                  marginBottom: "0.5rem",

                  color: DETAIL_COLORS.navyText,

                  fontWeight: 700,

                  fontSize: "0.8rem",

                }}

              >

                <FileCheck2 size={16} color="var(--accent)" />

                Kontrak sudah dikirim ke klien

                {contract.sent_to_client_at

                  ? ` (${formatDate(contract.sent_to_client_at)})`

                  : ""}

              </div>



              <p

                style={{

                  fontSize: "0.75rem",

                  color: DETAIL_COLORS.slate,

                  marginTop: 0,

                  marginBottom: "0.75rem",

                }}

              >

                Setelah klien menandatangani dokumen, unggah PDF final di

                sini agar kontrak dapat diaktifkan.

              </p>



              <FileUploadField

                label="File Kontrak Bertanda Tangan"

                moduleCode="CrmSales"

                referenceType="contract_signed_document"

                referenceId={contract.id}

                accept=".pdf,.jpg,.jpeg,.png"

                onUploaded={handleSignedUploaded}

              />



              {confirmSignedMutation.isPending && (

                <div

                  style={{

                    fontSize: "0.75rem",

                    color: DETAIL_COLORS.slate,

                    marginTop: "0.5rem",

                  }}

                >

                  Menyimpan &amp; mengaktifkan kontrak...

                </div>

              )}



              {signedError && (

                <div className="input-error">{signedError}</div>

              )}

            </section>

          )}



          {/* Site & Resource Lock - alur BARU Quotation -> Contract -> Rack Lock -> SO otomatis */}

          <ResourceLockSection contract={contract} isLocked={isContractLocked(contract.status)} />



          {/* Instalasi & Testing - diisi OTOMATIS oleh DataCenterOps > Perintah Kerja */}

          <InstallationStatusSection contract={contract} />



          {/* Services */}

          <div className="content-card" style={{ margin: 0 }}>

            <div style={{ padding: "1.25rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>

              <h3 style={{ margin: 0, fontSize: "1rem" }}>Layanan</h3>

              {isContractLocked(contract.status) && <LockedBadge />}

            </div>

            {(contract.services ?? []).length === 0 ? (

              <EmptyState title="Belum Ada Layanan" subtitle="Kontrak ini belum punya baris layanan." />

            ) : (

              <table className="table">

                <thead>

                  <tr><th>Deskripsi</th><th>Tipe</th><th>Billing</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Harga</th><th style={{ textAlign: "right" }}>Jumlah</th></tr>

                </thead>

                <tbody>

                  {contract.services!.map((s) => (

                    <Fragment key={s.id}>

                      <tr>

                        <td>{s.description}</td>

                        <td style={{ textTransform: "capitalize" }}>{s.service_type.replace(/_/g, " ")}</td>

                        <td>

                          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 4, background: s.billing_type === "one_time" ? "#fef3c7" : "#dbeafe", color: s.billing_type === "one_time" ? "#92400e" : "#1d4ed8" }}>

                            {s.billing_type === "one_time" ? "One-Time" : "Recurring"}

                          </span>

                        </td>

                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatNumber(s.quantity, 2)}</td>

                        <td style={{ textAlign: "right", fontFamily: "monospace" }}>{formatCurrency(s.unit_price)}</td>

                        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{s.amount ? formatCurrency(s.amount) : "—"}</td>

                      </tr>

                      {(s.cc_source_location || s.cc_destination_location) && (

                        <tr>

                          <td colSpan={6} style={{ padding: "0 0.75rem 0.6rem", fontSize: "0.75rem", color: "var(--grey)" }}>

                            🔌 {s.cc_source_location ?? "—"} → {s.cc_destination_location ?? "—"}

                          </td>

                        </tr>

                      )}

                    </Fragment>

                  ))}

                </tbody>

              </table>

            )}

          </div>



          {/* SLA */}

          <div className="content-card" style={{ margin: 0 }}>

            <div style={{ padding: "1.25rem 1.5rem 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>

                <h3 style={{ margin: 0, fontSize: "1rem" }}>SLA</h3>

                {isContractLocked(contract.status) && <LockedBadge />}

              </div>

              <Link to={`/crm-sales/contracts/${contract.id}/slas`} style={{ fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>

                {isContractLocked(contract.status) ? "Lihat SLA →" : "Kelola SLA →"}

              </Link>

            </div>

            {(contract.slas ?? []).length === 0 ? (

              <EmptyState title="Belum Ada SLA" subtitle="Kontrak ini belum punya SLA terdaftar." />

            ) : (

              <table className="table">

                <thead>

                  <tr><th>Nama SLA</th><th style={{ textAlign: "right" }}>Target Uptime</th><th style={{ textAlign: "right" }}>Response</th><th style={{ textAlign: "right" }}>Resolution</th></tr>

                </thead>

                <tbody>

                  {contract.slas!.map((s) => (

                    <tr key={s.id}>

                      <td>{s.sla_name}</td>

                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>{s.uptime_target_pct}%</td>

                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>{s.response_time_minutes} menit</td>

                      <td style={{ textAlign: "right", fontFamily: "monospace" }}>{s.resolution_time_hours} jam</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>



          {/* Cross-Connect - kabel DataCenterOps yang ditautkan lewat field

              Kontrak di form Edit Kabel (CrossConnectController::update()) */}

          {(contract.cross_connects ?? []).length > 0 && (

            <div className="content-card" style={{ margin: 0 }}>

              <div style={{ padding: "1.25rem 1.5rem 0" }}>

                <h3 style={{ margin: 0, fontSize: "1rem" }}>Cross-Connect</h3>

              </div>

              <table className="table">

                <thead>

                  <tr><th>Tag</th><th>Tipe Kabel</th><th>Titik A</th><th>Titik B</th><th>Status</th></tr>

                </thead>

                <tbody>

                  {contract.cross_connects!.map((cc) => (

                    <tr key={cc.id}>

                      <td style={{ fontFamily: "monospace" }}>

                        <Link to="/dc/cross-connects" style={{ color: "var(--accent)", textDecoration: "none" }}>{cc.tag_number}</Link>

                      </td>

                      <td style={{ textTransform: "capitalize" }}>{cc.cable_type?.replace(/_/g, " ")}</td>

                      <td>{[cc.source_location, cc.source_port].filter(Boolean).join(" / ") || "—"}</td>

                      <td>{[cc.destination_location, cc.destination_port].filter(Boolean).join(" / ") || "—"}</td>

                      <td style={{ textTransform: "capitalize" }}>{cc.status?.replace(/_/g, " ")}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}



          {/* Addenda */}

          {(contract.addenda ?? []).length > 0 && (

            <div className="content-card" style={{ margin: 0 }}>

              <div style={{ padding: "1.25rem 1.5rem 0" }}>

                <h3 style={{ margin: 0, fontSize: "1rem" }}>Addendum</h3>

              </div>

              <table className="table">

                <thead>

                  <tr><th>No Addendum</th><th>Tanggal Berlaku</th><th>Deskripsi</th></tr>

                </thead>

                <tbody>

                  {contract.addenda!.map((a) => (

                    <tr key={a.id}>

                      <td style={{ fontFamily: "monospace" }}>{a.addendum_number}</td>

                      <td>{formatDate(a.effective_date)}</td>

                      <td>{a.description}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      )}
      </div>

      {letterOpen && contract && (

        <ContractLetterModal

          contract={contract}

          onClose={() => setLetterOpen(false)}

        />

      )}




    </div>

  );

}



/**

 * Alur BARU: setelah Contract dibuat dari Quotation, staf pilih Site DC

 * tujuan & kunci rack/slot yang sesuai kebutuhan (lewat RackVisualPicker per

 * rack) SELAGI MASIH 'draft' - supaya Finance & Legal me-review lokasi yang

 * PERSIS akan dipakai saat approval. Begitu diajukan, semuanya beku

 * (read-only) - lalu begitu klien tanda tangan (Contract jadi 'active'), SO

 * diterbitkan OTOMATIS, TANPA tombol manual lagi (lihat

 * ContractManagementService::confirmSignedDocument() ->

 * lockResourcesAndIssueSalesOrder()). Tombol "Terbitkan Sales Order" di

 * bawah cuma jaring pemulihan untuk kasus langka SO gagal terbit otomatis.

 */

function ResourceLockSection({ contract, isLocked }: { contract: ContractDetail; isLocked: boolean }) {

  const [selectedSiteId, setSelectedSiteId] = useState<number | "">(contract.site_id ?? "");

  const [pickerRack, setPickerRack] = useState<Rack | null>(null);

  const [issueError, setIssueError] = useState<string | null>(null);



  const { data: siteListPage } = useSiteList({ per_page: 100 });

  const setSiteMutation = useSetContractSite(contract.id);

  const { data: lockStatus } = useContractResourceStatus(contract.id, !!contract.site_id);

  const issueMutation = useIssueSalesOrderFromContract(contract.id);



  const siteChanged = selectedSiteId !== "" && selectedSiteId !== contract.site_id;

  const currentSiteLabel = siteListPage?.data.find((s) => s.id === contract.site_id);



  async function handleSaveSite() {

    if (selectedSiteId === "") return;

    try { await setSiteMutation.mutateAsync(selectedSiteId); }

    catch (err) { alert(extractErrorMessage(err)); }

  }



  async function handleIssueSo() {

    if (!confirm(`Kunci resource & terbitkan Sales Order otomatis dari Contract ${contract.contract_number}?`)) return;

    setIssueError(null);

    try { await issueMutation.mutateAsync(); }

    catch (err) { setIssueError(extractErrorMessage(err)); }

  }



  const canIssueSo = contract.status === "active" && !contract.issued_sales_order && !!lockStatus?.ok;



  return (

    <div className="content-card" style={{ margin: 0 }}>

      <div style={{ padding: "1.25rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>

        <div>

          <h3 style={{ margin: 0, fontSize: "1rem" }}>Lokasi & Kunci Resource</h3>

          <p style={{ fontSize: "0.8rem", color: "var(--grey)", marginTop: "0.3rem" }}>

            Pilih Site data center & kunci rack/slot sesuai kebutuhan layanan SEBELUM ajukan approval - Finance & Legal me-review lokasi ini. Sales Order diterbitkan otomatis begitu klien tanda tangan.

          </p>

        </div>

        {isLocked && <LockedBadge />}

      </div>



      <div style={{ padding: "1rem 1.5rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

        {/* Site selector - readonly (nilai apa adanya, tanpa dropdown/tombol

            Simpan) selama proses approval berjalan, supaya apa yang

            diapprove Finance/Legal tidak diam-diam berubah. */}

        {isLocked ? (

          <div>

            <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>

              <MapPin size={13} /> Site Data Center

            </div>

            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>

              {currentSiteLabel ? `${currentSiteLabel.site_code} — ${currentSiteLabel.site_name}` : "— Belum dipilih —"}

            </div>

          </div>

        ) : (

          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem" }}>

            <div style={{ flex: 1, maxWidth: 320 }}>

              <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginBottom: "0.3rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>

                <MapPin size={13} /> Site Data Center

              </div>

              <select className="input" value={selectedSiteId}

                onChange={(e) => setSelectedSiteId(e.target.value ? Number(e.target.value) : "")}>

                <option value="">— Pilih Site —</option>

                {(siteListPage?.data ?? []).map((s) => (

                  <option key={s.id} value={s.id}>{s.site_code} — {s.site_name}</option>

                ))}

              </select>

            </div>

            {siteChanged && (

              <Button onClick={handleSaveSite} disabled={setSiteMutation.isPending}>

                {setSiteMutation.isPending ? "Menyimpan..." : "Simpan Site"}

              </Button>

            )}

          </div>

        )}



        {/* Resource lock status */}

        {contract.site_id && lockStatus && (

          <div style={{ background: lockStatus.ok ? "#f0fdf4" : "var(--bg-subtle)", border: lockStatus.ok ? "1px solid #86efac" : "1px solid var(--border)", borderRadius: 8, padding: "0.85rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>

            {lockStatus.ok ? <PackageCheck size={18} color="#16a34a" /> : <Lock size={16} color="var(--grey)" />}

            <div style={{ fontSize: "0.82rem" }}>

              {lockStatus.required_unit_u > 0 && (

                <span>Unit rack: <strong>{lockStatus.locked_unit_u}U</strong> / {lockStatus.required_unit_u}U terkunci. </span>

              )}

              {lockStatus.required_whole_racks > 0 && (

                <span>Rack penuh: <strong>{lockStatus.locked_whole_racks}</strong> / {lockStatus.required_whole_racks} terkunci. </span>

              )}

              {lockStatus.required_unit_u === 0 && lockStatus.required_whole_racks === 0 && (

                <span>Kontrak ini tidak butuh alokasi rack.</span>

              )}

              {lockStatus.ok && <strong style={{ color: "#16a34a" }}> Semua resource sudah terkunci.</strong>}

            </div>

          </div>

        )}



        {/* Rack browser per Site - disembunyikan (bukan cuma disable) selama

            approval berjalan, supaya tidak ada cara diam-diam kunci/lepas

            slot ketika dokumen sedang direview. */}

        {isLocked ? (

          contract.site_id && (

            <p style={{ fontSize: "0.78rem", color: "var(--grey)", fontStyle: "italic" }}>

              🔒 Kunci/lepas rack dinonaktifkan - resource sudah dikunci final sebelum diajukan approval. Tersedia lagi kalau ditolak (balik ke Draft).

            </p>

          )

        ) : (

          contract.site_id && <SiteRackBrowser siteId={contract.site_id} onPick={setPickerRack} />

        )}



        {/* Terbitkan SO */}

        {contract.issued_sales_order ? (

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#15803d", fontWeight: 600 }}>

            <PackageCheck size={16} />

            Sales Order sudah diterbitkan:{" "}

            <Link to={`/crm-sales/sales-orders/${contract.issued_sales_order.id}`} style={{ color: "var(--accent)", fontFamily: "monospace" }}>
              {contract.issued_sales_order.so_number}
            </Link>
            <Link to={`/crm-sales/sales-orders/${contract.issued_sales_order.id}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.55rem 0.85rem", borderRadius: 8,
                background: DETAIL_COLORS.orange, color: DETAIL_COLORS.white, textDecoration: "none", fontSize: 12, fontWeight: 800 }}>
              <PackageCheck size={15} /> Lihat Detail Sales Order →
            </Link>

          </div>

        ) : (

          contract.status === "active" && (

            <div>

              <p style={{ fontSize: "0.75rem", color: "var(--grey)", marginBottom: "0.4rem" }}>

                Biasanya SO sudah terbit otomatis begitu klien tanda tangan - tombol ini jaring pemulihan kalau karena suatu sebab belum terbit.

              </p>

              <Button onClick={handleIssueSo} disabled={!canIssueSo || issueMutation.isPending}>

                {issueMutation.isPending ? "Memproses..." : "Terbitkan Sales Order"}

              </Button>

              {!lockStatus?.ok && (

                <div style={{ fontSize: "0.75rem", color: "var(--grey)", marginTop: "0.4rem" }}>

                  Resource belum lengkap terkunci - hubungi admin untuk pemulihan manual (Site/Rack sudah tidak bisa diedit lewat halaman ini setelah diajukan approval).

                </div>

              )}

              {issueError && <div className="input-error" style={{ marginTop: "0.4rem" }}>{issueError}</div>}

            </div>

          )

        )}

      </div>



      {!isLocked && pickerRack && (

        <Modal title={`🗄️ Slot Rack — ${pickerRack.rack_code}`} onClose={() => setPickerRack(null)} maxWidth={520}>

          <RackVisualPicker rackId={pickerRack.id} contractId={contract.id} customerId={contract.customer_id} allocationStatus="active" />

        </Modal>

      )}

    </div>

  );

}



/** Ringkasan tanggal pemasangan fisik oleh DC Ops - SEPENUHNYA read-only di

 * sini (diisi otomatis begitu staf DC Ops mencentang checklist "Perintah

 * Kerja" di Data Center Operations, lihat WorkOrderService::

 * recomputeContractDates() backend) - tidak ada tombol edit manual di

 * halaman Contract supaya tanggal ini selalu mencerminkan kondisi fisik

 * yang sebenarnya sudah dikonfirmasi staf lapangan, bukan klaim admin. */

function InstallationStatusSection({ contract }: { contract: ContractDetail }) {

  // "Internet Terpasang" cuma relevan kalau contract ini benar-benar punya

  // baris layanan bandwidth/cross_connect - WorkOrderService::recomputeContractDates()

  // di backend cuma bisa mengisi internet_installed_at kalau ada item

  // checklist kategori itu SAMA SEKALI (kategori kosong = null selamanya,

  // BUKAN "belum selesai"). SEBELUMNYA halaman ini menganggap internet_installed_at

  // null == "belum dipasang" tanpa kecuali, jadi contract yang cuma jual

  // mis. Managed Service (tanpa bandwidth/cross-connect) SELAMANYA nyangkut

  // di "Sebagian sudah selesai" walau Perintah Kerja-nya sudah 100% (2/2)

  // di DataCenterOps - lihat WorkOrderDetailPage doneCount/items.length yang

  // memang tidak pernah membuat item "internet" kalau tidak ada baris

  // layanan itu di contract.

  const requiresInternet = (contract.services ?? []).some((s) => s.service_type === "bandwidth" || s.service_type === "cross_connect");

  const relevantValues = [

    contract.device_installed_at,

    ...(requiresInternet ? [contract.internet_installed_at] : []),

    contract.testing_completed_at,

  ];

  const hasAny = relevantValues.some(Boolean);

  const allDone = relevantValues.every(Boolean);



  return (

    <div className="content-card" style={{ margin: 0 }}>

      <div style={{ padding: "1.25rem 1.5rem 0" }}>

        <h3 style={{ margin: 0, fontSize: "1rem" }}>Instalasi & Testing</h3>

        <p style={{ fontSize: "0.8rem", color: "var(--grey)", marginTop: "0.3rem" }}>

          Direkap otomatis dari checklist "Perintah Kerja" Data Center Operations - bukan diisi manual di sini.

        </p>

      </div>

      <div style={{ padding: "1rem 1.5rem 1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>

        <InstallDateCard icon={<Server size={16} />} label="Perangkat Terpasang" value={contract.device_installed_at} />

        <InstallDateCard icon={<Wifi size={16} />} label="Internet Terpasang" value={contract.internet_installed_at} notApplicable={!requiresInternet} />

        <InstallDateCard icon={<FlaskConical size={16} />} label="Testing Selesai" value={contract.testing_completed_at} />

      </div>

      {!hasAny && (

        <div style={{ padding: "0 1.5rem 1.25rem", fontSize: "0.78rem", color: "var(--grey)" }}>

          Belum ada item yang selesai dipasang - proses di DataCenterOps &gt; Perintah Kerja.

        </div>

      )}

      {hasAny && !allDone && (

        <div style={{ padding: "0 1.5rem 1.25rem", fontSize: "0.78rem", color: "var(--grey)" }}>

          Sebagian sudah selesai - lanjutkan checklist-nya di DataCenterOps &gt; Perintah Kerja.

        </div>

      )}

    </div>

  );

}



function InstallDateCard({ icon, label, value, notApplicable }: { icon: React.ReactNode; label: string; value: string | null; notApplicable?: boolean }) {

  const done = !!value;



  if (notApplicable) {

    return (

      <div style={{

        flex: "1 1 200px", display: "flex", alignItems: "center", gap: "0.6rem",

        border: "1px dashed var(--border)", borderRadius: 10,

        padding: "0.7rem 0.9rem", background: "var(--bg-subtle)", opacity: 0.65,

      }}>

        <div style={{ color: "var(--grey)" }}>{icon}</div>

        <div>

          <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>{label}</div>

          <div style={{ fontWeight: 600, fontSize: "0.78rem", color: "var(--grey)", fontStyle: "italic" }}>

            Tidak berlaku — kontrak ini tidak menjual layanan internet/cross-connect

          </div>

        </div>

      </div>

    );

  }



  return (

    <div style={{

      flex: "1 1 200px", display: "flex", alignItems: "center", gap: "0.6rem",

      border: `1px solid ${done ? "#86efac" : "var(--border)"}`, borderRadius: 10,

      padding: "0.7rem 0.9rem", background: done ? "#f0fdf4" : "var(--bg-subtle)",

    }}>

      <div style={{ color: done ? "#16a34a" : "var(--grey)" }}>{icon}</div>

      <div>

        <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>{label}</div>

        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: done ? "#15803d" : "var(--grey)" }}>

          {done ? formatDateTime(value) : "Belum"}

        </div>

      </div>

    </div>

  );

}



/** Daftar Room -> Rack di dalam 1 Site terpilih - dipakai cari rack yang mau

 * dikunci untuk Contract ini. Room & Rack DataCenterOps terhubung lewat

 * site_room_id (bukan site_id langsung), jadi drill-down 2 tingkat. */

function SiteRackBrowser({ siteId, onPick }: { siteId: number; onPick: (rack: Rack) => void }) {

  const { data: site, isLoading } = useSite(siteId);



  if (isLoading) return <LoadingState />;

  if (!site || (site.rooms ?? []).length === 0) {

    return <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Site ini belum punya Room terdaftar - tambahkan Room & Rack dulu di DataCenterOps.</div>;

  }



  return (

    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

      {site.rooms!.map((room) => (

        <RoomRackList key={room.id} roomId={room.id} roomLabel={`${room.room_code} — ${room.room_name}`} onPick={onPick} />

      ))}

    </div>

  );

}



function RoomRackList({ roomId, roomLabel, onPick }: { roomId: number; roomLabel: string; onPick: (rack: Rack) => void }) {

  const { data } = useRackList({ site_room_id: roomId, per_page: 100 });

  const racks = data?.data ?? [];



  if (racks.length === 0) return null;



  return (

    <div>

      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--grey)", marginBottom: "0.4rem" }}>{roomLabel}</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>

        {racks.map((rack) => (

          <button key={rack.id} type="button" onClick={() => onPick(rack)}

            className="btn btn-secondary" style={{ fontSize: "0.72rem", padding: "0.3rem 0.6rem" }}>

            <LayoutGrid size={12} /> {rack.rack_code} ({rack.total_u}U)

          </button>

        ))}

      </div>

    </div>

  );

}
