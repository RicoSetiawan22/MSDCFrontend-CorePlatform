import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useCbAccountMutations, useCbPendingReconciliation, useReconcileCbAccount } from "../api/useCbAccounts";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";

type Tab = "mutations" | "reconciliation";

export function CbAccountDetailPage() {
  const params = useParams<{ accountId: string }>();
  const accountId = params.accountId ? Number(params.accountId) : undefined;
  const [tab, setTab] = useState<Tab>("mutations");

  const { data: mutationsData, isLoading: isLoadingMutations } = useCbAccountMutations(accountId);

  return (
    <div>
      <PageHeader
        title={mutationsData ? `${mutationsData.account.account_code} — ${mutationsData.account.account_name}` : "Detail Akun"}
        subtitle="Riwayat mutasi & rekonsiliasi bank akun ini."
      />

      <div style={{ padding: "0 2rem 1rem" }}>
        <Link to="/finance/cb/accounts" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none" }}>← Kembali ke Kas & Rekening Bank</Link>
      </div>

      {mutationsData && (
        <div style={{ padding: "0 2rem 1.25rem" }}>
          <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>Saldo Saat Ini</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{formatCurrency(mutationsData.ending_balance)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="content-card" style={{ margin: "0 2rem 2rem" }}>
        <div className="tabs">
          <button className={`tab${tab === "mutations" ? " is-active" : ""}`} onClick={() => setTab("mutations")}>Mutasi</button>
          <button className={`tab${tab === "reconciliation" ? " is-active" : ""}`} onClick={() => setTab("reconciliation")}>Rekonsiliasi Bank</button>
        </div>

        {tab === "mutations" && (
          <MutationsTab isLoading={isLoadingMutations} mutations={mutationsData?.mutations ?? []} />
        )}
        {tab === "reconciliation" && accountId && (
          <ReconciliationTab accountId={accountId} />
        )}
      </div>
    </div>
  );
}

function MutationsTab({ isLoading, mutations }: { isLoading: boolean; mutations: NonNullable<ReturnType<typeof useCbAccountMutations>["data"]>["mutations"] }) {
  if (isLoading) return <LoadingState />;
  if (mutations.length === 0) return <EmptyState title="Belum Ada Mutasi" subtitle="Mutasi yang menyentuh akun ini akan ditampilkan di sini." />;

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>No. Jurnal</th>
          <th>Deskripsi</th>
          <th style={{ textAlign: "right" }}>Debit</th>
          <th style={{ textAlign: "right" }}>Kredit</th>
          <th style={{ textAlign: "right" }}>Saldo Berjalan</th>
          <th>Rekonsiliasi</th>
        </tr>
      </thead>
      <tbody>
        {mutations.map((m) => (
          <tr key={m.gl_journal_id}>
            <td>{formatDate(m.journal_date)}</td>
            <td>
              <Link to={`/finance/gl/journals/${m.journal_number}`} style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace", fontSize: "0.8rem" }}>
                {m.journal_number}
              </Link>
            </td>
            <td>{m.description ?? "—"}</td>
            <td style={{ textAlign: "right" }}>{m.debit > 0 ? formatCurrency(m.debit) : "—"}</td>
            <td style={{ textAlign: "right" }}>{m.credit > 0 ? formatCurrency(m.credit) : "—"}</td>
            <td style={{ textAlign: "right", fontWeight: 600 }}>{formatCurrency(m.running_balance)}</td>
            <td>
              {m.is_reconciled ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--good)", fontSize: "0.78rem" }}>
                  <CheckCircle2 size={13} /> Clear
                </span>
              ) : (
                <span style={{ fontSize: "0.78rem", color: "var(--grey)" }}>Belum</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReconciliationTab({ accountId }: { accountId: number }) {
  const [statementDate, setStatementDate] = useState("");
  const [statementEndingBalance, setStatementEndingBalance] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ message: string } | null>(null);

  const { data: pendingItems, isLoading } = useCbPendingReconciliation(accountId, statementDate || undefined);
  const reconcileMutation = useReconcileCbAccount();

  function toggleSelect(id: number) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }

  function selectAll() {
    setSelectedIds(pendingItems?.map((i) => i.gl_journal_id) ?? []);
  }

  async function handleReconcile() {
    setError(null);
    setResult(null);
    if (!statementDate) {
      setError("Isi tanggal statement dulu.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Pilih minimal 1 baris untuk direkonsiliasi.");
      return;
    }
    try {
      const res = await reconcileMutation.mutateAsync({
        accountId,
        statementDate,
        glJournalIds: selectedIds,
        statementEndingBalance: statementEndingBalance ? Number(statementEndingBalance) : undefined,
      });
      setResult({ message: `${res.lines_reconciled_this_run} baris berhasil direkonsiliasi. Saldo buku: ${formatCurrency(res.reconciled_balance)}${res.difference !== null ? ` — Selisih dari statement: ${formatCurrency(res.difference)}` : ""}` });
      setSelectedIds([]);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div style={{ padding: "1.25rem 1.5rem" }}>
      <p style={{ fontSize: "0.82rem", color: "var(--grey-dark)", marginBottom: "1rem" }}>
        Pilih baris yang SUDAH muncul di rekening koran bank, lalu tandai sebagai "clear" per tanggal statement.
      </p>

      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "1.25rem" }}>
        <div>
          <label className="input-label">Tanggal Statement *</label>
          <input className="input" type="date" style={{ width: 180 }} value={statementDate} onChange={(e) => setStatementDate(e.target.value)} />
        </div>
        <div>
          <label className="input-label">Saldo Akhir Statement (opsional)</label>
          <input className="input" type="number" style={{ width: 200 }} value={statementEndingBalance} onChange={(e) => setStatementEndingBalance(e.target.value)} placeholder="Untuk cek selisih otomatis" />
        </div>
        <Button onClick={handleReconcile} disabled={reconcileMutation.isPending}>
          {reconcileMutation.isPending ? "Memproses..." : `Rekonsiliasi (${selectedIds.length} dipilih)`}
        </Button>
      </div>

      {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}
      {result && <div style={{ background: "#d9f2e6", color: "var(--good)", padding: "0.75rem 1rem", borderRadius: 8, fontSize: "0.85rem", marginBottom: "1rem" }}>{result.message}</div>}

      {isLoading && <LoadingState label="Memuat item pending..." />}

      {pendingItems && pendingItems.length === 0 && (
        <EmptyState title="Tidak Ada Item Pending" subtitle="Semua mutasi akun ini sudah direkonsiliasi." />
      )}

      {pendingItems && pendingItems.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={selectedIds.length === pendingItems.length} onChange={selectAll} />
              </th>
              <th>Tanggal</th>
              <th>No. Jurnal</th>
              <th>Deskripsi</th>
              <th style={{ textAlign: "right" }}>Debit</th>
              <th style={{ textAlign: "right" }}>Kredit</th>
            </tr>
          </thead>
          <tbody>
            {pendingItems.map((item) => (
              <tr key={item.gl_journal_id}>
                <td><input type="checkbox" checked={selectedIds.includes(item.gl_journal_id)} onChange={() => toggleSelect(item.gl_journal_id)} /></td>
                <td>{formatDate(item.journal_date)}</td>
                <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{item.journal_number}</td>
                <td>{item.description ?? "—"}</td>
                <td style={{ textAlign: "right" }}>{item.debit > 0 ? formatCurrency(item.debit) : "—"}</td>
                <td style={{ textAlign: "right" }}>{item.credit > 0 ? formatCurrency(item.credit) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
