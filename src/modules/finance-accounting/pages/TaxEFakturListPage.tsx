import { useState, type FormEvent } from "react";
import { Plus, Ban } from "lucide-react";
import { useTaxEFakturList, useCreateTaxEFaktur, useCancelTaxEFaktur } from "../api/useTax";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { EFakturStatus, TaxEFaktur, TaxEFakturFormValues } from "../types/taxEFaktur";

const STATUS_LABEL: Record<EFakturStatus, string> = { draft: "Draft", issued: "Diterbitkan", cancelled: "Dibatalkan" };

const EMPTY_FORM: TaxEFakturFormValues = { invoice_id: 0 };

export function TaxEFakturListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<EFakturStatus | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<TaxEFakturFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useTaxEFakturList({ page, per_page: 25, status: status || undefined });
  const createMutation = useCreateTaxEFaktur();

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

  return (
    <div>
      <PageHeader title="E-Faktur" subtitle="Pajak Customer — faktur pajak PPN atas invoice yang diterbitkan ke customer." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua E-Faktur
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <select className="input" style={{ maxWidth: 160 }} value={status} onChange={(e) => { setStatus(e.target.value as EFakturStatus | ""); setPage(1); }}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button style={{ marginLeft: "auto" }} onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}>
            <Plus size={15} /> Terbitkan E-Faktur
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada E-Faktur" subtitle="Terbitkan E-Faktur untuk invoice AR yang sudah posted." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Faktur</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th style={{ textAlign: "right" }}>DPP</th>
                  <th style={{ textAlign: "right" }}>PPN</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((ef) => (
                  <EFakturRow key={ef.id} eFaktur={ef} />
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
        <Modal title="Terbitkan E-Faktur" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <InputField label="Invoice ID (AR) *" type="number" required value={form.invoice_id || ""} onChange={(e) => setForm({ ...form, invoice_id: Number(e.target.value) })} placeholder="ID invoice dari AR Invoice" />
            <InputField label="Nomor Faktur" value={form.nomor_faktur ?? ""} onChange={(e) => setForm({ ...form, nomor_faktur: e.target.value })} placeholder="Kosongkan kalau masih draft" />
            <InputField label="Tanggal Faktur" type="date" value={form.tanggal_faktur ?? ""} onChange={(e) => setForm({ ...form, tanggal_faktur: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
              <InputField label="DPP (Rp)" type="number" min={0} value={form.dpp ?? ""} onChange={(e) => setForm({ ...form, dpp: Number(e.target.value) })} placeholder="Kosongkan = ambil dari invoice" />
              <InputField label="PPN (Rp)" type="number" min={0} value={form.ppn_amount ?? ""} onChange={(e) => setForm({ ...form, ppn_amount: Number(e.target.value) })} placeholder="Kosongkan = ambil dari invoice" />
            </div>
            <InputField label="NPWP Customer" value={form.customer_npwp_snapshot ?? ""} onChange={(e) => setForm({ ...form, customer_npwp_snapshot: e.target.value })} />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function EFakturRow({ eFaktur }: { eFaktur: TaxEFaktur }) {
  const cancelMutation = useCancelTaxEFaktur();

  return (
    <tr>
      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{eFaktur.nomor_faktur ?? "—"}</td>
      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{eFaktur.invoice?.invoice_number ?? "—"}</td>
      <td>{eFaktur.invoice?.customer_name ?? "—"}</td>
      <td style={{ textAlign: "right" }}>{formatCurrency(eFaktur.dpp)}</td>
      <td style={{ textAlign: "right" }}>{formatCurrency(eFaktur.ppn_amount)}</td>
      <td><span className={`badge badge-${eFaktur.status === "issued" ? "active" : eFaktur.status === "cancelled" ? "churned" : "prospect"}`}>{STATUS_LABEL[eFaktur.status]}</span></td>
      <td>
        {eFaktur.status === "issued" && (
          <button
            onClick={() => { if (confirm(`Batalkan E-Faktur ${eFaktur.nomor_faktur}?`)) cancelMutation.mutate(eFaktur.id); }}
            disabled={cancelMutation.isPending}
            style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}
          >
            <Ban size={13} /> Batalkan
          </button>
        )}
      </td>
    </tr>
  );
}
