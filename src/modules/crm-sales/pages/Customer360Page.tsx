import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Receipt,
  Wallet,
  LifeBuoy,
  Wrench,
  Eye,
  Server,
  Cable,
  Network,
  Plug,
  LayoutGrid,
  FileText,
  BadgeCheck,
  CircleDollarSign,
  Search,
  ChevronRight,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  CustomerPicker,
  type CustomerPickerResult,
} from "@shared/components/CustomerPicker";
import { LoadingState } from "@shared/components/LoadingState";
import { PageHeader } from "@shared/components/PageHeader";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { useContractList, useContractRelated } from "../api/useContracts";
import type { ContractStatus } from "../types/contract";

const COLORS = {
  navy: "#16213D",
  navyDeep: "#092747",
  orange: "#F7AB00",
  orangeSoft: "#FFF4D6",
  green: "#16A34A",
  greenSoft: "#DCFCE7",
  red: "#DC2626",
  redSoft: "#FEE2E2",
  slate: "#64748B",
  muted: "#94A3B8",
  border: "#E2E8F0",
  page: "#F5F7FB",
  white: "#FFFFFF",
  track: "#F1F5F9",
};

const CONTRACT_STATUS_LABEL: Record<ContractStatus, string> = {
  draft: "Draft",
  pending_finance_approval: "Menunggu Finance",
  pending_legal_approval: "Menunggu Legal",
  sent_to_client: "Menunggu TTD Klien",
  active: "Aktif",
  expiring_soon: "Akan Berakhir",
  terminated: "Dihentikan",
  expired: "Kedaluwarsa",
};

const cardStyle = {
  background: COLORS.white,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05), 0 4px 12px rgba(15, 23, 42, 0.025)",
  overflow: "hidden",
} as const;


