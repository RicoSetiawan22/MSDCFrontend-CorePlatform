import { useState } from "react";
import { Search, X, ChevronDown, ChevronRight, Send, AlertTriangle } from "lucide-react";
import { useArIntegrationList, usePostArIntegrationBatch, useRejectArIntegration } from "../api/useIntegration";
import { Button } from "@shared/components/Button";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { IntegrationArInvoice } from "../types/integration";

const REFERENCE_LABELS: Record<string, string> = {
  dc_usage_record: "🛠️ Remote Hands (DataCenterOps)",
  contract: "📄 Billing Contract",
};

export function ArIntegrationPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data, isLoading } = useArIntegrationList({ page, per_page: 20, search: search || undefined });
  const postBatch = usePostArIntegrationBatch();

  const invoices = data?.data ?? [];
  const postableIds = invoices.filter(i => i.journal_preview).map(i => i.id);
  const allSelected = postableIds.length > 0 && postableIds.every(id => selectedIds.includes(id));

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : postableIds);
  }

  function handlePostSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Posting ${selectedIds.length} invoice terpilih ke piutang & jurnal GL? Aksi ini tidak bisa dibatalkan.`)) return;
    postBatch.mutate(selectedIds, {
      onSuccess: (res) => { alert(res.message); setSelectedIds([]); },
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <div>
      <PageHeader title="AR Integration" subtitle="Pendapatan yang datang otomatis dari modul lain (mis. Remote Hands DataCenterOps) — review preview jurnalnya dulu di sini, lalu pilih (centang) invoice mana yang mau diposting ke piutang & jurnal GL." />
      <div className="content-card">
        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={16} />
            <input className="input" placeholder="Cari customer, no invoice, atau referensi..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Button disabled={selectedIds.length === 0 || postBatch.isPending} onClick={handlePostSelected} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Send size={14} /> {postBatch.isPending ? "Memproses..." : `Posting Terpilih (${selectedIds.length})`}
            </Button>
          </div>
        </div>

        {isLoading && <LoadingState />}
        {data && invoices.length === 0 && (
          <EmptyState title="Tidak Ada Draft Menunggu Review" subtitle="Invoice draft dari modul lain (mis. Remote Hands DataCenterOps) akan muncul di sini." />
        )}
        {data && invoices.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 1.5rem 0.6rem", fontSize: "0.78rem", color: "var(--grey)" }}>
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={postableIds.length === 0} />
              Pilih semua yang bisa diposting di halaman ini
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0 1.5rem 1rem" }}>
              {invoices.map(invoice => (
                <ArIntegrationRow key={invoice.id} invoice={invoice} selected={selectedIds.includes(invoice.id)} onToggle={() => toggleSelect(invoice.id)} />
              ))}
            </div>
            <div style={{ padding: "0 1.5rem" }}>
              <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ArIntegrationRow({ invoice, selected, onToggle }: { invoice: IntegrationArInvoice; selected: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectArIntegration();

  async function handleReject() {
    try {
      await rejectMutation.mutateAsync({ id: invoice.id, reason: reason || undefined });
      setShowReject(false);
    } catch (err) { alert(extractErrorMessage(err)); }
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
        <input type="checkbox" checked={selected} onChange={onToggle} disabled={!invoice.journal_preview} onClick={e => e.stopPropagation()} />
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{invoice.customer_name}</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--grey)", display: "flex", gap: "0.6rem", flexWrap: "wrap", marginLeft: 20 }}>
            <span style={{ fontFamily: "monospace" }}>{invoice.invoice_number}</span>
            {invoice.reference_type && <span>{REFERENCE_LABELS[invoice.reference_type] ?? invoice.reference_type} · {invoice.reference_number}</span>}
            <span>Tanggal: {formatDate(invoice.invoice_date)}</span>
          </div>
          {invoice.preview_error && (
            <div style={{ fontSize: "0.68rem", color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, marginTop: 2, marginLeft: 20 }}>
              <AlertTriangle size={10} /> {invoice.preview_error}
            </div>
          )}
        </div>
        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>{formatCurrency(invoice.total_amount)}</div>
        <div style={{ display: "flex", gap: "0.4rem" }} onClick={e => e.stopPropagation()}>
          <Button variant="danger" disabled={rejectMutation.isPending} onClick={() => setShowReject(s => !s)} style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <X size={13} /> Reject
          </Button>
        </div>
      </div>

      {showReject && (
        <div style={{ padding: "0.6rem 1rem", background: "#fef2f2", borderTop: "1px solid var(--border)", display: "flex", gap: "0.5rem" }}>
          <input className="input" style={{ flex: 1, fontSize: "0.8rem" }} placeholder="Alasan reject (opsional)..." value={reason} onChange={e => setReason(e.target.value)} />
          <Button variant="danger" disabled={rejectMutation.isPending} onClick={handleReject} style={{ fontSize: "0.78rem" }}>
            {rejectMutation.isPending ? "Memproses..." : "Konfirmasi Reject"}
          </Button>
        </div>
      )}

      {expanded && invoice.journal_preview && (
        <div style={{ borderTop: "1px solid var(--border)", background: "#fafbfc", padding: "0.5rem 1rem 0.75rem 2.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
            <thead>
              <tr>
                <th style={{ padding: "3px 8px", textAlign: "left", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)", width: 90 }}>Kode</th>
                <th style={{ padding: "3px 8px", textAlign: "left", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Nama Akun</th>
                <th style={{ padding: "3px 8px", textAlign: "left", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)" }}>Memo</th>
                <th style={{ padding: "3px 8px", textAlign: "right", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)", width: 120 }}>Debit</th>
                <th style={{ padding: "3px 8px", textAlign: "right", color: "var(--grey)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "1px solid var(--border)", width: 120 }}>Kredit</th>
              </tr>
            </thead>
            <tbody>
              {invoice.journal_preview.lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ padding: "3px 8px", fontFamily: "monospace", fontSize: "0.75rem", color: "#6b7280" }}>{line.account_code || "—"}</td>
                  <td style={{ padding: "3px 8px", fontSize: "0.78rem" }}>{line.account_name ?? "(Tanpa nama)"}</td>
                  <td style={{ padding: "3px 8px", color: "var(--grey)", fontSize: "0.75rem", fontStyle: "italic" }}>{line.description ?? "—"}</td>
                  <td style={{ padding: "3px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: line.debit > 0 ? "#1d4ed8" : "#d1d5db" }}>
                    {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                  </td>
                  <td style={{ padding: "3px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, color: line.credit > 0 ? "#7c3aed" : "#d1d5db" }}>
                    {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoice.notes && <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: "0.5rem" }}>Catatan: {invoice.notes}</div>}
        </div>
      )}
    </div>
  );
}
