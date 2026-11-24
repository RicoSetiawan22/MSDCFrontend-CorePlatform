import { useState } from "react";
import { FileDown } from "lucide-react";
import { useVendorLedger, useDownloadVendorLedgerPdf } from "../api/useVendorLedger";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { LetterheadPdfModal } from "@shared/components/LetterheadPdfModal";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { VendorPicker } from "@shared/components/VendorPicker";

const TODAY = new Date().toISOString().slice(0, 10);



export function VendorLedgerPage() {
  const [vendorId, setVendorId] = useState<number | undefined>(undefined);
  const [selectedVendorName, setSelectedVendorName] = useState<string>("");
  const [dateFrom, setDateFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [dateTo, setDateTo] = useState(TODAY);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const downloadPdfMutation = useDownloadVendorLedgerPdf();

  const { data, isLoading } = useVendorLedger(vendorId, dateFrom || undefined, dateTo || undefined);

  function exportCsv() {
    if (!data) return;
    const headers = ["Date", "Reference", "Description", "Bill Amount", "Payment", "Credit Note", "Balance"];
    const rows = (data.entries ?? []).map((e) => [
      e.date, e.reference, e.description,
      e.bill_amount ?? "", e.payment_amount ?? "", e.credit_note_amount ?? "", e.balance,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `vendor-ledger-${vendorId}-${TODAY}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Vendor Ledger"
        subtitle="Riwayat transaksi lengkap per vendor AP — bill, pembayaran, dan saldo hutang berjalan."
      />

      {/* KPI Cards */}
      {data && (
        <div style={{ padding: "0 2rem 1rem" }} className="print-area">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.25rem" }}>
            {[
              { label: "Total AP Outstanding", value: formatCurrency(data.total_outstanding), color: "var(--bad)" },
              { label: "Credit Limit", value: formatCurrency(data.credit_limit), color: "var(--grey-dark)" },
              { label: "Oldest Invoice Age", value: data.oldest_invoice_age_days != null ? `${data.oldest_invoice_age_days} days` : "—", color: data.oldest_invoice_age_days && data.oldest_invoice_age_days > 60 ? "var(--bad)" : "var(--grey-dark)" },
            ].map((kpi) => (
              <div key={kpi.label} className="stat-cell" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.65rem", color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.25rem" }}>{kpi.label}</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, fontFamily: "monospace", color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ padding: "0 2rem 1rem" }} className="no-print">
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
          <button onClick={() => setIsPrintModalOpen(true)} disabled={!vendorId} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "var(--accent)", color: "white", border: "none", borderRadius: 8, cursor: vendorId ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.85rem", opacity: vendorId ? 1 : 0.5 }}>
            <FileDown size={15} /> Cetak PDF
          </button>
          <button onClick={exportCsv} disabled={!data} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", background: "white", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 8, cursor: data ? "pointer" : "not-allowed", fontWeight: 600, fontSize: "0.85rem", opacity: data ? 1 : 0.5 }}>
            📥 Export CSV
          </button>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Vendor *</label>
            <VendorPicker
              label=""
              selectedVendorId={vendorId}
              selectedVendorName={selectedVendorName}
              onSelect={(v) => { setVendorId(v.id); setSelectedVendorName(v.vendor_name ?? ""); }}
              onClear={() => { setVendorId(undefined); setSelectedVendorName(""); }}
            />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Dari Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="input-label" style={{ marginBottom: "0.2rem" }}>Sampai Tanggal</label>
            <input className="input" type="date" style={{ width: 170 }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="print-area">
        <div className="content-card">
          {!vendorId && <EmptyState title="Pilih Vendor" subtitle="Pilih vendor di atas untuk melihat riwayat transaksi hutang." />}
          {vendorId && isLoading && <LoadingState />}
          {vendorId && data && (data.entries ?? []).length === 0 && (
            <EmptyState title="Tidak Ada Transaksi" subtitle="Tidak ada transaksi untuk vendor ini pada rentang tanggal yang dipilih." />
          )}
          {vendorId && data && (data.entries ?? []).length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th style={{ textAlign: "right" }}>Bill Amount</th>
                  <th style={{ textAlign: "right" }}>Payment</th>                  <th style={{ textAlign: "right" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {(data.entries ?? []).map((entry, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: "0.82rem" }}>{formatDate(entry.date)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--accent)" }}>{entry.reference}</td>
                    <td style={{ fontSize: "0.82rem" }}>{entry.description}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", color: entry.bill_amount ? "var(--bad)" : "var(--grey)" }}>
                      {entry.bill_amount ? formatCurrency(entry.bill_amount) : "—"}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", color: entry.payment_amount ? "var(--good)" : "var(--grey)" }}>
                      {entry.payment_amount ? formatCurrency(entry.payment_amount) : "—"}
                    </td>                    <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 700 }}>{formatCurrency(entry.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isPrintModalOpen && vendorId && (
        <LetterheadPdfModal
          title="Cetak PDF — Vendor Ledger"
          onClose={() => setIsPrintModalOpen(false)}
          onDownload={(orgId) => downloadPdfMutation.mutateAsync({ vendorId, organizationId: orgId, date_from: dateFrom || undefined, date_to: dateTo || undefined })}
        />
      )}
    </div>
  );
}
