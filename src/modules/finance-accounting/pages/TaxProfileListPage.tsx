import { useState, type FormEvent } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import {
  useTaxCustomerProfileList, useSaveTaxCustomerProfile,
  useTaxVendorProfileList, useSaveTaxVendorProfile,
  useTaxTypeList,
} from "../api/useTax";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { CustomerPicker } from "@shared/components/CustomerPicker";
import { VendorPicker } from "@shared/components/VendorPicker";
import { extractErrorMessage } from "@shared/types/api";
import type { TaxCustomerProfile, TaxCustomerProfileFormValues, TaxVendorProfile, TaxVendorProfileFormValues } from "../types/taxProfile";

type Tab = "customer" | "vendor";

const EMPTY_CUSTOMER_FORM: TaxCustomerProfileFormValues = { customer_id: 0, customer_name: "", is_pkp: false };
const EMPTY_VENDOR_FORM: TaxVendorProfileFormValues = { vendor_id: 0, vendor_name: "", is_pkp: false };

/**
 * Registrasi status PKP (Pengusaha Kena Pajak) customer & vendor - NPWP +
 * centang PKP di sini adalah SYARAT AutoCreateTaxEFaktur (listener yang
 * auto-buat draft E-Faktur begitu AR Invoice posting) mau jalan untuk
 * customer tsb - lihat Modules/FinanceAccounting/app/Listeners/
 * AutoCreateTaxEFaktur.php. Tanpa profil PKP di sini, invoice tetap
 * kena PPN normal tapi E-Faktur harus diterbitkan manual satu-satu.
 */
export function TaxProfileListPage() {
  const [tab, setTab] = useState<Tab>("customer");

  return (
    <div>
      <PageHeader title="Profil Pajak (PKP)" subtitle="Daftarkan NPWP & status PKP customer/vendor - dipakai untuk E-Faktur otomatis dan default jenis pajak pembelian." />
      <div className="content-card">
        <div className="tabs">
          <button className={`tab${tab === "customer" ? " is-active" : ""}`} onClick={() => setTab("customer")}>Customer</button>
          <button className={`tab${tab === "vendor" ? " is-active" : ""}`} onClick={() => setTab("vendor")}>Vendor</button>
        </div>

        {tab === "customer" ? <CustomerProfileTab /> : <VendorProfileTab />}
      </div>
    </div>
  );
}

// ==================== Customer ====================

