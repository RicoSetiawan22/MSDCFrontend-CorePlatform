import { useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Search,
  Plus,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
  Filter,
} from "lucide-react";
import {
  useCustomerList,
  useSetCustomerStatus,
  useDeleteCustomer,
} from "../api/useCustomers";
import { Button } from "@shared/components/Button";
import { CrmPagination, CRM_DEFAULT_PER_PAGE } from "../components/CrmPagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { CustomerCreateModal, CustomerEditModal } from "./CustomerFormPage";
import type { Customer, CustomerStatus } from "../types/customer";

const STATUS_LABEL: Record<CustomerStatus, string> = {
  prospect: "Prospek",
  active: "Aktif",
  inactive: "Nonaktif",
  churned: "Churned",
};

const CUSTOMER_UI_STYLES = `
.crm-customer-ui {
  --customer-bg: #f5f7fb;
  --customer-surface: #ffffff;
  --customer-ink: #102b4e;
  --customer-text: #1e293b;
  --customer-muted: #64748b;
  --customer-border: #e2e8f0;
  --customer-accent: #f0a800;
  min-height: 100%;
  padding-bottom: 28px;
  background: var(--customer-bg);
  color: var(--customer-text);
}
.crm-customer-ui * { box-sizing: border-box; }
.crm-customer-ui button, .crm-customer-ui input, .crm-customer-ui select { font-family: inherit; }
.crm-customer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 clamp(16px, 2.2vw, 32px) 28px;
  padding-top: 12px;
}
.crm-customer-summary {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 17px 21px;
  border: 1px solid rgba(226,232,240,.92);
  border-radius: 16px;
  background: linear-gradient(110deg, #ffffff 0%, #fbfdff 100%);
  box-shadow: 0 2px 8px rgba(15,39,71,.035);
  transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .2s ease;
}
.crm-customer-summary:hover { transform: translateY(-2px); border-color: #cbd5e1; box-shadow: 0 10px 22px rgba(15,39,71,.075); }
.crm-customer-summary__main { display: flex; min-width: 0; align-items: center; gap: 13px; }
.crm-customer-summary__icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
}
.crm-customer-summary__label {
  display: block;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .075em;
  line-height: 1.4;
  text-transform: uppercase;
}
.crm-customer-summary__value {
  display: block;
  margin-top: 3px;
  color: #102b4e;
  font-size: 23px;
  font-weight: 850;
  letter-spacing: -.045em;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.crm-customer-summary__note { margin-top: 3px; color: #94a3b8; font-size: 11px; font-weight: 550; }
.crm-customer-summary__hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: #fff;
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}
.crm-customer-summary__hint svg { color: #d97706; }
.crm-customer-list-card {
  overflow: hidden;
  border: 1px solid var(--customer-border);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 4px 20px -8px rgba(15,39,71,.09);
}
.crm-customer-list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-bottom: 1px solid #edf1f5;
  background: #fff;
}
.crm-customer-list-heading__title { margin: 0; color: #102b4e; font-size: 14px; font-weight: 850; letter-spacing: -.015em; }
.crm-customer-list-heading__subtitle { margin: 4px 0 0; color: #94a3b8; font-size: 11px; font-weight: 500; }
.crm-customer-list-heading__meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid #dbeafe;
  border-radius: 9px;
  background: #eff6ff;
  color: #315b8a;
  font-size: 11px;
  font-weight: 750;
  white-space: nowrap;
}
.crm-customer-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  padding: 15px 22px;
  border-bottom: 1px solid #edf1f5;
  background: #f8fafc;
}
.crm-customer-search {
  display: flex;
  min-width: 220px;
  min-height: 42px;
  flex: 1 1 340px;
  align-items: center;
  gap: 9px;
  padding: 9px 13px;
  border: 1px solid #dbe3ec;
  border-radius: 11px;
  background: #fff;
  color: #94a3b8;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.crm-customer-search:focus-within { border-color: #e4a008; box-shadow: 0 0 0 4px rgba(240,168,0,.12); }
.crm-customer-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #1e293b;
  font-size: 12px;
  font-weight: 550;
}
.crm-customer-search input::placeholder { color: #94a3b8; }
.crm-customer-filter-wrap { position: relative; display: flex; min-width: 160px; align-items: center; }
.crm-customer-filter-wrap > svg { position: absolute; left: 12px; z-index: 1; color: #94a3b8; pointer-events: none; }
.crm-customer-filter {
  width: 100%;
  min-height: 42px;
  padding: 0 30px 0 35px;
  border: 1px solid #dbe3ec;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #334155;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition: border-color .18s ease, box-shadow .18s ease;
}
.crm-customer-filter:focus { border-color: #e4a008; box-shadow: 0 0 0 3px rgba(240,168,0,.12); }
.crm-customer-new-button { min-height: 42px !important; padding: 0 17px !important; border-radius: 11px !important; font-size: 12px !important; font-weight: 800 !important; box-shadow: 0 4px 10px rgba(240,168,0,.16); }
.crm-customer-new-button:hover { transform: translateY(-1px); box-shadow: 0 7px 15px rgba(240,168,0,.22); }
.crm-customer-new-button:focus-visible, .crm-customer-action:focus-visible, .crm-customer-filter:focus-visible, .crm-customer-search:focus-within {
  outline: 3px solid rgba(240,168,0,.22);
  outline-offset: 2px;
}
.crm-customer-table-wrap { width: 100%; overflow-x: auto; }
.crm-customer-table { width: 100%; min-width: 760px; border-collapse: separate; border-spacing: 0; text-align: left; }
.crm-customer-table thead th {
  padding: 13px 15px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .065em;
  text-transform: uppercase;
  white-space: nowrap;
}
.crm-customer-table thead th:first-child, .crm-customer-table tbody td:first-child { padding-left: 22px; }
.crm-customer-table thead th:last-child, .crm-customer-table tbody td:last-child { padding-right: 22px; }
.crm-customer-table tbody tr { background: #fff; transition: background .16s ease; }
.crm-customer-table tbody tr:hover { background: #f8fafc; }
.crm-customer-table tbody td {
  padding: 14px 15px;
  border-bottom: 1px solid #edf1f5;
  color: #334155;
  font-size: 12px;
  vertical-align: middle;
}
.crm-customer-table tbody tr:last-child td { border-bottom: 0; }
.crm-customer-code {
  display: inline-flex;
  align-items: center;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #f8fafc;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}
.crm-customer-company { display: flex; min-width: 0; align-items: center; gap: 10px; }
.crm-customer-company__icon {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
}
.crm-customer-company__name { display: block; overflow: hidden; color: #102b4e; font-size: 12px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; cursor: default; }
.crm-customer-company__legal { display: block; margin-top: 3px; overflow: hidden; color: #94a3b8; font-size: 10px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.crm-customer-npwp { color: #475569; font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
.crm-customer-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
}
.crm-customer-status__dot { width: 6px; height: 6px; flex: 0 0 6px; border-radius: 50%; background: currentColor; }
.crm-customer-status--prospect { border-color: #dbeafe; background: #eff6ff; color: #2563eb; }
.crm-customer-status--active { border-color: #d1fae5; background: #ecfdf5; color: #059669; }
.crm-customer-status--inactive { border-color: #e2e8f0; background: #f8fafc; color: #64748b; }
.crm-customer-status--churned { border-color: #ffe4e6; background: #fff1f2; color: #e11d48; }
.crm-customer-actions { display: flex; align-items: center; justify-content: flex-end; gap: 5px; white-space: nowrap; }
.crm-customer-action {
  display: inline-flex;
  min-height: 31px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 9px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  color: #64748b;
  font-size: 10px;
  font-weight: 750;
  cursor: pointer;
  transition: color .16s ease, background .16s ease, border-color .16s ease, transform .16s ease, box-shadow .16s ease;
}
.crm-customer-action:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(15,39,71,.07); }
.crm-customer-action:disabled { opacity: .5; cursor: not-allowed; }
.crm-customer-action--activate { border-color: #d1fae5; background: #ecfdf5; color: #059669; }
.crm-customer-action--activate:hover:not(:disabled) { border-color: #a7f3d0; background: #d1fae5; }
.crm-customer-action--edit:hover:not(:disabled) { border-color: #fde68a; background: #fffbeb; color: #b77900; }
.crm-customer-action--delete { color: #e11d48; }
.crm-customer-action--delete:hover:not(:disabled) { border-color: #fecdd3; background: #fff1f2; color: #be123c; }
.crm-customer-empty { padding: 24px 22px; }
.crm-customer-ui button:focus-visible { outline: 3px solid rgba(240,168,0,.3); outline-offset: 2px; }
@media (max-width: 760px) {
  .crm-customer-content { margin-right: 16px; margin-left: 16px; }
  .crm-customer-list-heading { align-items: flex-start; flex-direction: column; }
  .crm-customer-toolbar { align-items: stretch; padding: 14px 16px; }
  .crm-customer-search { flex-basis: 100%; }
  .crm-customer-filter-wrap { flex: 1 1 145px; }
  .crm-customer-new-button { flex: 1 1 100%; }
}
@media (max-width: 520px) {
  .crm-customer-summary { align-items: flex-start; flex-direction: column; padding: 15px; }
  .crm-customer-summary__hint { align-self: flex-start; }
  .crm-customer-list-heading { padding: 16px; }
  .crm-customer-table thead th:first-child, .crm-customer-table tbody td:first-child { padding-left: 16px; }
  .crm-customer-table thead th:last-child, .crm-customer-table tbody td:last-child { padding-right: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .crm-customer-ui *, .crm-customer-ui *::before, .crm-customer-ui *::after { scroll-behavior: auto !important; transition: none !important; animation-duration: .01ms !important; }
}
`;

