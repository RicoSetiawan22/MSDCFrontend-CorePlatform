import { useState, type FormEvent } from "react";
import { Plus, FileDown } from "lucide-react";
import { useTaxTypeList, useCreateTaxType, useDownloadTaxTypesPdf } from "../api/useTax";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import type { TaxCategory, TaxTypeFormValues } from "../types/taxType";

const CATEGORY_LABEL: Record<TaxCategory, string> = {
  ppn_output: "PPN Keluaran",
  ppn_input: "PPN Masukan",
  pph_withholding: "PPh Potong",
};

const EMPTY_FORM: TaxTypeFormValues = { code: "", name: "", category: "ppn_output", rate: 11 };

export function TaxTypeListPage() {
  const [category, setCategory] = useState<TaxCategory | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadTaxTypesPdf();
  const [form, setForm] = useState<TaxTypeFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: taxTypes, isLoading } = useTaxTypeList({ category: category || undefined });
  const createMutation = useCreateTaxType();

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
      <PageHeader title="Jenis Pajak" subtitle="Master PPN Keluaran, PPN Masukan, dan PPh Potong beserta tarifnya." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Jenis Pajak
            <span className="tab__count">{taxTypes?.length ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <select className="input" style={{ maxWidth: 180 }} value={category} onChange={(e) => setCategory(e.target.value as TaxCategory | "")}>
            <option value="">Semua Kategori</option>
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}>
            <Plus size={15} /> Jenis Pajak Baru
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {taxTypes && taxTypes.length === 0 && (
          <EmptyState title="Belum Ada Jenis Pajak" subtitle="Daftarkan PPN atau PPh yang berlaku untuk mulai memakainya di E-Faktur & Bukti Potong." />
        )}

        {taxTypes && taxTypes.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Kategori</th>
                <th style={{ textAlign: "right" }}>Tarif</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {taxTypes.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontFamily: "monospace" }}>{t.code}</td>
                  <td>{t.name}</td>
                  <td>{CATEGORY_LABEL[t.category]}</td>
                  <td style={{ textAlign: "right" }}>{t.rate}%</td>
                  <td><span className={`badge badge-${t.is_active ? "active" : "inactive"}`}>{t.is_active ? "Aktif" : "Nonaktif"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <Modal title="Jenis Pajak Baru" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <InputField label="Kode *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="mis. PPN11" />
            <InputField label="Nama *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. PPN 11%" />
            <div style={{ marginBottom: "1rem" }}>
              <label className="input-label">Kategori *</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TaxCategory })}>
                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <InputField label="Tarif (%) *" type="number" min={0} max={100} step={0.1} required value={form.rate} onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })} />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Modal>
      )}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Jenis Pajak"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}

    </div>
  );
}