function CustomerProfileTab() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaxCustomerProfileFormValues>(EMPTY_CUSTOMER_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useTaxCustomerProfileList({ page, per_page: 25 });
  const saveMutation = useSaveTaxCustomerProfile();

  function openCreate() {
    setForm(EMPTY_CUSTOMER_FORM);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(profile: TaxCustomerProfile) {
    setForm({
      customer_id: profile.customer_id,
      customer_name: profile.customer_name,
      npwp: profile.npwp ?? "",
      npwp_name: profile.npwp_name ?? "",
      is_pkp: profile.is_pkp,
      is_wapu: profile.is_wapu,
      notes: profile.notes ?? "",
    });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.customer_id) { setError("Pilih customer dulu."); return; }
    try {
      await saveMutation.mutateAsync(form);
      setIsModalOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <>
      <div className="toolbar">
        <div style={{ flex: 1, fontSize: "0.8rem", color: "var(--grey)" }}>
          {data?.total ?? 0} customer terdaftar profil pajaknya
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Daftarkan Customer</Button>
      </div>

      {isLoading && <LoadingState />}
      {data && data.data.length === 0 && (
        <EmptyState title="Belum Ada Customer Terdaftar" subtitle="Daftarkan NPWP & status PKP customer supaya E-Faktur bisa terbit otomatis saat invoice-nya posting." />
      )}
      {data && data.data.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr><th>Customer</th><th>NPWP</th><th>Nama di NPWP</th><th>PKP</th><th>WAPU</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.customer_name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{p.npwp ?? "—"}</td>
                  <td>{p.npwp_name ?? "—"}</td>
                  <td>{p.is_pkp ? <span className="badge badge-active"><ShieldCheck size={11} style={{ marginRight: 3 }} />PKP</span> : "—"}</td>
                  <td>{p.is_wapu ? <span className="badge badge-inactive">WAPU</span> : "—"}</td>
                  <td>
                    <button onClick={() => openEdit(p)} style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}

      {isModalOpen && (
        <Modal title={form.customer_id ? "Edit Profil Pajak Customer" : "Daftarkan Customer"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <CustomerPicker
              label="Customer *"
              selectedCustomerId={form.customer_id || undefined}
              selectedCustomerName={form.customer_name || undefined}
              onSelect={(c) => {
                if (c.isLead) { setError("Yang bisa didaftarkan profil pajak cuma Customer, bukan Lead - konversi lead ini jadi Customer dulu."); return; }
                setError(null);
                setForm({ ...form, customer_id: c.id, customer_name: c.company_name });
              }}
              onClear={() => setForm({ ...form, customer_id: 0, customer_name: "" })}
            />
            <InputField label="NPWP" value={form.npwp ?? ""} onChange={(e) => setForm({ ...form, npwp: e.target.value })} placeholder="mis. 01.234.567.8-901.000" />
            <InputField label="Nama di NPWP" value={form.npwp_name ?? ""} onChange={(e) => setForm({ ...form, npwp_name: e.target.value })} placeholder="Kosongkan kalau sama dengan nama customer" />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--grey-dark)" }}>
              <input type="checkbox" checked={form.is_pkp ?? false} onChange={(e) => setForm({ ...form, is_pkp: e.target.checked })} />
              PKP (Pengusaha Kena Pajak) — wajib dicentang supaya E-Faktur terbit otomatis
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem", color: "var(--grey-dark)" }}>
              <input type="checkbox" checked={form.is_wapu ?? false} onChange={(e) => setForm({ ...form, is_wapu: e.target.checked })} />
              WAPU (Wajib Pungut) — instansi pemerintah/BUMN yang wajib pungut PPN sendiri
            </label>
            <InputField label="Catatan" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={saveMutation.isPending} style={{ width: "100%" }}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}

// ==================== Vendor ====================

function VendorProfileTab() {
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaxVendorProfileFormValues>(EMPTY_VENDOR_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useTaxVendorProfileList({ page, per_page: 25 });
  const { data: taxTypes } = useTaxTypeList({});
  const saveMutation = useSaveTaxVendorProfile();

  function openCreate() {
    setForm(EMPTY_VENDOR_FORM);
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(profile: TaxVendorProfile) {
    setForm({
      vendor_id: profile.vendor_id,
      vendor_name: profile.vendor_name,
      npwp: profile.npwp ?? "",
      npwp_name: profile.npwp_name ?? "",
      is_pkp: profile.is_pkp,
      default_tax_type_id: profile.default_tax_type_id ?? undefined,
      notes: profile.notes ?? "",
    });
    setError(null);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.vendor_id) { setError("Pilih vendor dulu."); return; }
    try {
      await saveMutation.mutateAsync(form);
      setIsModalOpen(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <>
      <div className="toolbar">
        <div style={{ flex: 1, fontSize: "0.8rem", color: "var(--grey)" }}>
          {data?.total ?? 0} vendor terdaftar profil pajaknya
        </div>
        <Button onClick={openCreate}><Plus size={15} /> Daftarkan Vendor</Button>
      </div>

      {isLoading && <LoadingState />}
      {data && data.data.length === 0 && (
        <EmptyState title="Belum Ada Vendor Terdaftar" subtitle="Daftarkan NPWP & status PKP vendor untuk pengelolaan PPN Masukan / pemotongan PPh pembelian." />
      )}
      {data && data.data.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr><th>Vendor</th><th>NPWP</th><th>Nama di NPWP</th><th>PKP</th><th>Default Jenis Pajak</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {data.data.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600 }}>{p.vendor_name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.82rem" }}>{p.npwp ?? "—"}</td>
                  <td>{p.npwp_name ?? "—"}</td>
                  <td>{p.is_pkp ? <span className="badge badge-active"><ShieldCheck size={11} style={{ marginRight: 3 }} />PKP</span> : "—"}</td>
                  <td>{p.default_tax_type ? `${p.default_tax_type.name} (${p.default_tax_type.rate}%)` : "—"}</td>
                  <td>
                    <button onClick={() => openEdit(p)} style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: "0 1.5rem" }}>
            <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
          </div>
        </>
      )}

      {isModalOpen && (
        <Modal title={form.vendor_id ? "Edit Profil Pajak Vendor" : "Daftarkan Vendor"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <VendorPicker
              label="Vendor *"
              selectedVendorId={form.vendor_id || undefined}
              selectedVendorName={form.vendor_name || undefined}
              onSelect={(v) => setForm({ ...form, vendor_id: v.id, vendor_name: v.vendor_name })}
              onClear={() => setForm({ ...form, vendor_id: 0, vendor_name: "" })}
            />
            <InputField label="NPWP" value={form.npwp ?? ""} onChange={(e) => setForm({ ...form, npwp: e.target.value })} placeholder="mis. 01.234.567.8-901.000" />
            <InputField label="Nama di NPWP" value={form.npwp_name ?? ""} onChange={(e) => setForm({ ...form, npwp_name: e.target.value })} placeholder="Kosongkan kalau sama dengan nama vendor" />
            <div style={{ marginBottom: "1rem" }}>
              <label className="input-label">Default Jenis Pajak (opsional)</label>
              <select className="input" value={form.default_tax_type_id ?? ""} onChange={(e) => setForm({ ...form, default_tax_type_id: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">— Tidak ada default —</option>
                {(taxTypes ?? []).map((t) => (
                  <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                ))}
              </select>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", marginBottom: "1rem", color: "var(--grey-dark)" }}>
              <input type="checkbox" checked={form.is_pkp ?? false} onChange={(e) => setForm({ ...form, is_pkp: e.target.checked })} />
              PKP (Pengusaha Kena Pajak)
            </label>
            <InputField label="Catatan" value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={saveMutation.isPending} style={{ width: "100%" }}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
