import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, FileDown } from "lucide-react";
import { useAccountList, useCreateAccount, useDownloadAccountsPdf } from "../api/useAccounts";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { extractErrorMessage } from "@shared/types/api";
import type { AccountFormValues, AccountType } from "../types/account";

const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  asset: "Aset",
  liability: "Liabilitas",
  equity: "Ekuitas",
  revenue: "Pendapatan",
  expense: "Beban",
};

const EMPTY_FORM: AccountFormValues = { account_code: "", account_name: "", account_type: "asset" };

export function AccountListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadAccountsPdf();
  const [form, setForm] = useState<AccountFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useAccountList({ page, per_page: 10, search: search || undefined, account_type: typeFilter || undefined });
  const createMutation = useCreateAccount();

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
      <PageHeader title="Chart of Accounts" subtitle="Kelola struktur akun untuk pencatatan General Ledger." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Akun
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={16} />
            <input className="input" placeholder="Cari kode atau nama akun..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input" style={{ maxWidth: 180 }} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as AccountType | ""); setPage(1); }}>
            <option value="">Semua Tipe</option>
            {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
          <Button onClick={() => setIsModalOpen(true)}><Plus size={15} /> Akun Baru</Button>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Akun Tercatat" subtitle="Akun yang Anda buat atau yang cocok dengan filter pencarian akan ditampilkan di sini." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Akun</th>
                  <th>Tipe</th>
                  <th>Saldo Normal</th>
                  <th>Status</th>
                  <th className="no-print">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((account) => (
                  <tr key={account.id}>
                    <td style={{ fontFamily: "monospace" }}>{account.account_code}</td>
                    <td>{account.account_name}</td>
                    <td>{ACCOUNT_TYPE_LABEL[account.account_type]}</td>
                    <td style={{ textTransform: "capitalize" }}>{account.normal_balance}</td>
                    <td><span className={`badge badge-${account.is_active ? "active" : "inactive"}`}>{account.is_active ? "Aktif" : "Nonaktif"}</span></td>
                    <td className="no-print">
                      <Link to={`/finance/gl/ledger/${account.id}`} style={{ color: "var(--accent)", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}>
                        Lihat Ledger
                      </Link>
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
        <Modal title="Akun Baru" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <InputField label="Kode Akun *" required value={form.account_code} onChange={(e) => setForm({ ...form, account_code: e.target.value })} placeholder="mis. 111001" />
            <InputField label="Nama Akun *" required value={form.account_name} onChange={(e) => setForm({ ...form, account_name: e.target.value })} />
            <div style={{ marginBottom: "1rem" }}>
              <label className="input-label">Tipe Akun *</label>
              <select className="input" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value as AccountType })}>
                {Object.entries(ACCOUNT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <InputField label="Sub-Grup" value={form.account_subgroup ?? ""} onChange={(e) => setForm({ ...form, account_subgroup: e.target.value })} placeholder="mis. Aset Lancar" />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan Akun"}
            </Button>
          </form>
        </Modal>
      )}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Chart of Accounts"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}

    </div>
  );
}
