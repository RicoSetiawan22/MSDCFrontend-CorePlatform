import { useState, type ReactNode } from "react";
import { FileText, ShieldCheck, Clock3, CalendarX, Ban, Eye } from "lucide-react";

import { Link, useNavigate } from "react-router-dom";

import { useContractList } from "../api/useContracts";

import { CrmPagination, CRM_DEFAULT_PER_PAGE } from "../components/CrmPagination";

import { EmptyState } from "@shared/components/EmptyState";

import { LoadingState } from "@shared/components/LoadingState";

import { PageHeader } from "@shared/components/PageHeader";

import { formatCurrency } from "@shared/lib/format";

import type { Contract, ContractStatus } from "../types/contract";



const COLORS = {

  navy: "#0b2748",

  navyText: "#16213d",

  slate: "#64748b",

  muted: "#94a3b8",

  orange: "#f5a400",

  green: "#16a34a",

  red: "#dc2626",

  yellow: "#d99200",

  border: "#dfe5ec",

  page: "#f4f7fb",

  white: "#ffffff",

};



const STATUS_LABELS: Record<ContractStatus, string> = {

  draft: "Draft",

  pending_finance_approval: "Menunggu Finance",

  pending_legal_approval: "Menunggu Legal",

  sent_to_client: "Terkirim ke Klien",

  active: "Aktif",

  expiring_soon: "Akan Berakhir",

  expired: "Berakhir",

  terminated: "Dihentikan",

};



const STATUS_STYLE: Record<

  ContractStatus,

  { background: string; color: string }

> = {

  draft: { background: "#eef2f6", color: "#64748b" },

  pending_finance_approval: { background: "#fef3c7", color: "#d99200" },

  pending_legal_approval: { background: "#fef3c7", color: "#d99200" },

  sent_to_client: { background: "#e0f2fe", color: "#0369a1" },

  active: { background: "#dcfce7", color: "#16a34a" },

  expiring_soon: { background: "#fef3c7", color: "#d99200" },

  expired: { background: "#fee2e2", color: "#dc2626" },

  terminated: { background: "#fee2e2", color: "#dc2626" },

};



