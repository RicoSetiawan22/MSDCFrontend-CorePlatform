import { useState, type FormEvent } from "react";
import { Plus, Send } from "lucide-react";
import { useTaxWithholdingList, useCreateTaxWithholding, useTaxTypeList, useRemitTaxWithholding } from "../api/useTax";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { FormInput } from "@shared/components/ui/FormKit";
import { SearchableSelect } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { TaxWithholdingCertificate, TaxWithholdingFormValues, WithholdingDirection } from "../types/taxWithholding";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const EMPTY_FORM: TaxWithholdingFormValues = {
  tax_type_id: 0,
  direction: "withheld_by_us",
  counterparty_name: "",
  period_month: new Date().getMonth() + 1,
  period_year: new Date().getFullYear(),
  gross_amount: 0,
};

export function TaxWithholdingListPage() {
  const [page, setPage] = useState(1);
  const [direction, setDirection] = useState<WithholdingDirection | "">("");
  const [unremittedOnly, setUnremittedOnly] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaxWithholdingFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useTaxWithholdingList({
    page,
    per_page: 25,
    direction: direction || undefined,
    unremitted_only: unremittedOnly || undefined,
  });
  const { data: taxTypes } = useTaxTypeList({ category: "pph_withholding" });
  const createMutation = useCreateTaxWithholding();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync(form);
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  const totalIssued = data?.data.filter((c) => c.status === "issued").reduce((s, c) => s + Number(c.withheld_amount), 0) ?? 0;
  const totalUnremitted = data?.data.filter((c) => c.status === "issued" && !c.remitted_date).reduce((s, c) => s + Number(c.withheld_amount), 0) ?? 0;

  const taxTypeOptions = (taxTypes ?? []).map((t) => ({
    value: String(t.id),
    label: `${t.code} — ${t.name}`,
    sublabel: `${t.rate}%`,
  }));

  return (
    <div>
      <PageHeader
        title="Bukti Potong PPh"
        subtitle="Pajak Vendor (kita potong) & Pajak Customer (dipotong customer) — 2 arah, 1 fitur."
      />

      <div className="content-card">
        {/* Toolbar */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Direction chips */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {(["", "withheld_by_us", "withheld_by_customer"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDirection(d as WithholdingDirection | ""); setPage(1); }}
                style={{
                  padding: "0.35rem 0.875rem", borderRadius: 20, cursor: "pointer",
                  border: `1px solid ${(direction || "") === d ? "var(--accent)" : "var(--border)"}`,
                  background: (direction || "") === d ? "var(--accent-light)" : "white",
                  color: (direction || "") === d ? "var(--accent)" : "var(--grey)",
                  fontSize: "0.78rem", fontWeight: (direction || "") === d ? 700 : 400,
                }}
              >
                {d === "" ? "Semua" : d === "withheld_by_us" ? "Pajak Vendor" : "Pajak Customer"}
              </button>
            ))}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.82rem", color: "var(--grey-dark)", cursor: "pointer" }}>
            <input type="checkbox" checked={unremittedOnly} onChange={(e) => { setUnremittedOnly(e.target.checked); setPage(1); }} />
            Belum disetor
          </label>

          <Button style={{ marginLeft: "auto" }} onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}>
            <Plus size={15} /> Terbitkan Bukti Potong
          </Button>
        </div>

        {/* Summary strip */}
        {data && data.data.length > 0 && (
          <div style={{ display: "flex", gap: "1.5rem", padding: "0.75rem 1.25rem", background: "var(--bg-subtle)", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Bukti Potong</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{data.total} sertifikat</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Dipotong</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace" }}>{formatCurrency(totalIssued)}</div>
            </div>
            <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: "1.5rem" }}>
              <div style={{ fontSize: "0.68rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Belum Disetor</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, fontFamily: "monospace", color: totalUnremitted > 0 ? "#b45309" : "var(--good)" }}>{formatCurrency(totalUnremitted)}</div>
            </div>
          </div>
        )}

        {isLoading && <LoadingState />}
        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Bukti Potong" subtitle="Terbitkan bukti potong untuk transaksi yang kena PPh." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Bukti Potong</th>
                  <th>Arah</th>
                  <th>Lawan Transaksi</th>
                  <th>Periode</th>
                  <th style={{ textAlign: "right" }}>Dipotong</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((cert) => (
                  <WithholdingRow key={cert.id} certificate={cert} />
                ))}
              </tbody>
            </table>
            <div style={{ padding: "0 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <CreateCertificateModal
          form={form}
          setForm={setForm}
          taxTypeOptions={taxTypeOptions}
          error={error}
          onSubmit={handleSubmit}
          createMutation={createMutation}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

interface CreateModalProps {
  form: TaxWithholdingFormValues;
  setForm: (f: TaxWithholdingFormValues) => void;
  taxTypeOptions: { value: string; label: string; sublabel: string }[];
  error: string | null;
  onSubmit: (e: FormEvent) => void;
  createMutation: ReturnType<typeof useCreateTaxWithholding>;
  onClose: () => void;
}

function CreateCertificateModal({ form, setForm, taxTypeOptions, error, onSubmit, createMutation, onClose }: CreateModalProps) {

  return (
    <Modal title="📄 Terbitkan Bukti Potong PPh" onClose={onClose} maxWidth={560}>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        <div style={{ background: "#fef3c7", color: "#92400e", padding: "0.75rem 0.875rem", borderRadius: 8, fontSize: "0.8rem" }}>
          {form.direction === "withheld_by_us"
            ? "📋 Pajak yang kita POTONG dari pembayaran ke vendor. Wajib disetor ke DJP."
            : "📋 Pajak yang dipotong oleh customer dari pembayaran mereka ke kita."}
        </div>

        {/* Direction */}
        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Arah *</label></div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["withheld_by_us", "withheld_by_customer"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm({ ...form, direction: d })}
                style={{
                  flex: 1, padding: "0.6rem", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${form.direction === d ? "var(--accent)" : "var(--border)"}`,
                  background: form.direction === d ? "var(--accent-light)" : "white",
                  color: form.direction === d ? "var(--accent)" : "var(--grey)",
                  fontSize: "0.82rem", fontWeight: form.direction === d ? 700 : 400,
                }}
              >
                {d === "withheld_by_us" ? "🏢 Pajak Vendor" : "👤 Pajak Customer"}
              </button>
            ))}
          </div>
        </div>

        {/* Tax Type */}
        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Jenis Pajak *</label></div>
          <SearchableSelect
            value={form.tax_type_id ? String(form.tax_type_id) : ""}
            onChange={(v) => setForm({ ...form, tax_type_id: Number(v) })}
            options={taxTypeOptions}
            placeholder="Pilih jenis PPh..."
          />
        </div>

        <FormInput
          label="Nama Lawan Transaksi *"
          required
          value={form.counterparty_name}
          onChange={(e) => setForm({ ...form, counterparty_name: e.target.value })}
          placeholder={form.direction === "withheld_by_us" ? "Nama vendor" : "Nama customer"}
        />

        <FormInput
          label="NPWP Lawan Transaksi"
          value={form.counterparty_npwp ?? ""}
          onChange={(e) => setForm({ ...form, counterparty_npwp: e.target.value })}
          placeholder="00.000.000.0-000.000"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Bulan *</label></div>
            <select
              className="input"
              value={form.period_month}
              onChange={(e) => setForm({ ...form, period_month: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px" }}
            >
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <FormInput
            label="Tahun *"
            type="number"
            required
            value={form.period_year}
            onChange={(e) => setForm({ ...form, period_year: Number(e.target.value) })}
            placeholder="2026"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <FormInput
            label="Jumlah Bruto (Rp) *"
            type="number" required min={0}
            value={form.gross_amount || ""}
            onChange={(e) => setForm({ ...form, gross_amount: Number(e.target.value) })}
            placeholder="0"
          />
          <FormInput
            label="Jumlah Dipotong (Rp)"
            type="number" min={0}
            value={form.withheld_amount ?? ""}
            onChange={(e) => setForm({ ...form, withheld_amount: Number(e.target.value) })}
            placeholder="Auto (dari tarif)"
            hint="Kosongkan = dihitung otomatis dari tarif jenis pajak"
          />
        </div>

        {form.direction === "withheld_by_us" && (
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Penarikan (Kas/Bank)</label></div>
            <AccountPicker
              value=""
              onChange={(v) => setForm({ ...form, ap_account_code: v })}
              placeholder="Pilih akun kas/bank..."
            />
            <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
              Posting jurnal DR Hutang Vendor / CR Hutang PPh saat diterbitkan.
            </div>
          </div>
        )}

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={createMutation.isPending} style={{ flex: 1 }}>
            {createMutation.isPending ? "Menyimpan..." : "📄 Terbitkan Bukti Potong"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}

function WithholdingRow({ certificate }: { certificate: TaxWithholdingCertificate }) {
  const [showRemit, setShowRemit] = useState(false);
  const [remittedDate, setRemittedDate] = useState("");
  const [withdrawalAccountCode, setWithdrawalAccountCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const remitMutation = useRemitTaxWithholding();

  const canRemit = certificate.direction === "withheld_by_us" && certificate.status === "issued" && !certificate.remitted_date;

  async function handleRemit() {
    setError(null);
    try {
      await remitMutation.mutateAsync({ id: certificate.id, remittedDate, withdrawalAccountCode });
      setShowRemit(false);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <>
      <tr>
        <td style={{ fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 700 }}>{certificate.certificate_number}</td>
        <td>
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: certificate.direction === "withheld_by_us" ? "#1d4ed8" : "#15803d" }}>
            {certificate.direction === "withheld_by_us" ? "🏢 Pajak Vendor" : "👤 Pajak Customer"}
          </span>
        </td>
        <td style={{ fontSize: "0.85rem" }}>{certificate.counterparty_name}</td>
        <td style={{ fontSize: "0.82rem" }}>{MONTH_NAMES[certificate.period_month - 1]} {certificate.period_year}</td>
        <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{formatCurrency(Number(certificate.withheld_amount))}</td>
        <td>
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <span className={`badge badge-${certificate.status === "issued" ? "active" : "prospect"}`}>
              {certificate.status === "issued" ? "Diterbitkan" : "Draft"}
            </span>
            {certificate.remitted_date && <span className="badge badge-active">Disetor</span>}
          </div>
        </td>
        <td>
          {canRemit && !showRemit && (
            <button onClick={() => setShowRemit(true)} style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
              <Send size={13} /> Setor
            </button>
          )}
        </td>
      </tr>
      {showRemit && (
        <tr>
          <td colSpan={7} style={{ background: "var(--accent-light)", padding: "0.85rem 1.5rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label className="input-label" style={{ marginBottom: "0.2rem" }}>Tanggal Setor</label>
                <input className="input" type="date" style={{ width: 160 }} value={remittedDate} onChange={(e) => setRemittedDate(e.target.value)} />
              </div>
              <div>
                <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Penarikan</label></div>
                <AccountPicker
                  value={withdrawalAccountCode}
                  onChange={setWithdrawalAccountCode}
                  placeholder="Kode akun kas/bank..."
                />
              </div>
              <Button onClick={handleRemit} disabled={remitMutation.isPending}>
                {remitMutation.isPending ? "Memproses..." : "Konfirmasi Setor"}
              </Button>
              <Button variant="secondary" onClick={() => setShowRemit(false)}>Batal</Button>
            </div>
            {error && <div className="input-error" style={{ marginTop: "0.5rem" }}>{error}</div>}
          </td>
        </tr>
      )}
    </>
  );
}
