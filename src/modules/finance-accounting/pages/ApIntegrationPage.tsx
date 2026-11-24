import { useState } from "react";
import { Search, X, ChevronDown, ChevronRight, Send, AlertTriangle, Wallet } from "lucide-react";
import { useApIntegrationList, usePostApIntegrationBatch, useRejectApIntegration } from "../api/useIntegration";
import { useAccountList } from "../api/useAccounts";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { Pagination } from "@shared/components/Pagination";
import { formatDate, formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { IntegrationApBill } from "../types/integration";
import { usePaymentRequestList, usePostAdvance } from "@modules/procurement-inventory/api/usePaymentRequest";
import type { PaymentRequest } from "@modules/procurement-inventory/types/paymentRequest";

const REFERENCE_LABELS: Record<string, string> = {
  goods_receipt: "📦 Goods Receipt (Procurement)",
};

export function ApIntegrationPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data, isLoading } = useApIntegrationList({ page, per_page: 20, search: search || undefined });
  const postBatch = usePostApIntegrationBatch();

  const bills = data?.data ?? [];
  const postableIds = bills.filter(b => b.journal_preview).map(b => b.id);
  const allSelected = postableIds.length > 0 && postableIds.every(id => selectedIds.includes(id));

  function toggleSelect(id: number) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? [] : postableIds);
  }

  function handlePostSelected() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Posting ${selectedIds.length} bill terpilih ke hutang & jurnal GL? Aksi ini tidak bisa dibatalkan.`)) return;
    postBatch.mutate(selectedIds, {
      onSuccess: (res) => { alert(res.message); setSelectedIds([]); },
      onError: (e) => alert("Gagal: " + extractErrorMessage(e)),
    });
  }

  return (
    <div>
      <PageHeader title="AP Integration" subtitle="Tagihan vendor yang datang otomatis dari modul lain (mis. Goods Receipt Procurement) — review preview jurnalnya dulu di sini, lalu pilih (centang) bill mana yang mau diposting ke hutang & jurnal GL." />

      <VendorAdvanceSection />

      <div className="content-card">
        <div className="toolbar">
          <div className="toolbar__search">
            <Search size={16} />
            <input className="input" placeholder="Cari vendor, no bill, atau referensi..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Button disabled={selectedIds.length === 0 || postBatch.isPending} onClick={handlePostSelected} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Send size={14} /> {postBatch.isPending ? "Memproses..." : `Posting Terpilih (${selectedIds.length})`}
            </Button>
          </div>
        </div>

        {isLoading && <LoadingState />}
        {data && bills.length === 0 && (
          <EmptyState title="Tidak Ada Draft Menunggu Review" subtitle="Bill draft dari modul lain (mis. GRN Procurement) akan muncul di sini." />
        )}
        {data && bills.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 1.5rem 0.6rem", fontSize: "0.78rem", color: "var(--grey)" }}>
              <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={postableIds.length === 0} />
              Pilih semua yang bisa diposting di halaman ini
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", padding: "0 1.5rem 1rem" }}>
              {bills.map(bill => (
                <ApIntegrationRow key={bill.id} bill={bill} selected={selectedIds.includes(bill.id)} onToggle={() => toggleSelect(bill.id)} />
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

function ApIntegrationRow({ bill, selected, onToggle }: { bill: IntegrationApBill; selected: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectApIntegration();

  async function handleReject() {
    try {
      await rejectMutation.mutateAsync({ id: bill.id, reason: reason || undefined });
      setShowReject(false);
    } catch (err) { alert(extractErrorMessage(err)); }
  }

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem" }}>
        <input type="checkbox" checked={selected} onChange={onToggle} disabled={!bill.journal_preview} onClick={e => e.stopPropagation()} />
        <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => setExpanded(e => !e)}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{bill.vendor_name}</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--grey)", display: "flex", gap: "0.6rem", flexWrap: "wrap", marginLeft: 20 }}>
            <span style={{ fontFamily: "monospace" }}>{bill.bill_number}</span>
            {bill.reference_type && <span>{REFERENCE_LABELS[bill.reference_type] ?? bill.reference_type} · {bill.reference_number}</span>}
            <span>Tanggal: {formatDate(bill.bill_date)}</span>
          </div>
          {bill.preview_error && (
            <div style={{ fontSize: "0.68rem", color: "#dc2626", fontWeight: 700, display: "flex", alignItems: "center", gap: 3, marginTop: 2, marginLeft: 20 }}>
              <AlertTriangle size={10} /> {bill.preview_error}
            </div>
          )}
        </div>
        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>{formatCurrency(bill.total_amount)}</div>
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

      {expanded && bill.journal_preview && (
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
              {bill.journal_preview.lines.map((line, i) => (
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
          {bill.notes && <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: "0.5rem" }}>Catatan: {bill.notes}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Uang Muka Vendor (DP) ──────────────────────────────────────────────────────
// Payment Request (FPP) Team 5 yang sudah 'approved' & bertipe 'dp' -
// belum tercatat jadi Uang Muka Vendor sungguhan (fin_ap_advance) sampai
// Finance pilih rekening bank dan klik "Post Uang Muka" di sini (sama
// pola "review dulu, baru posting" dengan AP Integration di atas).
function VendorAdvanceSection() {
  const { data, isLoading } = usePaymentRequestList({ per_page: 20, status: "approved" });
  const [postingFor, setPostingFor] = useState<PaymentRequest | null>(null);

  const dpRequests = (data?.data ?? []).filter(pr => pr.payment_type === "dp");

  if (isLoading || dpRequests.length === 0) return null;

  return (
    <div className="content-card" style={{ marginBottom: "1rem", padding: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#1d4ed8" }}>
            💰 Uang Muka Vendor (DP) — Menunggu Posting
          </h3>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--grey)" }}>
            Payment Request tipe DP yang sudah disetujui, tapi belum diposting jadi Uang Muka Vendor (jurnal GL).
          </p>
        </div>
        <span style={{ background: "#1d4ed8", color: "#fff", borderRadius: 20, padding: "0.2rem 0.7rem", fontSize: "0.78rem", fontWeight: 700 }}>
          {dpRequests.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {dpRequests.map(pr => (
          <div key={pr.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 0.8rem", border: "1px solid var(--border)", borderRadius: 8, background: "#f8fafc" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{pr.payment_request_number}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>
                {pr.purchase_order?.po_number} · {pr.purchase_order?.vendor?.vendor_name ?? "—"} · {formatDate(pr.created_at)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem" }}>{formatCurrency(pr.net_amount)}</div>
              {pr.tax_withholding_amount > 0 && (
                <div style={{ fontSize: "0.68rem", color: "var(--grey)" }}>
                  Bruto {formatCurrency(pr.amount)} · PPh {formatCurrency(pr.tax_withholding_amount)}
                </div>
              )}
            </div>
            <Button onClick={() => setPostingFor(pr)} style={{ fontSize: "0.78rem", padding: "0.4rem 0.7rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Wallet size={13} /> Post Uang Muka
            </Button>
          </div>
        ))}
      </div>

      {postingFor && <PostAdvanceModal pr={postingFor} onClose={() => setPostingFor(null)} />}
    </div>
  );
}

function PostAdvanceModal({ pr, onClose }: { pr: PaymentRequest; onClose: () => void }) {
  const { data: accountsData } = useAccountList({ per_page: 200, account_type: "asset" });
  const [bankAccountId, setBankAccountId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const postAdvance = usePostAdvance();

  // Rekening kas/bank - accountApi.list() SUDAH org-scoped server-side
  // (header X-Organization-Id), tinggal filter subgroup "Kas & Bank" di
  // sini (lihat AccountSeeder.php - belum ada filter subgroup di
  // AccountListParams backend).
  const bankAccounts = (accountsData?.data ?? []).filter(a => a.account_subgroup === "Kas & Bank");

  async function handlePost() {
    setError(null);
    if (!bankAccountId) { setError("Pilih rekening bank/kas pengeluaran terlebih dahulu."); return; }
    try {
      await postAdvance.mutateAsync({ id: pr.id, bankAccountId });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title={`Post Uang Muka Vendor — ${pr.payment_request_number}`} onClose={onClose} maxWidth={480}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ fontSize: "0.82rem", color: "var(--grey)" }}>
          PO <strong>{pr.purchase_order?.po_number}</strong> — {pr.purchase_order?.vendor?.vendor_name}
        </div>

        <div style={{ background: "var(--bg-secondary)", borderRadius: 8, padding: "0.6rem 0.75rem", fontSize: "0.82rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Nilai Uang Muka (Bruto)</span>
            <strong style={{ fontFamily: "monospace" }}>{formatCurrency(pr.amount)}</strong>
          </div>
          {pr.tax_withholding_amount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--bad)" }}>
              <span>Potongan PPh (jadi Hutang PPh)</span>
              <strong style={{ fontFamily: "monospace" }}>- {formatCurrency(pr.tax_withholding_amount)}</strong>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "0.3rem", marginTop: "0.1rem" }}>
            <span><strong>Ditransfer ke Vendor (Net)</strong></span>
            <strong style={{ fontFamily: "monospace" }}>{formatCurrency(pr.net_amount)}</strong>
          </div>
        </div>

        <div>
          <label className="input-label">Rekening Bank/Kas Pengeluaran *</label>
          <select className="input" value={bankAccountId} onChange={e => setBankAccountId(e.target.value ? Number(e.target.value) : "")}>
            <option value="">— Pilih —</option>
            {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
          </select>
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>
          Setelah diposting, jurnal GL akan tercatat: Dr Uang Muka Pembelian (bruto) / Cr rekening ini (net){pr.tax_withholding_amount > 0 ? " / Cr Hutang PPh (potongan)" : ""} — otomatis dinetting penuh ke AP Bill final saat barang/jasa diterima (BAST).
        </div>
        {error && <div className="input-error">{error}</div>}
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="button" disabled={postAdvance.isPending} onClick={handlePost}>
            {postAdvance.isPending ? "Memproses..." : "Post Uang Muka"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