function CustomerPageStyles() {
  return <style>{CUSTOMER_UI_STYLES}</style>;
}

export function CustomerListPage() {
  const navigate = useNavigate();
  const returningToQuotation = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const editFromQuotation = searchParams.get("return_to") === "quotations";
  const requestedCustomerId = Number(searchParams.get("edit_customer"));
  const customerIdToEdit = editFromQuotation && Number.isSafeInteger(requestedCustomerId) && requestedCustomerId > 0 ? requestedCustomerId : null;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(CRM_DEFAULT_PER_PAGE);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "">("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);

  const { data, isLoading, refetch } = useCustomerList({
    page,
    per_page: perPage,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  if (isCreateModalOpen) {
    return (
      <CustomerCreateModal
        onClose={() => setIsCreateModalOpen(false)}
        onSaved={() => refetch()}
      />
    );
  }

  return (
    <div className="crm-customer-ui">
      <CustomerPageStyles />
      <PageHeader
        title="Customer"
        subtitle="Kelola data pelanggan dan lihat status hubungan bisnis Anda."
        containerClassName="px-7 pt-5 pb-2"
      />

      <main className="crm-customer-content">
        <section className="crm-customer-summary" aria-label="Ringkasan customer">
          <div className="crm-customer-summary__main">
            <span className="crm-customer-summary__icon" aria-hidden="true">
              <Building2 size={20} strokeWidth={2.1} />
            </span>
            <div>
              <span className="crm-customer-summary__label">Customer Ditemukan</span>
              <strong className="crm-customer-summary__value">{data?.total ?? 0}</strong>
              <div className="crm-customer-summary__note">Sesuai pencarian dan filter saat ini</div>
            </div>
          </div>
          <div className="crm-customer-summary__hint">
            <Users size={14} strokeWidth={2.1} />
            <span>Data pelanggan CRM-Sales</span>
          </div>
        </section>

        <section className="crm-customer-list-card" aria-label="Daftar customer">
          <div className="crm-customer-list-heading">
            <div>
              <h2 className="crm-customer-list-heading__title">Daftar Customer</h2>
              <p className="crm-customer-list-heading__subtitle">
                Informasi perusahaan, NPWP, dan status hubungan pelanggan.
              </p>
            </div>
            <span className="crm-customer-list-heading__meta">
              <Building2 size={13} />
              {data?.total ?? 0} Customer
            </span>
          </div>

          <div className="crm-customer-toolbar">
            <label className="crm-customer-search">
              <Search size={16} strokeWidth={2} aria-hidden="true" />
              <input
                aria-label="Cari customer"
                placeholder="Cari nama perusahaan atau kode customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </label>

            <label className="crm-customer-filter-wrap">
              <Filter size={14} aria-hidden="true" />
              <select
                className="crm-customer-filter"
                aria-label="Filter status customer"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as CustomerStatus | "");
                  setPage(1);
                }}
              >
                <option value="">Semua Status</option>
                {Object.entries(STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              className="crm-customer-new-button"
              style={{
                minHeight: 42,
                padding: "0 17px",
                fontSize: "0.75rem",
                fontWeight: 800,
                borderRadius: 11,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.45rem",
                whiteSpace: "nowrap",
              }}
              onClick={() => {
                setEditingCustomerId(null);
                setIsCreateModalOpen(true);
              }}
            >
              <Plus size={15} strokeWidth={2.4} />
              Customer Baru
            </Button>
          </div>

          {isLoading && <LoadingState />}

          {data && data.data.length === 0 && (
            <div className="crm-customer-empty">
              <EmptyState
                title="Belum Ada Customer Tercatat"
                subtitle="Customer yang Anda buat atau yang cocok dengan filter pencarian akan ditampilkan di sini."
              />
            </div>
          )}

          {data && data.data.length > 0 && (
            <>
              <div className="crm-customer-table-wrap">
                <table className="crm-customer-table">
                  <thead>
                    <tr>
                      <th style={{ width: "18%" }}>Kode Customer</th>
                      <th style={{ width: "38%" }}>Nama Perusahaan</th>
                      <th style={{ width: "20%" }}>NPWP</th>
                      <th style={{ width: "12%" }}>Status</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((customer) => (
                      <CustomerRow
                        key={customer.id}
                        customer={customer}
                        onEdit={() => setEditingCustomerId(customer.id)}
                      />
                    ))}
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
            </>
          )}
        </section>
      </main>

      {(editingCustomerId !== null || customerIdToEdit !== null) && (
        <CustomerEditModal
          key={editingCustomerId ?? customerIdToEdit}
          customerId={(editingCustomerId ?? customerIdToEdit)!}
          onClose={() => {
            setEditingCustomerId(null);
            if (customerIdToEdit !== null && !returningToQuotation.current) setSearchParams({}, { replace: true });
          }}
          onSaved={() => {
            void refetch();
            if (customerIdToEdit !== null) { returningToQuotation.current = true; navigate("/crm-sales/quotations", { replace: true }); }
          }}
        />
      )}
    </div>
  );
}

interface CustomerRowProps {
  customer: Customer;
  onEdit: () => void;
}

function CustomerRow({ customer, onEdit }: CustomerRowProps) {
  const setStatus = useSetCustomerStatus(customer.id);
  const deleteMutation = useDeleteCustomer();

  async function handleDelete() {
    if (
      !confirm(
        `Hapus customer '${customer.company_name}'? Tindakan ini tidak bisa dibatalkan.`,
      )
    ) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(customer.id);
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  return (
    <tr>
      <td>
        <span className="crm-customer-code">{customer.customer_code}</span>
      </td>

      <td>
        <div className="crm-customer-company">
          <span className="crm-customer-company__icon" aria-hidden="true">
            <Building2 size={16} strokeWidth={2} />
          </span>
          <div style={{ minWidth: 0 }}>
            <span className="crm-customer-company__name">
              {customer.company_name}
            </span>
            {customer.legal_name && (
              <span className="crm-customer-company__legal">{customer.legal_name}</span>
            )}
          </div>
        </div>
      </td>

      <td>
        <span className="crm-customer-npwp">{customer.npwp ?? "-"}</span>
      </td>

      <td>
        <span className={`crm-customer-status crm-customer-status--${customer.status}`}>
          <span className="crm-customer-status__dot" aria-hidden="true" />
          {STATUS_LABEL[customer.status]}
        </span>
      </td>

      <td>
        <div className="crm-customer-actions">
          {customer.status !== "active" && (
            <button
              type="button"
              className="crm-customer-action crm-customer-action--activate"
              aria-label={`Aktifkan ${customer.company_name}`}
              title="Aktifkan customer"
              disabled={setStatus.isPending}
              onClick={() => setStatus.mutate("active")}
            >
              <CheckCircle2 size={13} />
              Aktifkan
            </button>
          )}

          <button
            type="button"
            className="crm-customer-action crm-customer-action--edit"
            aria-label={`Edit ${customer.company_name}`}
            title="Edit customer"
            onClick={onEdit}
          >
            <Pencil size={13} />
            Edit
          </button>

          <button
            type="button"
            className="crm-customer-action crm-customer-action--delete"
            aria-label={`Hapus ${customer.company_name}`}
            title="Hapus customer"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
          >
            <Trash2 size={13} />
            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </td>
    </tr>
  );
}