const CUSTOMER360_STYLES = `
.customer360-dashboard { color:#0b2748; }
.customer360-dashboard .c360-page-content { width:100%; box-sizing:border-box; }
.customer360-dashboard .c360-picker-panel,
.customer360-dashboard .c360-contract-panel,
.customer360-dashboard .c360-contract-summary,
.customer360-dashboard .c360-details-stack > div > section { border:1px solid #e4ebf4 !important; border-radius:20px !important; box-shadow:0 5px 19px rgba(11,39,72,.045) !important; }
.customer360-dashboard .c360-picker-panel { margin-bottom:22px; }
.customer360-dashboard .c360-picker-heading,
.customer360-dashboard .c360-panel-heading { display:flex; align-items:center; gap:15px; padding:22px 24px; border-bottom:1px solid #e8edf5; background:linear-gradient(110deg,#f4f8ff 0%,#fff 57%,#fff8e7 100%); border-radius:20px 20px 0 0; }
.customer360-dashboard .c360-heading-icon { display:inline-flex; width:52px; height:52px; min-width:52px; align-items:center; justify-content:center; border-radius:15px; }
.customer360-dashboard .c360-heading-icon--gold { background:#fff0c9; border:1px solid #f9df9f; color:#b87800; }
.customer360-dashboard .c360-heading-icon--blue { background:#edf5ff; border:1px solid #e0ebff; color:#2767d5; }
.customer360-dashboard .c360-heading-copy { flex:1; min-width:0; }
.customer360-dashboard .c360-heading-copy h2 { margin:0; font-size:16px; font-weight:850; letter-spacing:-.02em; color:#0b2748; }
.customer360-dashboard .c360-heading-copy p { margin:4px 0 0; font-size:12px; line-height:1.6; color:#7890a9; }
.customer360-dashboard .c360-top-label { background:#fff; border:1px solid #e5eaf3; border-radius:999px; color:#8ba0b9; font-size:10px; font-weight:800; letter-spacing:.06em; padding:9px 13px; white-space:nowrap; }
.customer360-dashboard .c360-picker-body { padding:20px 24px 23px; background:#fff; border-radius:0 0 20px 20px; }
.customer360-dashboard .c360-section-intro { display:flex; align-items:end; justify-content:space-between; margin:3px 0 15px; }
.customer360-dashboard .c360-eyebrow { color:#b57a00; font-size:10px; font-weight:850; letter-spacing:.11em; }
.customer360-dashboard .c360-section-intro h2 { margin:3px 0; color:#0b2748; font-size:19px; letter-spacing:-.025em; font-weight:850; }
.customer360-dashboard .c360-section-intro p { margin:0; color:#7b8fa8; font-size:12px; }
.customer360-dashboard .c360-section-intro p strong { color:#526c89; }
.customer360-dashboard .c360-kpi-card { border:1px solid #e4ebf4 !important; border-radius:19px !important; background:linear-gradient(180deg,#fff 0%,#fbfdff 100%) !important; box-shadow:0 5px 18px rgba(11,39,72,.04) !important; min-height:148px !important; padding:20px 22px !important; transition:transform .2s ease,box-shadow .2s ease !important; }
.customer360-dashboard .c360-kpi-card:hover { transform:translateY(-2px); box-shadow:0 9px 23px rgba(11,39,72,.075) !important; }
.customer360-dashboard .c360-main-stack { display:flex; flex-direction:column; gap:20px; width:100%; min-width:0; }
.customer360-dashboard .c360-details-stack { width:100%; min-width:0; }
.customer360-dashboard .c360-details-stack > div { width:100%; min-width:0; }
.customer360-dashboard .c360-count-pill { display:inline-flex; align-items:center; justify-content:center; padding:8px 13px; background:#fff; color:#486b92; border:1px solid #e0eaf6; border-radius:999px; font-size:12px; font-weight:800; white-space:nowrap; }
.customer360-dashboard .c360-contract-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:14px; padding:19px 22px 22px; }
.customer360-dashboard .c360-contracts-empty { padding:21px 24px; color:#748aa4; font-size:12px; }
.customer360-dashboard .c360-contract-card { appearance:none; -webkit-appearance:none; border:1px solid #e2eaf3 !important; border-radius:15px !important; background:linear-gradient(180deg,#fff 0%,#fbfcff 100%); box-shadow:0 2px 7px rgba(11,39,72,.025); padding:16px !important; display:flex; flex-direction:column; justify-content:space-between; gap:18px; text-align:left; color:#0b2748; cursor:pointer; min-width:0; transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease; }
.customer360-dashboard .c360-contract-card:hover { border-color:#f3cc76 !important; background:#fffdf6; transform:translateY(-1px); }
.customer360-dashboard .c360-contract-card--active { border:1px solid #eeb132 !important; background:linear-gradient(115deg,#fffaf0,#fff 70%) !important; box-shadow:0 0 0 3px rgba(246,171,0,.07) !important; }
.customer360-dashboard .c360-contract-card-top,.customer360-dashboard .c360-contract-card-bottom { display:flex; justify-content:space-between; align-items:center; gap:12px; width:100%; min-width:0; }
.customer360-dashboard .c360-contract-code { font-size:13px; color:#0d3155; font-weight:850; overflow-wrap:anywhere; letter-spacing:.01em; }
.customer360-dashboard .c360-contract-value { display:flex; flex-direction:column; gap:5px; min-width:0; }
.customer360-dashboard .c360-contract-value small { color:#92a2b6; font-size:10px; font-weight:700; }
.customer360-dashboard .c360-contract-value strong { font-size:15px; font-weight:850; color:#0b2748; letter-spacing:-.02em; overflow-wrap:anywhere; }
.customer360-dashboard .c360-contract-select { display:inline-flex; align-items:center; gap:6px; padding:8px 10px; border-radius:10px; background:#f2f7fc; border:1px solid #e3eaf3; color:#4b6b8d; font-size:11px; font-weight:800; white-space:nowrap; }
.customer360-dashboard .c360-contract-card--active .c360-contract-select { color:#956000; background:#ffefc6; border-color:#f7dd94; }
.customer360-dashboard .c360-empty-welcome,.customer360-dashboard .c360-empty-contract { border:1px solid #e4ebf4; border-radius:20px; box-shadow:0 5px 19px rgba(11,39,72,.045); background:linear-gradient(110deg,#f8fbff 0%,#fff 64%,#fff9ec 100%); }
.customer360-dashboard .c360-empty-welcome { padding:58px 30px; min-height:290px; box-sizing:border-box; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.customer360-dashboard .c360-empty-icon { width:76px; height:76px; border-radius:20px; display:grid; place-items:center; background:#fff2d5; border:1px solid #f7e0a3; color:#b87800; margin-bottom:14px; }
.customer360-dashboard .c360-empty-eyebrow { font-size:10px; color:#b87c00; letter-spacing:.12em; font-weight:850; }
.customer360-dashboard .c360-empty-welcome h2 { font-size:20px; letter-spacing:-.02em; color:#0b2748; margin:9px 0; }
.customer360-dashboard .c360-empty-welcome p { max-width:570px; margin:0; line-height:1.7; font-size:13px; color:#7187a2; }
.customer360-dashboard .c360-empty-steps { display:flex; align-items:center; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:23px; color:#7290b0; font-size:11px; }
.customer360-dashboard .c360-empty-steps span { border:1px solid #e1e9f3; background:white; border-radius:999px; padding:8px 12px; }
.customer360-dashboard .c360-empty-steps b { color:#ad7100; margin-right:6px; }
.customer360-dashboard .c360-empty-contract { display:flex; align-items:center; gap:18px; padding:26px; }
.customer360-dashboard .c360-empty-icon--small { width:57px; height:57px; min-width:57px; border-radius:16px; margin:0; }
.customer360-dashboard .c360-empty-contract h3 { color:#0b2748; font-size:16px; margin:0 0 5px; }
.customer360-dashboard .c360-empty-contract p { margin:0; color:#7f92aa; font-size:12px; line-height:1.6; }
.customer360-dashboard .c360-detail-divider { display:flex; align-items:center; gap:13px; padding:4px 2px 0; }
.customer360-dashboard .c360-detail-divider > span { width:4px; height:31px; border-radius:8px; background:#f4aa0b; flex-shrink:0; }
.customer360-dashboard .c360-detail-divider h3 { margin:0 0 2px; color:#0b2748; font-size:15px; font-weight:850; }
.customer360-dashboard .c360-detail-divider p { margin:0; font-size:11px; color:#8da0b5; }
.customer360-dashboard .c360-contract-summary { background:linear-gradient(115deg,#f6faff,#fff 62%,#fff8e8) !important; }
.customer360-dashboard .c360-summary-head { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; padding:19px 23px; border-bottom:1px solid #e9eff6; }
.customer360-dashboard .c360-summary-title { display:flex; align-items:center; gap:13px; min-width:0; }
.customer360-dashboard .c360-summary-title-icon { width:46px; height:46px; min-width:46px; display:grid; place-items:center; border-radius:13px; background:#fff0ca; border:1px solid #f5dd9d; color:#ad7200; }
.customer360-dashboard .c360-summary-meta { display:flex; align-items:center; gap:9px; flex-wrap:wrap; margin-top:7px; }
.customer360-dashboard .c360-mini-stat-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; padding:17px 23px 21px; }
.customer360-dashboard .c360-mini-stat-grid > div { background:rgba(255,255,255,.88); border:1px solid #e3eaf4; border-radius:12px; padding:14px 16px; }
.customer360-dashboard .c360-table-wrap { width:100%; max-width:100%; overflow-x:auto; overscroll-behavior-x:contain; }
.customer360-dashboard .c360-table { width:100%; min-width:0; table-layout:fixed; border-collapse:collapse; background:#fff; color:#18324f; font-size:12px; }
.customer360-dashboard .c360-table thead tr { background:#f6f8fc; }
.customer360-dashboard .c360-table th { padding:13px 14px; border-bottom:1px solid #e2eaf3; color:#667e9a; font-size:10px; font-weight:800; letter-spacing:.025em; text-transform:uppercase; text-align:left; white-space:normal; overflow-wrap:anywhere; }
.customer360-dashboard .c360-table td { padding:14px; border-bottom:1px solid #edf1f6; vertical-align:middle; line-height:1.5; overflow-wrap:anywhere; }
.customer360-dashboard .c360-table tbody tr:last-child td { border-bottom:0; }
.customer360-dashboard .c360-table tbody tr:nth-child(even) { background:#fbfcfe; }
.customer360-dashboard .c360-table tbody tr:hover { background:#f6f9fd; }
.customer360-dashboard .c360-panel-heading--detail { padding:17px 23px; gap:12px; background:linear-gradient(110deg,#f8fbff 0%,#fff 63%,#fffaf0 100%); }
.customer360-dashboard .c360-panel-heading--detail .c360-heading-icon { width:41px; min-width:41px; height:41px; border-radius:11px; }
.customer360-dashboard .c360-panel-heading--detail .c360-heading-copy h2 { font-size:14px; }
.customer360-dashboard .c360-inline-empty { padding:20px 23px !important; background:#fff; font-size:12px !important; }
.customer360-dashboard .detail-button { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-width:118px; min-height:36px; padding:0 13px; border:1px solid #dbe3ec !important; background:#fff !important; color:#102b4e !important; border-radius:10px !important; font-size:11px; font-weight:750; text-decoration:none; white-space:nowrap; transition:background .18s ease,border-color .18s ease,transform .18s ease,box-shadow .18s ease; }
.customer360-dashboard .detail-button:hover { border-color:#f0a800 !important; background:#fffbeb !important; transform:translateY(-1px); box-shadow:0 4px 11px rgba(15,39,71,.07); }
.customer360-dashboard .c360-contract-card:focus-visible,.customer360-dashboard .detail-button:focus-visible { outline:3px solid rgba(247,171,0,.4); outline-offset:2px; }
@media(max-width:1100px) { .customer360-dashboard .c360-table { font-size:11.5px; } .customer360-dashboard .c360-table th,.customer360-dashboard .c360-table td { padding:11px 9px; } }
@media(max-width:760px) { .customer360-dashboard .c360-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; } .customer360-dashboard .c360-picker-heading,.customer360-dashboard .c360-panel-heading { padding:17px; } .customer360-dashboard .c360-picker-body { padding:16px; } .customer360-dashboard .c360-top-label { display:none; } .customer360-dashboard .c360-mini-stat-grid { padding:14px; gap:8px; } .customer360-dashboard .c360-table { min-width:640px; table-layout:auto; } .customer360-dashboard .c360-empty-contract { align-items:flex-start; } }
@media(max-width:550px) { .customer360-dashboard .c360-page-content { padding-left:14px !important; padding-right:14px !important; } .customer360-dashboard .c360-kpi-grid { grid-template-columns:1fr !important; } .customer360-dashboard .c360-contract-grid { grid-template-columns:1fr; padding:14px; } .customer360-dashboard .c360-summary-head { padding:16px; } .customer360-dashboard .c360-mini-stat-grid { grid-template-columns:1fr; } .customer360-dashboard .c360-empty-welcome { padding:38px 18px; } .customer360-dashboard .c360-heading-icon { width:43px; min-width:43px; height:43px; } .customer360-dashboard .c360-empty-steps > svg { display:none; } }
@media(prefers-reduced-motion:reduce) { .customer360-dashboard .c360-contract-card,.customer360-dashboard .c360-kpi-card,.customer360-dashboard .detail-button { transition:none !important; } .customer360-dashboard .c360-contract-card:hover,.customer360-dashboard .c360-kpi-card:hover,.customer360-dashboard .detail-button:hover { transform:none !important; } }
`;

