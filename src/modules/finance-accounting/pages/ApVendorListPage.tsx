import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, ShieldAlert, FileDown } from "lucide-react";
import { useApVendorProfileList, useSaveApVendorProfile, useDownloadApVendorsPdf } from "../api/useApVendorProfiles";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import { VendorPicker } from "@shared/components/VendorPicker";
import type { ApVendorProfileFormValues } from "../types/apVendorProfile";

const EMPTY_FORM: ApVendorProfileFormValues = { vendor_id: 0, vendor_name: "", default_payment_term_days: 30, is_hold: false };

export function ApVendorListPage() {
  const [page, setPage] = useState(1);
  const [holdOnly, setHoldOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadApVendorsPdf();
  const [form, setForm] = useState<ApVendorProfileFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useApVendorProfileList({ page, per_page: 25, hold_only: holdOnly || undefined });
  const saveMutation = useSaveApVendorProfile();

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
      <PageHeader title="Payment Term Vendor" subtitle="Jangka waktu bayar default & status hold per vendor." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Vendor
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--grey-dark)" }}>
            <input type="checkbox" checked={holdOnly} onChange={(e) => { setHoldOnly(e.target.checked); setPage(1); }} />
            Hold saja
          </label>
          <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}>
            <Plus size={15} /> Set Payment Term
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Profil Vendor" subtitle="Set payment term untuk vendor supaya jatuh tempo bill terhitung otomatis." />
        )}

        {data && data.data.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Kode</th>
                <th>Payment Term</th>
                <th>Status</th>
                <th className="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((profile) => (
                <tr key={profile.id}>
                  <td style={{ fontWeight: 600 }}>{profile.vendor_name}</td>
                  <td style={{ fontSize: "0.8rem", color: "var(--grey)" }}>{profile.vendor_code ?? "—"}</td>
                  <td>Net {profile.default_payment_term_days} hari</td>
                  <td>
                    {profile.is_hold ? (
                      <span className="badge badge-churned" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                        <ShieldAlert size={12} /> Hold
                      </span>
                    ) : (
                      <span className="badge badge-active">Normal</span>
                    )}
                  </td>
                  <td className="no-print">
                    <Link to={`/finance/ap/vendors/${profile.vendor_id}`} style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
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
        <Modal title="Set Payment Term Vendor" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="input-label" style={{ marginBottom: "0.25rem" }}>Vendor *</label>
              <VendorPicker
                label="Pilih Vendor"
                selectedVendorId={form.vendor_id || undefined}
                selectedVendorName={form.vendor_name}
                onSelect={(vendor) => setForm({ ...form, vendor_id: vendor.id, vendor_name: vendor.vendor_name })}
                onClear={() => setForm({ ...form, vendor_id: 0, vendor_name: "" })}
              />
            </div>
            <InputField label="Nama Vendor *" required value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} />
            <InputField label="Kode Vendor" value={form.vendor_code ?? ""} onChange={(e) => setForm({ ...form, vendor_code: e.target.value })} />
            <InputField label="Payment Term (hari) *" type="number" min={0} required value={form.default_payment_term_days ?? 30} onChange={(e) => setForm({ ...form, default_payment_term_days: Number(e.target.value) })} placeholder="mis. 30 untuk Net 30" />

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem", color: "var(--grey-dark)" }}>
              <input type="checkbox" checked={form.is_hold ?? false} onChange={(e) => setForm({ ...form, is_hold: e.target.checked })} />
              Tahan vendor ini (Hold) — bill baru TIDAK bisa dibuat kecuali di-override
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
          title="Cetak PDF — Payment Term Vendor"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}

    </div>
  );
}
