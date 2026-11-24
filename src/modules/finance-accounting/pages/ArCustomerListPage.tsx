import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, ShieldAlert, FileDown } from "lucide-react";
import { useArCustomerProfileList, useSaveArCustomerProfile, useDownloadArCustomersPdf } from "../api/useArCustomerProfiles";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { CustomerPicker } from "@shared/components/CustomerPicker";
import type { ArCustomerProfileFormValues } from "../types/arCustomerProfile";

const EMPTY_FORM: ArCustomerProfileFormValues = { customer_id: 0, customer_name: "", credit_limit: 0, is_credit_hold: false };

export function ArCustomerListPage() {
  const [page, setPage] = useState(1);
  const [creditHoldOnly, setCreditHoldOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadArCustomersPdf();
  const [form, setForm] = useState<ArCustomerProfileFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useArCustomerProfileList({ page, per_page: 25, credit_hold_only: creditHoldOnly || undefined });
  const saveMutation = useSaveArCustomerProfile();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await saveMutation.mutateAsync(form);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Credit Limit Customer" subtitle="Batas kredit & status credit hold per customer." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Profil Kredit
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--grey-dark)" }}>
            <input type="checkbox" checked={creditHoldOnly} onChange={(e) => { setCreditHoldOnly(e.target.checked); setPage(1); }} />
            Credit Hold saja
          </label>
          <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}>
            <Plus size={15} /> Set Credit Limit
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Profil Kredit" subtitle="Set credit limit untuk customer supaya sistem bisa memantau batas piutangnya." />
        )}

        {data && data.data.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Kode</th>
                <th style={{ textAlign: "right" }}>Credit Limit</th>
                <th>Status</th>
                <th className="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((profile) => (
                <tr key={profile.id}>
                  <td style={{ fontWeight: 600 }}>{profile.customer_name}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--grey)" }}>{profile.customer_code ?? "—"}</td>
                  <td style={{ textAlign: "right" }}>{formatCurrency(profile.credit_limit)}</td>
                  <td>
                    {profile.is_credit_hold ? (
                      <span className="badge badge-churned" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <ShieldAlert size={12} /> Credit Hold
                      </span>
                    ) : (
                      <span className="badge badge-active">Normal</span>
                    )}
                  </td>
                  <td className="no-print">
                    <Link to={`/finance/ar/customers/${profile.customer_id}`} style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
                      Lihat Outstanding
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <Modal title="Set Credit Limit" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="input-label" style={{ marginBottom: "0.25rem" }}>Customer *</label>
              <CustomerPicker
                label="Pilih Customer"
                selectedCustomerId={form.customer_id || undefined}
                selectedCustomerName={form.customer_name}
                onSelect={(customer) => setForm({ ...form, customer_id: customer.id, customer_name: customer.company_name })}
                onClear={() => setForm({ ...form, customer_id: 0, customer_name: "" })}
              />
            </div>
            <InputField label="Nama Customer *" required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
            <InputField label="Kode Customer" value={form.customer_code ?? ""} onChange={(e) => setForm({ ...form, customer_code: e.target.value })} />
            <InputField label="Credit Limit (Rp) *" type="number" min={0} required value={form.credit_limit || ""} onChange={(e) => setForm({ ...form, credit_limit: Number(e.target.value) })} />

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem", color: "var(--grey-dark)" }}>
              <input type="checkbox" checked={form.is_credit_hold ?? false} onChange={(e) => setForm({ ...form, is_credit_hold: e.target.checked })} />
              Tahan kredit (Credit Hold) — customer ini TIDAK boleh dapat invoice/PO baru
            </label>

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={saveMutation.isPending} style={{ width: "100%" }}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Modal>
      )}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Credit Limit Customer"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}

    </div>
  );
}
