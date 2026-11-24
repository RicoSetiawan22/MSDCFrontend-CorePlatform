import { useState } from "react";
import { FileDown } from "lucide-react";
import { useCbAccountMutations, useDownloadCashBookPdf } from "../api/useCbAccounts";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { CbAccountPicker } from "../components/CbAccountPicker";

function firstDayOfMonth(): string {
  return new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
}
const TODAY = new Date().toISOString().slice(0, 10);

function ReconciledBadge({ reconciled }: { reconciled: boolean }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 12,
      fontSize: "0.68rem",
      fontWeight: 700,
      background: reconciled ? "#f0fdf4" : "#fffbeb",
      color: reconciled ? "#16a34a" : "#d97706",
      border: `1px solid ${reconciled ? "#bbf7d0" : "#fde68a"}`,
    }}>
      {reconciled ? "✓ Reconciled" : "◯ Pending"}
    </span>
  );
}

export function CashBookPage() {
  const [accountId, setAccountId] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState(firstDayOfMonth());
  const [dateTo, setDateTo] = useState(TODAY);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadCashBookPdf();

  const { data, isLoading } = useCbAccountMutations(accountId, dateFrom || undefined, dateTo || undefined);

  const mutations = data?.mutations ?? [];
  const totalDebit = mutations.reduce((s, m) => s + (m.debit ?? 0), 0);
  const totalCredit = mutations.reduce((s, m) => s + (m.credit ?? 0), 0);
  const openingBalance = data ? data.ending_balance - totalDebit + totalCredit : 0;
  const closingBalance = data?.ending_balance ?? 0;
  const reconciledCount = mutations.filter((m) => m.is_reconciled).length;
  const pendingCount = mutations.length - reconciledCount;

  function exportCsv() {
    if (!data) return;
    const headers = ["Tanggal", "No. Jurnal", "Referensi", "Keterangan", "Sumber", "Debit", "Kredit", "Saldo", "Reconciled"];
    const rows = mutations.map((m) => [
      formatDate(m.journal_date), m.journal_number, m.reference_number ?? "",
      m.description ?? "", m.source_module,
      m.debit ?? "", m.credit ?? "", m.running_balance,
      m.is_reconciled ? "Ya" : "Tidak",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `buku-kas-${accountId}-${TODAY}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Buku Kas"
        subtitle="Mutasi kronologis seluruh transaksi kas/bank di akun yang dipilih — debit, kredit, saldo berjalan, dan status rekonsiliasi."
      />

      {/* KPI Summary Row */}
      {data && (
        <div style={{ padding: "0 2rem 1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
            {[
              { label: "Saldo Awal", value: openingBalance, color: "#374151", bg: "#f5f5f5", border: "#1a1a1a" },
              { label: "Total Debit", value: totalDebit, color: "#16a34a", bg: "#f0fdf4", border: "#16a34a" },
              { label: "Total Kredit", value: totalCredit, color: "#dc2626", bg: "#fef2f2", border: "#dc2626" },
              { label: "Saldo Akhir", value: closingBalance, color: "#1d4ed8", bg: "#eff6ff", border: "#1d4ed8" },
              { label: "Transaksi", value: mutations.length, color: "#7c3aed", bg: "#f5f3ff", border: "#7c3aed", suffix: `${reconciledCount} ✓ ${pendingCount} ◯` },
            ].map((kpi) => (
              <div key={kpi.label} style={{ background: kpi.bg, border: `2px solid ${kpi.border}`, borderRadius: 12, padding: "0.875rem 1rem", textAlign: "center" }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: "0.25rem" }}>{kpi.label}</div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: kpi.color, fontFamily: "monospace" }}>
                  {"suffix" in kpi ? mutations.length : formatCurrency(kpi.value)}
                </div>
                {"suffix" in kpi && kpi.suffix && (
                  <div style={{ fontSize: "0.62rem", color: "#666", marginTop: "0.2rem" }}>{kpi.suffix}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.875rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={!accountId}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 10, cursor: accountId ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.85rem", opacity: accountId ? 1 : 0.5 }}
          >
            <FileDown size={15} /> Cetak PDF
          </button>
          <button
            onClick={exportCsv}
            disabled={!data}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1rem", background: "white", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 10, cursor: data ? "pointer" : "not-allowed", fontWeight: 700, fontSize: "0.85rem", opacity: data ? 1 : 0.5 }}
          >
            📥 Export CSV
          </button>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Akun Kas/Bank *</label>
            <CbAccountPicker value={accountId} onChange={(v) => setAccountId(v)} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Dari Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Sampai Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: "0 2rem 2rem" }} className="print-area">
        {!accountId && (
          <EmptyState title="Pilih Akun Kas/Bank" subtitle="Pilih akun kas/bank di atas untuk melihat mutasi transaksi." />
        )}
        {accountId && isLoading && <LoadingState label="Memuat mutasi..." />}

        {accountId && data && mutations.length === 0 && (
          <EmptyState title="Tidak Ada Mutasi" subtitle="Tidak ada transaksi GL di akun ini pada rentang tanggal yang dipilih." />
        )}

        {accountId && data && mutations.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {/* Account header */}
            {data.account && (
              <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", background: "#eff6ff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#1a1a1a", fontSize: "1rem" }}>{data.account.account_name}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--grey)", fontFamily: "monospace" }}>{data.account.account_code}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey)" }}>Saldo Akhir</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--accent)", fontFamily: "monospace" }}>{formatCurrency(closingBalance)}</div>
                </div>
              </div>
            )}

            {/* Table */}
            <table className="table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th style={{ width: 80 }}>Tanggal</th>
                  <th style={{ width: 130 }}>No. Jurnal</th>
                  <th style={{ width: 100 }}>Referensi</th>
                  <th>Keterangan</th>
                  <th style={{ width: 90, textAlign: "center" }}>Status</th>
                  <th style={{ width: 110, textAlign: "right" }}>Debit (Rp)</th>
                  <th style={{ width: 110, textAlign: "right" }}>Kredit (Rp)</th>
                  <th style={{ width: 130, textAlign: "right" }}>Saldo (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening balance */}
                <tr style={{ background: "#f5f5f5" }}>
                  <td colSpan={4} style={{ fontStyle: "italic", color: "var(--grey)", fontSize: "0.8rem", padding: "6px 12px" }}>
                    {formatDate(dateFrom)} — Saldo Awal
                  </td>
                  <td style={{ textAlign: "center" }}>—</td>
                  <td style={{ textAlign: "right", color: "var(--grey)", fontFamily: "monospace" }}>—</td>
                  <td style={{ textAlign: "right", color: "var(--grey)", fontFamily: "monospace" }}>—</td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 800 }}>{formatCurrency(openingBalance)}</td>
                </tr>
                {mutations.map((m, i) => (
                  <tr key={i} style={{ background: m.is_reconciled ? "#f9fafb" : "white" }}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--grey)" }}>{formatDate(m.journal_date)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "var(--accent)" }}>{m.journal_number}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--grey)" }}>{m.reference_number ?? "—"}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {m.description ?? "—"}
                      {m.source_module && m.source_module !== "FinanceAccounting" && (
                        <span style={{ marginLeft: 6, fontSize: "0.68rem", color: "#6366f1", background: "#eef2ff", padding: "1px 5px", borderRadius: 4 }}>{m.source_module}</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <ReconciledBadge reconciled={m.is_reconciled ?? false} />
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.85rem", color: m.debit ? "#16a34a" : "var(--grey)", fontWeight: m.debit ? 700 : 400 }}>
                      {m.debit ? formatCurrency(m.debit) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.85rem", color: m.credit ? "#dc2626" : "var(--grey)", fontWeight: m.credit ? 700 : 400 }}>
                      {m.credit ? formatCurrency(m.credit) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "#1a1a1a" }}>{formatCurrency(m.running_balance)}</td>
                  </tr>
                ))}
                {/* Grand total */}
                <tr style={{ background: "#1a1a1a", color: "white" }}>
                  <td colSpan={5} style={{ fontWeight: 800, fontSize: "0.82rem", padding: "8px 12px" }}>
                    SALDO AKHIR — {data.account?.account_name} ({data.account?.account_code})
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem", color: "#86efac", fontWeight: 800 }}>
                    {totalDebit > 0 ? formatCurrency(totalDebit) : "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.9rem", color: "#fca5a5", fontWeight: 800 }}>
                    {totalCredit > 0 ? formatCurrency(totalCredit) : "—"}
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.95rem", fontWeight: 800, color: "#93c5fd" }}>
                    {formatCurrency(closingBalance)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Reconciliation summary */}
            <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border)", background: "#f9fafb", display: "flex", gap: "2rem", fontSize: "0.78rem", color: "var(--grey)" }}>
              <span>✓ {reconciledCount} transaksi sudah direkonsiliasi</span>
              <span>◯ {pendingCount} transaksi belum direkonsiliasi</span>
              <span>• Total {mutations.length} transaksi</span>
            </div>
          </div>
        )}
      </div>

      {isPrintModalOpen && accountId && (
        <LetterheadPdfModal
          title="Cetak PDF — Buku Kas"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ organizationId: orgId, accountId, date_from: dateFrom || undefined, date_to: dateTo || undefined })}
        />
      )}
    </div>
  );
}
