import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useBudgetList, useSaveBudget, useDeleteBudget } from "../api/useBudgets";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { DepartmentPicker } from "@shared/components/ui/DepartmentPicker";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import type { BgBudgetFormValues } from "../types/budget";

const CURRENT_YEAR = new Date().getFullYear();
const EMPTY_FORM: BgBudgetFormValues = { department_id: 0, account_id: 0, fiscal_year: CURRENT_YEAR, amount: 0 };

export function BudgetListPage() {
  const [page, setPage] = useState(1);
  const [fiscalYear, setFiscalYear] = useState<number | "">(CURRENT_YEAR);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<BgBudgetFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useBudgetList({ page, per_page: 25, fiscal_year: fiscalYear || undefined });
  const saveMutation = useSaveBudget();
  const deleteMutation = useDeleteBudget();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await saveMutation.mutateAsync(form);
      setIsModalOpen(false);
      setForm({ ...EMPTY_FORM, fiscal_year: (fiscalYear as number) || CURRENT_YEAR });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      <PageHeader title="Budget per Departemen" subtitle="Setiap departemen punya budget - dikelola di sini per akun & tahun anggaran." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Budget
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <input className="input" style={{ maxWidth: 160 }} type="number" value={fiscalYear} onChange={(e) => { setFiscalYear(e.target.value ? Number(e.target.value) : ""); setPage(1); }} placeholder="Tahun Anggaran" />
          <Button style={{ marginLeft: "auto" }} onClick={() => { setForm({ ...EMPTY_FORM, fiscal_year: (fiscalYear as number) || CURRENT_YEAR }); setIsModalOpen(true); }}>
            <Plus size={15} /> Set Budget
          </Button>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Budget Diset" subtitle="Set budget per departemen & akun untuk mulai memantau Budget vs Actual." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Departemen</th>
                  <th>Akun</th>
                  <th>Tahun</th>
                  <th>Kategori</th>
                  <th style={{ textAlign: "right" }}>Jumlah Budget</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600 }}>{b.department.name}</td>
                    <td style={{ fontSize: "0.85rem" }}>{b.account.account_code} — {b.account.account_name}</td>
                    <td>{b.fiscal_year}</td>
                    <td style={{ fontSize: "0.85rem", color: "var(--grey)" }}>{b.category ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>{formatCurrency(b.amount)}</td>
                    <td>
                      <button
                        onClick={() => { if (confirm(`Hapus budget ${b.department.name} - ${b.account.account_name}?`)) deleteMutation.mutate(b.id); }}
                        style={{ border: "none", background: "none", color: "var(--bad)", cursor: "pointer", display: "flex" }}
                      >
                        <Trash2 size={15} />
                      </button>
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
      </div>

      {isModalOpen && (
        <Modal title="Set Budget" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: "0.78rem", color: "var(--grey)", marginBottom: "1rem" }}>
              Kombinasi Departemen + Akun + Tahun yang SAMA akan meng-update budget yang sudah ada, bukan bikin baris baru.
            </p>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="input-label" style={{ marginBottom: "0.25rem" }}>Departemen *</label>
              <DepartmentPicker value={String(form.department_id || "")} onChange={(v) => setForm({ ...form, department_id: Number(v) })} />
            </div>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="input-label" style={{ marginBottom: "0.25rem" }}>Akun COA *</label>
              <AccountPicker value={String(form.account_id || "")} onChange={(v) => setForm({ ...form, account_id: Number(v) })} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 1rem" }}>
              <InputField label="Tahun Anggaran *" type="number" required value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: Number(e.target.value) })} />
              <InputField label="Jumlah Budget (Rp) *" type="number" required min={0} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <InputField label="Kategori" value={form.category ?? ""} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="mis. Operasional, Capex" />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={saveMutation.isPending} style={{ width: "100%" }}>
              {saveMutation.isPending ? "Menyimpan..." : "Simpan Budget"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