export function Customer360Page() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customer, setCustomer] = useState<CustomerPickerResult | null>(() => {
    const id = Number(searchParams.get("customer_id"));
    const name = searchParams.get("customer_name");
    if (!Number.isSafeInteger(id) || id <= 0 || !name) return null;
    return { id, company_name: name } as CustomerPickerResult;
  });
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // Sumber data, filter customer, dan kontrak pilihan tetap menggunakan API semula.
  const { data: contractPage, isLoading: loadingContracts } = useContractList({
    customer_id: customer?.id,
    per_page: 100,
  });
  const contracts = contractPage?.data ?? [];
  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === "active").length;
    const monthly = contracts.reduce((sum, c) => sum + Number(c.monthly_value ?? 0), 0);
    return { total: contractPage?.total ?? contracts.length, active, monthly };
  }, [contractPage?.total, contracts]);

  const chooseCustomer = (value: CustomerPickerResult | null) => {
    setCustomer(value);
    setSelectedContractId(null);
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="customer360-dashboard" style={{ minHeight: "100%", background: COLORS.page }}>
      <style>{CUSTOMER360_STYLES}</style>
      <PageHeader
        title="Customer 360"
        subtitle="Pantau kontrak, layanan, billing, resource, dan tiket customer dalam satu tampilan."
        containerClassName="px-7 pt-5 pb-3"
      />

      <div className="c360-page-content" style={{ padding: "0 1.75rem 2.75rem", maxWidth: 1680, margin: "0 auto" }}>
        {/* Pencarian customer: dropdown tetap terlihat, tidak terpotong overflow card. */}
        <section className="c360-picker-panel" style={{ ...cardStyle, overflow: "visible", position: "relative", zIndex: 50 }}>
          <div className="c360-picker-heading">
            <span className="c360-heading-icon c360-heading-icon--gold"><Search size={22} /></span>
            <div className="c360-heading-copy">
              <h2>Pilih Customer</h2>
              <p>Pilih pelanggan untuk menampilkan seluruh informasi kontrak dan layanan secara terintegrasi.</p>
            </div>
            <span className="c360-top-label">CUSTOMER OVERVIEW</span>
          </div>
          <div className="c360-picker-body" style={{ position: "relative", zIndex: 60 }}>
            <CustomerPicker
              label="Cari Customer"
              selectedCustomerId={customer?.id}
              selectedCustomerName={customer?.company_name}
              onSelect={chooseCustomer}
              onClear={() => chooseCustomer(null)}
            />
          </div>
        </section>

        {!customer ? (
          <section className="c360-empty-welcome" aria-label="Belum ada customer dipilih">
            <span className="c360-empty-icon"><Building2 size={29} /></span>
            <span className="c360-empty-eyebrow">CUSTOMER 360 OVERVIEW</span>
            <h2>Mulai dari customer yang ingin dipantau</h2>
            <p>Cari dan pilih customer di atas untuk melihat KPI, seluruh kontrak, layanan, resource, invoice, pembayaran, dan tiket dalam satu halaman.</p>
            <div className="c360-empty-steps" aria-hidden="true">
              <span><b>01</b> Pilih Customer</span>
              <ChevronRight size={16} />
              <span><b>02</b> Pilih Kontrak</span>
              <ChevronRight size={16} />
              <span><b>03</b> Lihat Detail</span>
            </div>
          </section>
        ) : (
          <>
            <div className="c360-section-intro">
              <div>
                <span className="c360-eyebrow">RINGKASAN CUSTOMER</span>
                <h2>Ikhtisar Kontrak &amp; Layanan</h2>
                <p>Informasi utama untuk <strong>{customer.company_name}</strong></p>
              </div>
            </div>
            <div className="c360-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: ".9rem", marginBottom: "1.15rem" }}>
              <KpiCard
                label="TOTAL KONTRAK"
                value={loadingContracts ? "—" : stats.total}
                note={customer.company_name}
                noteColor={COLORS.slate}
                icon={<FileText size={20} strokeWidth={2.1} />}
                iconColor="#2563EB"
                iconBg="#EDF5FF"
              />
              <KpiCard
                label="KONTRAK AKTIF"
                value={loadingContracts ? "—" : stats.active}
                note="Kontrak berjalan"
                noteColor={COLORS.green}
                icon={<BadgeCheck size={20} strokeWidth={2.1} />}
                iconColor="#16A34A"
                iconBg="#EAFBF1"
              />
              <KpiCard
                label="NILAI BULANAN"
                value={loadingContracts ? "—" : compactRupiah(stats.monthly)}
                note="Akumulasi nilai kontrak"
                noteColor="#B77B00"
                icon={<CircleDollarSign size={20} strokeWidth={2.1} />}
                iconColor="#CE8400"
                iconBg="#FFF5DE"
              />
            </div>

            {/* Tata letak satu kolom penuh: daftar kontrak di atas, semua detail di bawah. */}
            <div className="c360-main-stack">
              <section className="c360-contract-panel" style={cardStyle}>
                <div className="c360-panel-heading c360-contract-heading">
                  <span className="c360-heading-icon c360-heading-icon--blue"><Building2 size={20} /></span>
                  <div className="c360-heading-copy">
                    <h2>Daftar Kontrak</h2>
                    <p>Pilih salah satu kontrak untuk membuka seluruh informasi dan resource terkait di bawah.</p>
                  </div>
                  <span className="c360-count-pill">{contractPage?.total ?? 0} kontrak</span>
                </div>
                {loadingContracts && <LoadingState />}
                {!loadingContracts && contracts.length === 0 && (
                  <div className="c360-contracts-empty">Customer ini belum memiliki kontrak yang tercatat.</div>
                )}
                <div className="c360-contract-grid">
                  {contracts.map((contract) => {
                    const active = selectedContractId === contract.id;
                    return (
                      <button
                        key={contract.id}
                        type="button"
                        className={`c360-contract-card ${active ? "c360-contract-card--active" : ""}`}
                        aria-pressed={active}
                        onClick={() => setSelectedContractId(contract.id)}
                      >
                        <span className="c360-contract-card-top">
                          <span className="c360-contract-code">{contract.contract_number}</span>
                          <StatusBadge status={contract.status} label={CONTRACT_STATUS_LABEL[contract.status] ?? contract.status} />
                        </span>
                        <span className="c360-contract-card-bottom">
                          <span className="c360-contract-value">
                            <small>Nilai Bulanan</small>
                            <strong>{formatCurrency(Number(contract.monthly_value ?? 0))}</strong>
                          </span>
                          <span className="c360-contract-select">
                            {active ? <CheckCircle2 size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                            {active ? "Terpilih" : "Pilih"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="c360-details-stack">
                {!selectedContractId ? (
                  <section className="c360-empty-contract" aria-label="Belum ada kontrak dipilih">
                    <span className="c360-empty-icon c360-empty-icon--small"><FileText size={24} /></span>
                    <div>
                      <h3>Detail kontrak akan muncul di sini</h3>
                      <p>Pilih salah satu kartu kontrak di atas. Rincian layanan, perangkat, IP, billing, dan tiket akan ditampilkan selebar halaman.</p>
                    </div>
                  </section>
                ) : (
                  <ContractRelatedPanel contractId={selectedContractId} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ContractRelatedPanel({ contractId }: { contractId: number }) {
  const { data, isLoading } = useContractRelated(contractId);

  if (isLoading) {
    return (
      <section style={cardStyle}>
        <LoadingState />
      </section>
    );
  }

  if (!data) return null;

  const {
    contract,
    invoices,
    payments,
    tickets_operational,
    tickets_support,
    devices,
    cross_connects,
    otb_ports,
    ip_addresses,
    rack_allocations,
  } = data;

  const allTickets = [
    ...tickets_operational.map((t) => ({
      ...t,
      kind: "Gangguan (Ops)" as const,
    })),
    ...tickets_support.map((t) => ({
      ...t,
      kind: "Dukungan" as const,
    })),
  ].sort((a, b) =>
    (b.created_at ?? b.opened_at ?? "").localeCompare(
      a.created_at ?? a.opened_at ?? ""
    )
  );

  const activeServices = contract.services?.length ?? 0;
  const resourceCount =
    rack_allocations.length +
    devices.length +
    cross_connects.length +
    otb_ports.length +
    ip_addresses.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* RINGKASAN KONTRAK */}
      <section className="c360-contract-summary" style={cardStyle}>
        <div className="c360-summary-head">
          <div className="c360-summary-title">
            <span className="c360-summary-title-icon"><FileText size={20} /></span>
            <div>
            <div
              style={{
                color: COLORS.slate,
                fontSize: ".64rem",
                fontWeight: 800,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              KONTRAK TERPILIH
            </div>

            <div
              style={{
                color: COLORS.navy,
                fontFamily: "monospace",
                fontSize: "1rem",
                fontWeight: 900,
              }}
            >
              {contract.contract_number}
            </div>

            <div className="c360-summary-meta">
              <StatusBadge status={contract.status} />
              <span style={{ color: COLORS.muted }}>•</span>
              <span
                style={{
                  color: COLORS.navy,
                  fontSize: ".72rem",
                  fontWeight: 800,
                }}
              >
                {formatCurrency(Number(contract.monthly_value ?? 0))}/bulan
              </span>
            </div>
            </div>
          </div>

          <Link to={`/crm-sales/contracts/${contract.id}`} className="detail-button">
            <Eye size={14} aria-hidden="true" /> Detail Kontrak
          </Link>
        </div>

        <div className="c360-mini-stat-grid">
          <MiniStat label="LAYANAN" value={activeServices} />
          <MiniStat label="RESOURCE" value={resourceCount} />
          <MiniStat
            label="INVOICE"
            value={invoices.length}
          />
        </div>
      </section>

      <div className="c360-detail-divider"><span aria-hidden="true" /><div><h3>Layanan &amp; Alokasi Resource</h3><p>Rincian layanan, perangkat, jaringan, dan alokasi infrastruktur kontrak</p></div></div>
      <DashboardSection
        title="Layanan"
        icon={<Wrench size={14} />}
      >
        {(contract.services ?? []).length === 0 ? (
          <Empty text="Belum ada layanan." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Deskripsi</th>
                  <th>Tipe</th>
                  <th>Qty</th>
                  <th style={{ textAlign: "right" }}>Harga</th>
                  <th>Billing</th>
                </tr>
              </thead>
              <tbody>
                {(contract.services ?? []).map((s, i) => (
                  <tr key={s.id ?? i}>
                    <td style={{ fontWeight: 700 }}>{s.description}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {s.service_type.replace(/_/g, " ")}
                    </td>
                    <td>{s.quantity}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrency(s.unit_price)}
                    </td>
                    <td>
                      <SoftBadge
                        text={
                          s.billing_type === "one_time"
                            ? "One-Time"
                            : "Recurring"
                        }
                        tone={
                          s.billing_type === "one_time"
                            ? "neutral"
                            : "success"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Rack & Slot (${rack_allocations.length})`}
        icon={<LayoutGrid size={14} />}
      >
        {rack_allocations.length === 0 ? (
          <Empty text="Belum ada rack/slot yang dikunci ke kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Rack</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rack_allocations.map((ra) => (
                  <tr key={ra.id}>
                    <td>
                      {ra.rack?.site_room
                        ? `${ra.rack.site_room.room_code} — ${ra.rack.site_room.room_name}`
                        : "—"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {ra.rack?.rack_code ?? "—"}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>
                      {ra.end_u && ra.end_u !== ra.start_u
                        ? `U${ra.start_u}-U${ra.end_u}`
                        : `U${ra.start_u}`}
                    </td>
                    <td>
                      <StatusBadge status={ra.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Perangkat (${devices.length})`}
        icon={<Server size={14} />}
      >
        {devices.length === 0 ? (
          <Empty text="Belum ada perangkat yang ditautkan ke kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Kode Device</th>
                  <th>Nama</th>
                  <th>Tipe</th>
                  <th>Site</th>
                  <th>Room</th>
                  <th>Rack</th>
                  <th>Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {d.device_code}
                    </td>
                    <td style={{ fontWeight: 700 }}>{d.device_name}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {d.device_type}
                    </td>
                    <td>
                      {d.site
                        ? `${d.site.site_name} (${d.site.site_code})`
                        : "—"}
                    </td>
                    <td>
                      {d.site_room
                        ? `${d.site_room.room_code} — ${d.site_room.room_name}`
                        : "—"}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>
                      {d.rack?.rack_code ?? "—"}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>
                      {d.rack_position_u
                        ? d.rack_position_u_end &&
                          d.rack_position_u_end !== d.rack_position_u
                          ? `U${d.rack_position_u}-U${d.rack_position_u_end}`
                          : `U${d.rack_position_u}`
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Cross-Connect (${cross_connects.length})`}
        icon={<Cable size={14} />}
      >
        {cross_connects.length === 0 ? (
          <Empty text="Belum ada kabel Cross-Connect yang ditautkan ke kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>Tag</th>
                  <th>Tipe Kabel</th>
                  <th>Titik A</th>
                  <th>Titik B</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cross_connects.map((cc) => (
                  <tr key={cc.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {cc.tag_number}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {cc.cable_type?.replace(/_/g, " ")}
                    </td>
                    <td>
                      {[cc.source_location, cc.source_port]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td>
                      {[cc.destination_location, cc.destination_port]
                        .filter(Boolean)
                        .join(" / ") || "—"}
                    </td>
                    <td>
                      <StatusBadge status={cc.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Port OTB (${otb_ports.length})`}
        icon={<Plug size={14} />}
      >
        {otb_ports.length === 0 ? (
          <Empty text="Belum ada port OTB yang ditautkan ke kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>OTB</th>
                  <th>Port</th>
                  <th>Layanan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {otb_ports.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.otb
                        ? `${p.otb.tag_number} (${p.otb.location})`
                        : "—"}
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      #{p.port_number}
                    </td>
                    <td>{p.contract_service?.description ?? "—"}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Alokasi IP (${ip_addresses.length})`}
        icon={<Network size={14} />}
      >
        {ip_addresses.length === 0 ? (
          <Empty text="Belum ada alamat IP yang ditautkan ke kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Subnet</th>
                  <th>Layanan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ip_addresses.map((ip) => (
                  <tr key={ip.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {ip.ip_address}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>
                      {ip.subnet?.cidr ?? "—"}
                    </td>
                    <td>{ip.contract_service?.description ?? "—"}</td>
                    <td>
                      <StatusBadge status={ip.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <div className="c360-detail-divider"><span aria-hidden="true" /><div><h3>Billing &amp; Dukungan</h3><p>Invoice, pembayaran, dan tiket operasional serta bantuan pelanggan</p></div></div>
      <DashboardSection
        title={`Invoice (${invoices.length})`}
        icon={<Receipt size={14} />}
      >
        {invoices.length === 0 ? (
          <Empty text="Belum ada invoice untuk kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Tanggal</th>
                  <th>Jatuh Tempo</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {inv.invoice_number}
                    </td>
                    <td>{formatDate(inv.invoice_date)}</td>
                    <td>{formatDate(inv.due_date)}</td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrency(inv.total_amount)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Pembayaran (${payments.length})`}
        icon={<Wallet size={14} />}
      >
        {payments.length === 0 ? (
          <Empty text="Belum ada pembayaran tercatat." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>No. Pembayaran</th>
                  <th>Tanggal</th>
                  <th>Metode</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {p.payment_number}
                    </td>
                    <td>{formatDate(p.payment_date)}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {p.payment_method?.replace(/_/g, " ")}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontWeight: 700,
                      }}
                    >
                      {formatCurrency(p.amount)}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>

      <DashboardSection
        title={`Tiket (${allTickets.length})`}
        icon={<LifeBuoy size={14} />}
      >
        {allTickets.length === 0 ? (
          <Empty text="Belum ada tiket gangguan/dukungan untuk kontrak ini." />
        ) : (
          <TableWrap>
            <table className="c360-table">
              <thead>
                <tr>
                  <th>No. Tiket</th>
                  <th>Jenis</th>
                  <th>Subjek</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                  <th>Dibuat</th>
                </tr>
              </thead>
              <tbody>
                {allTickets.map((t) => (
                  <tr key={`${t.kind}-${t.id}`}>
                    <td style={{ fontFamily: "monospace", fontWeight: 700 }}>
                      {t.ticket_number}
                    </td>
                    <td>
                      <SoftBadge text={t.kind} tone="neutral" />
                    </td>
                    <td style={{ fontWeight: 700 }}>{t.subject}</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {t.priority}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td
                      style={{
                        color: COLORS.slate,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatDate(t.created_at ?? t.opened_at ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </DashboardSection>
    </div>
  );
}

function KpiCard({
  label,
  value,
  note,
  noteColor,
  icon,
  iconColor,
  iconBg,
}: {
  label: string;
  value: string | number;
  note: string;
  noteColor: string;
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
}) {
  return (
    <div
      className="c360-kpi-card"
      style={{
        ...cardStyle,
        minHeight: 126,
        padding: "1rem 1.1rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: ".65rem", minWidth: 0 }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 12,
            background: iconBg,
            color: iconColor,
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <span
          style={{
            color: COLORS.slate,
            fontSize: ".68rem",
            fontWeight: 800,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            lineHeight: 1.35,
          }}
        >
          {label}
        </span>
      </div>

      <div style={{ minWidth: 0, paddingTop: ".65rem" }}>
        <div
          style={{
            color: COLORS.navy,
            fontSize: typeof value === "string" && value.length > 12 ? "1.22rem" : "1.65rem",
            lineHeight: 1.1,
            fontWeight: 900,
            letterSpacing: "-.025em",
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
        <div
          title={note}
          style={{
            color: noteColor,
            fontSize: ".69rem",
            fontWeight: 700,
            marginTop: ".42rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {note}
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div
        style={{
          color: COLORS.slate,
          fontSize: "0.66rem",
          fontWeight: 800,
          letterSpacing: ".04em",
          textTransform: "uppercase",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color: COLORS.navy,
          fontSize: "1.08rem",
          fontWeight: 900,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function DashboardSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="c360-detail-section" style={cardStyle}>
      <div className="c360-panel-heading c360-panel-heading--detail">
        <span className="c360-heading-icon c360-heading-icon--gold">{icon}</span>
        <div className="c360-heading-copy"><h2>{title}</h2></div>
      </div>
      {children}
    </section>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return <div className="c360-table-wrap">{children}</div>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="c360-inline-empty">
      {text}
    </div>
  );
}

function StatusBadge({ status, label }: { status: string; label?: string }) {
  const successStatuses = [
    "active",
    "available",
    "allocated",
    "paid",
    "resolved",
    "completed",
  ];

  const dangerStatuses = [
    "terminated",
    "expired",
    "failed",
    "void",
  ];

  const warningStatuses = [
    "pending",
    "open",
    "in_progress",
    "partially_paid",
    "pending_customer",
    "waiting_customer",
    "expiring_soon",
  ];

  const config = successStatuses.includes(status)
    ? {
        bg: COLORS.greenSoft,
        color: COLORS.green,
      }
    : dangerStatuses.includes(status)
      ? {
          bg: COLORS.redSoft,
          color: COLORS.red,
        }
      : warningStatuses.includes(status)
        ? {
            bg: COLORS.orangeSoft,
            color: "#D99200",
          }
        : {
            bg: "#F1F5F9",
            color: COLORS.slate,
          };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: ".66rem",
        fontWeight: 800,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

function SoftBadge({
  text,
  tone,
}: {
  text: string;
  tone: "success" | "neutral";
}) {
  const config =
    tone === "success"
      ? {
          bg: COLORS.greenSoft,
          color: COLORS.green,
        }
      : {
          bg: "#F1F5F9",
          color: COLORS.slate,
        };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4px 10px",
        borderRadius: 999,
        background: config.bg,
        color: config.color,
        fontSize: ".66rem",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function compactRupiah(value: number) {
  if (!value) return "Rp 0";

  if (value >= 1_000_000_000) {
    const n = value / 1_000_000_000;
    return `Rp ${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1)} M`;
  }

  if (value >= 1_000_000) {
    const n = value / 1_000_000;
    return `Rp ${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(1)} Jt`;
  }

  return formatCurrency(value);
}
