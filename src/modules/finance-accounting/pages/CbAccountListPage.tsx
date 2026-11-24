import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Landmark, Wallet as WalletIcon, FileDown } from "lucide-react";
import { useCbAccountList, useCreateCbAccount, useDownloadCbAccountsPdf } from "../api/useCbAccounts";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import type { CbAccountFormValues, CbAccountType } from "../types/cbAccount";

const EMPTY_FORM: CbAccountFormValues = { account_id: 0, account_type: "bank" };

/**
 * Kartu saldo besar (BUKAN tabel) - sengaja meniru tampilan "BCA - Saldo
 * Rp2.500.000.000" dari kebutuhan aslinya. current_balance DIHITUNG
 * LANGSUNG dari GL tiap kali halaman ini dibuka (bukan angka tersimpan).
 */
export function CbAccountListPage() {
  const [typeFilter, setTypeFilter] = useState<CbAccountType | "">("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadCbAccountsPdf();
  const [form, setForm] = useState<CbAccountFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const { data: accounts, isLoading } = useCbAccountList({ account_type: typeFilter || undefined });
  const createMutation = useCreateCbAccount();

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

  const totalBalance = (accounts ?? []).reduce((sum, a) => sum + Number(a.current_balance ?? 0), 0);

  return (
    <div>
      <PageHeader title="Kas & Rekening Bank" subtitle="Semua mutasi dicatat - saldo dihitung langsung dari General Ledger." />

      <div style={{ padding: "0 2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "var(--grey)" }}>Total Saldo Kas & Bank</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 700 }}>{formatCurrency(totalBalance)}</div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <select className="input" style={{ maxWidth: 150 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as CbAccountType | "")}>
              <option value="">Semua Tipe</option>
              <option value="cash">Kas</option>
              <option value="bank">Bank</option>
            </select>
            <Button variant="secondary" className="no-print" onClick={() => setIsPrintModalOpen(true)}><FileDown size={15} /> Cetak PDF</Button>
            <Button onClick={() => { setForm(EMPTY_FORM); setIsModalOpen(true); }}><Plus size={15} /> Daftarkan Akun</Button>
          </div>
        </div>

        {isLoading && <LoadingState />}

        {accounts && accounts.length === 0 && (
          <div className="content-card" style={{ margin: 0 }}>
            <EmptyState title="Belum Ada Akun Kas/Bank Terdaftar" subtitle="Daftarkan akun COA bertipe aset sebagai akun kas/bank untuk mulai mencatat mutasi." />
          </div>
        )}

        {accounts && accounts.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.1rem", paddingBottom: "2rem" }}>
            {accounts.map((acc) => (
              <Link key={acc.id} to={`/finance/cb/accounts/${acc.account.id}`} className="card" style={{ padding: "1.4rem", textDecoration: "none", color: "inherit", display: "block" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: acc.account_type === "bank" ? "var(--accent-light)" : "#fdf3e3", display: "flex", alignItems: "center", justifyContent: "center", color: acc.account_type === "bank" ? "var(--accent)" : "var(--msdc-yellow)" }}>
                    {acc.account_type === "bank" ? <Landmark size={18} /> : <WalletIcon size={18} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{acc.bank_name ?? acc.account.account_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>{acc.bank_account_number ?? acc.account.account_code}</div>
                  </div>
                  {!acc.is_active && <span className="badge badge-inactive" style={{ marginLeft: "auto" }}>Nonaktif</span>}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>Saldo</div>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: acc.current_balance < 0 ? "var(--bad)" : "inherit" }}>
                  {formatCurrency(acc.current_balance)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <Modal title="Daftarkan Akun Kas/Bank" onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.875rem" }}>
              <label className="input-label" style={{ marginBottom: "0.25rem" }}>Akun COA (Kas/Bank) *</label>
              <AccountPicker
                value={String(form.account_id || "")}
                onChange={(v) => setForm({ ...form, account_id: Number(v) })}
                accountType="asset"
                placeholder="Pilih akun asset..."
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label className="input-label">Tipe *</label>
              <select className="input" value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value as CbAccountType })}>
                <option value="cash">Kas</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            {form.account_type === "bank" && (
              <>
                <InputField label="Nama Bank" value={form.bank_name ?? ""} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} placeholder="mis. BCA" />
                <InputField label="No. Rekening" value={form.bank_account_number ?? ""} onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })} />
                <InputField label="Atas Nama" value={form.bank_account_holder ?? ""} onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })} />
              </>
            )}
            <InputField label="Saldo Awal" type="number" value={form.opening_balance ?? ""} onChange={(e) => setForm({ ...form, opening_balance: Number(e.target.value) })} />

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <Button type="submit" disabled={createMutation.isPending} style={{ width: "100%" }}>
              {createMutation.isPending ? "Menyimpan..." : "Simpan"}
            </Button>
          </form>
        </Modal>
      )}
      {isPrintModalOpen && (
        <LetterheadPdfModal
          title="Cetak PDF — Kas & Rekening Bank"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(organizationId) => downloadPdfMutation.mutateAsync(organizationId)}
        />
      )}

    </div>
  );
}
