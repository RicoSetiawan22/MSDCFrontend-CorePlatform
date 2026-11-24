import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, BarChart3, FileDown } from "lucide-react";
import { useProfitCenterList, useCreateProfitCenter, useDownloadProfitCentersPdf } from "../api/useProfitCenters";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { ProfitCenterPicker } from "@shared/components/ui/ProfitCenterPicker";
import { extractErrorMessage } from "@shared/types/api";
import type { PcProfitCenterFormValues } from "../types/profitCenter";

const EMPTY_FORM: PcProfitCenterFormValues = { code: "", name: "" };

export function ProfitCenterListPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadProfitCentersPdf();
  const [form, setForm] = useState<PcProfitCenterFormValues>(EMPTY_FORM);
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: profitCenters, isLoading } = useProfitCenterList({ search: search || undefined });
  const createMutation = useCreateProfitCenter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createMutation.mutateAsync({
        ...form,
        parent_id: parentId ? Number(parentId) : undefined,
      });
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setParentId("");
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Profit Center" subtitle="Lini layanan perusahaan — Dedicated Server, Colocation, Cloud, dst." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Profit Center
            <span className="tab__count">{profitCenters?.length ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={16} />
            <input className="input" placeholder="Cari kode atau nama profit center..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Link to="/finance/profit-centers/comparison">
            <Button variant="secondary"><BarChart3 size={15} /> Bandingkan Laba</Button>
          </Link>
          <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
          <Button onClick={() => { setForm(EMPTY_FORM); setParentId(""); setIsModalOpen(true); }}>
            <Plus size={15} /> Profit Center Baru
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {profitCenters && profitCenters.length === 0 && (
          <EmptyState title="Belum Ada Profit Center Tercatat" subtitle="Daftarkan lini layanan (mis. Dedicated Server, Colocation, Cloud) untuk mulai lacak labanya." />
        )}

        {profitCenters && profitCenters.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Induk (Parent)</th>
                <th>Status</th>
                <th className="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {profitCenters.map((pc) => (
                <tr key={pc.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700, color: "#7c3aed" }}>{pc.code}</td>
                  <td style={{ fontWeight: 600 }}>{pc.name}</td>
                  <td>
                    {pc.parent ? (
                      <span style={{ fontSize: "0.8rem" }}>
                        <span style={{ fontFamily: "monospace", color: "#7c3aed", fontSize: "0.78rem" }}>{pc.parent.code}</span>
                        {" "}{pc.parent.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--grey)", fontSize: "0.8rem", fontStyle: "italic" }}>— (root)</span>
                    )}
                  </td>
                  <td><span className={`badge badge-${pc.is_active ? "active" : "inactive"}`}>{pc.is_active ? "Aktif" : "Nonaktif"}</span></td>
                  <td className="no-print">
                    <Link to={`/finance/profit-centers/${pc.id}/report`} style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
                      Lihat Laporan Laba →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <Modal title="📊 Profit Center Baru" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              <InputField label="Kode *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="mis. PC-COLO" />
              <InputField label="Nama *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Colocation" />
            </div>

            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Induk (Parent)</label></div>
              <ProfitCenterPicker
                value={parentId}
                onChange={setParentId}
                placeholder="Tanpa induk (root)..."
              />
              <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
                Opsional. Pilih profit center induk untuk membuat struktur hierarki lini layanan.
              </div>
            </div>

            {error && <div className="input-error">{error}</div>}

            <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
              {createMutation.isPending ? "Menyimpan..." : "💾 Simpan Profit Center"}
            </Button>
          </form>
        </Modal>
      )}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Profit Center"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}
    </div>
  );
}
