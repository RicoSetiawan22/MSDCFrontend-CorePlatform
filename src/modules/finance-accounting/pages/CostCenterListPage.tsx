import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, FileDown, Pencil, Trash2 } from "lucide-react";
import { useCostCenterList, useCreateCostCenter, useUpdateCostCenter, useDeleteCostCenter, useDownloadCostCentersPdf } from "../api/useCostCenters";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { CostCenterPicker } from "@shared/components/ui/CostCenterPicker";
import { extractErrorMessage } from "@shared/types/api";
import type { CostCenter, CostCenterFormValues } from "../types/costCenter";

const EMPTY_FORM: CostCenterFormValues = { code: "", name: "" };

export function CostCenterListPage() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const downloadPdfMutation = useDownloadCostCentersPdf();
  const [form, setForm] = useState<CostCenterFormValues>(EMPTY_FORM);
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: costCenters, isLoading } = useCostCenterList({ search: search || undefined });
  const createMutation = useCreateCostCenter();
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();

  function openCreate() {
    setEditingCostCenter(null);
    setForm(EMPTY_FORM);
    setParentId("");
    setError(null);
    setIsModalOpen(true);
  }

  function openEdit(cc: CostCenter) {
    setEditingCostCenter(cc);
    setForm({ code: cc.code, name: cc.name, type: cc.type, notes: cc.notes ?? undefined });
    setParentId(cc.parent_id ? String(cc.parent_id) : "");
    setError(null);
    setIsModalOpen(true);
  }

  async function handleDelete(cc: CostCenter) {
    if (!confirm(`Hapus cost center "${cc.code} — ${cc.name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(cc.id);
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingCostCenter) {
        await updateMutation.mutateAsync({
          id: editingCostCenter.id,
          values: { name: form.name, type: form.type, parent_id: parentId ? Number(parentId) : null, notes: form.notes },
        });
      } else {
        await createMutation.mutateAsync({
          ...form,
          parent_id: parentId ? Number(parentId) : null,
        });
      }
      setIsModalOpen(false);
      setForm(EMPTY_FORM);
      setParentId("");
      setEditingCostCenter(null);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Cost Center" subtitle="Kelola struktur pusat biaya untuk alokasi anggaran & laporan." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Cost Center
            <span className="tab__count">{costCenters?.length ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={16} />
            <input className="input" placeholder="Cari kode atau nama cost center..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
          <Button onClick={openCreate}>
            <Plus size={15} /> Cost Center Baru
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {costCenters && costCenters.length === 0 && (
          <EmptyState title="Belum Ada Cost Center Tercatat" subtitle="Cost center yang Anda buat akan ditampilkan di sini." />
        )}

        {costCenters && costCenters.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>Type</th>
                <th>Induk (Parent)</th>
                <th>Status</th>
                <th className="no-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {costCenters.map((cc) => (
                <tr key={cc.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 700 }}>{cc.code}</td>
                  <td style={{ fontWeight: 600 }}>{cc.name}</td>
                  <td>
                    <span className="badge badge-prospect" style={{ fontSize: "0.72rem" }}>
                      {cc.type === "location" ? "📍 Lokasi" : cc.type === "functional" ? "⚙️ Fungsional" : "📦 Lain"}
                    </span>
                  </td>
                  <td>
                    {cc.parent ? (
                      <span style={{ fontSize: "0.8rem" }}>
                        <span style={{ fontFamily: "monospace", color: "var(--accent)", fontSize: "0.78rem" }}>{cc.parent.code}</span>
                        {" "}{cc.parent.name}
                      </span>
                    ) : (
                      <span style={{ color: "var(--grey)", fontSize: "0.8rem", fontStyle: "italic" }}>— (root)</span>
                    )}
                  </td>
                  <td><span className={`badge badge-${cc.is_active ? "active" : "inactive"}`}>{cc.is_active ? "Aktif" : "Nonaktif"}</span></td>
                  <td className="no-print">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                      <Link to={`/finance/cost-centers/${cc.id}/report`} style={{ color: "var(--accent)", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}>
                        Lihat Laporan Biaya →
                      </Link>
                      <button type="button" onClick={() => openEdit(cc)} title="Edit"
                        style={{ border: "1px solid var(--border)", background: "none", borderRadius: 6, color: "var(--accent)", cursor: "pointer", padding: "0.3rem 0.5rem", display: "flex", alignItems: "center" }}>
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => handleDelete(cc)} disabled={deleteMutation.isPending} title="Hapus"
                        style={{ border: "1px solid var(--border)", background: "none", borderRadius: 6, color: "var(--bad)", cursor: "pointer", padding: "0.3rem 0.5rem", display: "flex", alignItems: "center" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <Modal title={editingCostCenter ? `✏️ Edit Cost Center — ${editingCostCenter.code}` : "🏢 Cost Center Baru"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              {editingCostCenter ? (
                <div>
                  <label className="input-label">Kode</label>
                  <input className="input" value={form.code} disabled style={{ width: "100%", opacity: 0.6 }} />
                  <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>Kode permanen, tidak bisa diubah setelah dibuat.</div>
                </div>
              ) : (
                <InputField label="Kode *" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="mis. CC-SBY-01" />
              )}
              <InputField label="Nama *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="mis. Surabaya DC" />
            </div>

            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Type</label></div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {(["location", "functional", "other"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    style={{
                      flex: 1, padding: "0.5rem", borderRadius: 7, cursor: "pointer",
                      border: `1px solid ${form.type === t ? "var(--accent)" : "var(--border)"}`,
                      background: form.type === t ? "var(--accent-light)" : "white",
                      color: form.type === t ? "var(--accent)" : "var(--grey)",
                      fontSize: "0.8rem", fontWeight: form.type === t ? 700 : 400,
                    }}
                  >
                    {t === "location" ? "📍 Lokasi" : t === "functional" ? "⚙️ Fungsional" : "📦 Lain"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Induk (Parent)</label></div>
              <CostCenterPicker
                value={parentId}
                onChange={setParentId}
                placeholder="Tanpa induk (root)..."
              />
              <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
                Opsional. Pilih cost center induk untuk membuat struktur hierarki (mis. Surabaya DC → Network / Facility).
              </div>
            </div>

            {error && <div className="input-error">{error}</div>}

            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} style={{ width: "100%" }}>
              {createMutation.isPending || updateMutation.isPending ? "Menyimpan..." : "💾 Simpan Cost Center"}
            </Button>
          </form>
        </Modal>
      )}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Cost Center"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}
    </div>
  );
}