function readContractText(

  contract: Contract,

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

        "company_name",

        "customer_name",

        "so_number",

        "name",

        "label",

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



function readContractNumber(

  contract: Contract,

  keys: string[],

  fallback = 0

): number {

  const row = contract as unknown as Record<string, unknown>;



  for (const key of keys) {

    const value = row[key];



    if (typeof value === "number" && Number.isFinite(value)) return value;



    if (typeof value === "string") {

      const parsed = Number(value);

      if (Number.isFinite(parsed)) return parsed;

    }

  }



  return fallback;

}



function StatusBadge({ status }: { status: ContractStatus }) {

  const style = STATUS_STYLE[status];



  return (

    <span

      style={{

        display: "inline-flex",

        alignItems: "center",

        justifyContent: "center",

        maxWidth: "100%",

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

      {STATUS_LABELS[status]}

    </span>

  );

}



function KpiCard({
  label,
  value,
  icon,
  iconColor,
  iconBackground,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  iconColor: string;
  iconBackground: string;
}) {
  return (
    <article className="crm-contract-kpi" tabIndex={0} role="group" aria-label={`${label}: ${value}`}>
      <div className="crm-contract-kpi__top">
        <span className="crm-contract-kpi__icon" style={{ color: iconColor, background: iconBackground }} aria-hidden="true">
          {icon}
        </span>
        <span className="crm-contract-kpi__label">{label}</span>
      </div>
      <div className="crm-contract-kpi__value">{value}</div>
    </article>
  );
}

const CONTRACT_LIST_STYLES = `
.crm-contract-list-page { min-height:100%; background:#f5f7fa !important; color:#16213d; }
.crm-contract-list-page .crm-contract-kpis { display:grid !important; grid-template-columns:repeat(5,minmax(0,1fr)) !important; gap:14px !important; margin:0 0 18px !important; }
.crm-contract-list-page .crm-contract-kpi { display:flex; min-width:0; min-height:112px; flex-direction:column; justify-content:space-between; gap:12px; padding:15px 16px !important; border:1px solid #e2e8f0 !important; border-radius:16px !important; background:linear-gradient(180deg,#fff 0%,#fcfdff 100%) !important; box-shadow:0 2px 8px rgba(15,23,42,.045); transition:transform .22s cubic-bezier(.16,1,.3,1),box-shadow .22s cubic-bezier(.16,1,.3,1),border-color .2s ease; }
.crm-contract-list-page .crm-contract-kpi:hover { transform:translateY(-4px); border-color:#cbd5e1 !important; box-shadow:0 12px 26px rgba(15,23,42,.09); }
.crm-contract-list-page .crm-contract-kpi:focus-visible { outline:3px solid rgba(247,171,0,.66); outline-offset:3px; }
.crm-contract-list-page .crm-contract-kpi__top { display:flex; align-items:center; gap:11px; min-width:0; }
.crm-contract-list-page .crm-contract-kpi__icon { display:inline-flex; width:40px; height:40px; flex:0 0 40px; align-items:center; justify-content:center; border-radius:12px; transition:transform .22s cubic-bezier(.16,1,.3,1); }
.crm-contract-list-page .crm-contract-kpi:hover .crm-contract-kpi__icon { transform:scale(1.06) rotate(-3deg); }
.crm-contract-list-page .crm-contract-kpi__label { overflow:hidden; color:#64748b; font-size:10px; font-weight:800; letter-spacing:.055em; line-height:1.4; text-overflow:ellipsis; text-transform:uppercase; }
.crm-contract-list-page .crm-contract-kpi__value { color:#0f2946; font-size:clamp(22px,2vw,28px); font-weight:850; letter-spacing:-.04em; line-height:1.05; font-variant-numeric:tabular-nums; }
.crm-contract-list-page .crm-contract-panel { overflow:hidden; border:1px solid #e2e8f0 !important; border-radius:16px !important; background:#fff !important; box-shadow:0 4px 18px rgba(15,23,42,.045); }
.crm-contract-list-page .crm-contract-panel__title { padding:19px 22px !important; border-bottom:1px solid #edf1f5 !important; color:#102b4e !important; font-size:13px !important; font-weight:800 !important; }
.crm-contract-list-page .crm-contract-table-wrap { width:100%; overflow-x:auto; padding:0 12px; }
.crm-contract-list-page table { width:100%; min-width:0; border-collapse:separate !important; border-spacing:0; }
.crm-contract-list-page thead th { padding:13px 12px !important; border-bottom:1px solid #e2e8f0 !important; background:#f8fafc; color:#64748b !important; font-size:10px !important; font-weight:800 !important; letter-spacing:.055em; }
.crm-contract-list-page tbody tr { background:#fff; transition:background .16s ease; }
.crm-contract-list-page tbody tr:hover { background:#f8fafc; }
.crm-contract-list-page tbody td { padding:13px 12px !important; border-bottom:1px solid #edf1f5 !important; color:#334155; font-size:12px !important; }
.crm-contract-list-page tbody tr:last-child td { border-bottom:0 !important; }
.crm-contract-list-page button { border-radius:9px !important; transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease; }
.crm-contract-list-page button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 5px 12px rgba(15,39,71,.09); }
.crm-contract-list-page .crm-contract-detail-action { display:inline-flex; min-width:86px; min-height:36px; margin:2px 4px; align-items:center; justify-content:center; gap:7px; padding:0 13px !important; border:1px solid #dbe3ec !important; border-radius:10px !important; background:#fff !important; color:#102b4e !important; font-size:11px !important; font-weight:750 !important; white-space:nowrap; }
.crm-contract-list-page .crm-contract-detail-action:hover { border-color:#f0a800 !important; background:#fffbeb !important; }
.crm-contract-list-page .crm-contract-table-wrap tbody td:last-child { padding-right:24px !important; padding-left:18px !important; text-align:center; }
.crm-contract-list-page button:focus-visible,.crm-contract-list-page a:focus-visible { outline:3px solid rgba(247,171,0,.35); outline-offset:2px; }
.crm-contract-list-page .crm-contract-tabs { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-bottom:16px !important; }
.crm-contract-list-page .crm-contract-tabs > a,.crm-contract-list-page .crm-contract-tabs > div { min-height:36px; padding:8px 15px !important; border-radius:10px !important; font-size:12px !important; }
/* Daftar ringkas: tanggal mulai dan berakhir tetap tersedia di detail kontrak. */
.crm-contract-list-page .crm-contract-table-wrap > table { table-layout:fixed; }
.crm-contract-list-page .crm-contract-table-wrap tbody td:nth-child(5) span { white-space:nowrap; }
.crm-contract-list-page .crm-contract-table-wrap thead th { white-space:nowrap !important; }
.crm-contract-list-page .crm-contract-panel { box-shadow:0 5px 18px rgba(15,39,71,.04); }
@media (max-width:790px) { .crm-contract-list-page .crm-contract-table-wrap > table { min-width:960px; } }
@media (max-width:1200px) { .crm-contract-list-page .crm-contract-kpis { grid-template-columns:repeat(3,minmax(0,1fr)) !important; } }
@media (max-width:760px) { .crm-contract-list-page .crm-contract-kpis { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:10px !important; } .crm-contract-list-page > div[style*='padding: 0 2rem'] { padding-left:16px !important; padding-right:16px !important; } }
@media (max-width:480px) { .crm-contract-list-page .crm-contract-kpis { grid-template-columns:1fr !important; } }
@media (prefers-reduced-motion:reduce) { .crm-contract-list-page .crm-contract-kpi,.crm-contract-list-page .crm-contract-kpi__icon,.crm-contract-list-page button { transition:none !important; } .crm-contract-list-page .crm-contract-kpi:hover { transform:none; } }
`;

export function ContractListPage() {

  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(CRM_DEFAULT_PER_PAGE);



  // List utama.

  const { data, isLoading } = useContractList({

    page,

    per_page: perPage,

  });



  // Total KPI langsung dari backend per status agar tidak hanya menghitung

  // isi page aktif.

  const { data: draftData } = useContractList({

    page: 1,

    per_page: 1,

    status: "draft",

  });



  const { data: activeData } = useContractList({

    page: 1,

    per_page: 1,

    status: "active",

  });



  const { data: expiringData } = useContractList({

    page: 1,

    per_page: 1,

    status: "expiring_soon",

  });



  const { data: expiredData } = useContractList({

    page: 1,

    per_page: 1,

    status: "expired",

  });



  const { data: terminatedData } = useContractList({

    page: 1,

    per_page: 1,

    status: "terminated",

  });



  const kpis = [
    { label: "Draft", value: draftData?.total ?? 0, icon: <FileText size={18} />, iconColor: "#2563eb", iconBackground: "#eff6ff" },
    { label: "Aktif", value: activeData?.total ?? 0, icon: <ShieldCheck size={18} />, iconColor: "#059669", iconBackground: "#ecfdf5" },
    { label: "Akan Berakhir", value: expiringData?.total ?? 0, icon: <Clock3 size={18} />, iconColor: "#d97706", iconBackground: "#fffbeb" },
    { label: "Berakhir", value: expiredData?.total ?? 0, icon: <CalendarX size={18} />, iconColor: "#dc2626", iconBackground: "#fef2f2" },
    { label: "Dihentikan", value: terminatedData?.total ?? 0, icon: <Ban size={18} />, iconColor: "#64748b", iconBackground: "#f1f5f9" },
  ];



  return (

    <div className="crm-contract-list-page" style={{ minHeight: "100%", background: COLORS.page }}>
      <style>{CONTRACT_LIST_STYLES}</style>

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
        <div
          style={{
            padding: "8px 15px",
            borderRadius: 8,
            background: COLORS.navy,
            color: "#fff",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          Kontrak
        </div>

        <Link
          to="/crm-sales/contracts/slas"
          style={{
            padding: "8px 15px",
            borderRadius: 8,
            background: "transparent",
            color: COLORS.slate,
            fontSize: "0.75rem",
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
            background: "transparent",
            color: COLORS.slate,
            fontSize: "0.75rem",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Perpanjangan
        </Link>
      </div>

      {/* KPI */}

      <div className="crm-contract-kpis">
        {kpis.map(kpi => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} icon={kpi.icon} iconColor={kpi.iconColor} iconBackground={kpi.iconBackground} />
        ))}
      </div>



      {/* Daftar Kontrak */}

      <section className="crm-contract-panel"
        style={{

          overflow: "hidden",

          background: COLORS.white,

          border: `1px solid ${COLORS.border}`,

          borderRadius: 10,

        }}

      >

        <div className="crm-contract-panel__title"
          style={{

            padding: "0.95rem 1.2rem",

            borderBottom: `1px solid ${COLORS.border}`,

            color: COLORS.navyText,

            fontSize: "0.85rem",

            fontWeight: 800,

          }}

        >

          Daftar Kontrak

        </div>



        {isLoading && (

          <div style={{ padding: "1rem" }}>

            <LoadingState />

          </div>

        )}



        {!isLoading && data && data.data.length === 0 && (

          <div style={{ padding: "1rem" }}>

            <EmptyState

              title="Belum Ada Kontrak"

              subtitle="Kontrak dibuat dari Sales Order."

            />

          </div>

        )}



        {!isLoading && data && data.data.length > 0 && (

          <>

            <div className="crm-contract-table-wrap" style={{ overflowX: "auto", padding: "0 1rem" }}>

              <table

                style={{

                  width: "100%",

                  borderCollapse: "collapse",

                  tableLayout: "fixed",

                }}

              >

                <colgroup>

                  <col style={{ width: "19%" }} />

                  <col style={{ width: "19%" }} />

                  <col style={{ width: "14%" }} />

                  <col style={{ width: "17%" }} />

                  <col style={{ width: "17%" }} />

                  <col style={{ width: "14%" }} />

                </colgroup>



                <thead>

                  <tr>

                    {[

                      "Kode Kontrak",

                      "Pelanggan",

                      "Kode Pesanan",

                      "Nilai Kontrak",

                      "Status",

                      "Aksi",

                    ].map(label => (

                      <th

                        key={label}

                        style={{

                          padding: "0.8rem 0.7rem",

                          borderBottom: `1px solid ${COLORS.border}`,

                          color: COLORS.slate,

                          fontSize: "0.68rem",

                          lineHeight: 1.25,

                          fontWeight: 800,

                          textAlign: "left",

                          textTransform: "uppercase",

                          whiteSpace: "normal",

                        }}

                      >

                        {label}

                      </th>

                    ))}

                  </tr>

                </thead>



                <tbody>

                  {data.data.map(contract => {

                    const customer = readContractText(contract, [

                      "customer",

                      "customer_name",

                      "company_name",

                    ]);



                    const salesOrder = readContractText(contract, [

                      "sales_order",

                      "so_number",

                      "sales_order_number",

                    ]);



                    const contractValue = readContractNumber(contract, [

                      "total_value",

                      "contract_value",

                      "total_amount",

                      "monthly_value",

                    ]);



                    const isExpiring =

                      contract.status === "active" &&

                      contract.days_until_expiry !== null &&

                      contract.days_until_expiry <= 30;



                    const displayedStatus: ContractStatus = isExpiring

                      ? "expiring_soon"

                      : contract.status;



                    const cellStyle = {

                      padding: "0.78rem 0.7rem",

                      borderBottom: `1px solid ${COLORS.border}`,

                      color: COLORS.navyText,

                      fontSize: "0.77rem",

                      lineHeight: 1.4,

                      verticalAlign: "middle",

                      overflow: "hidden",

                    } as const;



                    return (

                      <tr key={contract.id}>

                        <td

                          style={{

                            ...cellStyle,

                            fontWeight: 800,

                          }}

                          title={contract.contract_number}

                        >

                          <div

                            style={{

                              overflow: "hidden",

                              textOverflow: "ellipsis",

                              whiteSpace: "nowrap",

                            }}

                          >

                            {contract.contract_number}

                          </div>

                        </td>



                        <td style={cellStyle} title={customer}>

                          <div

                            style={{

                              overflow: "hidden",

                              textOverflow: "ellipsis",

                              whiteSpace: "nowrap",

                            }}

                          >

                            {customer}

                          </div>

                        </td>



                        <td

                          style={{ ...cellStyle, color: COLORS.slate }}

                          title={salesOrder}

                        >

                          <div

                            style={{

                              overflow: "hidden",

                              textOverflow: "ellipsis",

                              whiteSpace: "nowrap",

                            }}

                          >

                            {salesOrder}

                          </div>

                        </td>



                        <td style={cellStyle}>

                          {formatCurrency(contractValue)}

                        </td>



                        <td style={{ ...cellStyle, overflow: "visible" }}>

                          <StatusBadge status={displayedStatus} />

                        </td>



                        <td

                          style={{

                            ...cellStyle,

                            overflow: "visible",

                          }}

                        >

                          <button
                            type="button"
                            className="crm-contract-detail-action"
                            onClick={() => navigate(`/crm-sales/contracts/${contract.id}`)}
                            title="Lihat detail kontrak"
                          >
                            <Eye size={14} aria-hidden="true" /> Detail
                          </button>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>



            {data.total > 0 && (

              <CrmPagination
                currentPage={data.current_page}
                lastPage={data.last_page}
                total={data.total}
                perPage={perPage}
                onPageChange={setPage}
                onPerPageChange={setPerPage}
              />

            )}

          </>

        )}

      </section>

      </div>

    </div>

  );

}
