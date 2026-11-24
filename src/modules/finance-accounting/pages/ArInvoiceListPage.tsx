import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Plus, Mail } from "lucide-react";
import { useArInvoiceList, useSendArInvoiceReminder } from "../api/useArInvoices";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { PageHeader } from "@shared/components/PageHeader";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { ArInvoice, InvoiceStatus } from "../types/arInvoice";

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  posted: "Terposting",
  paid: "Lunas",
  partially_paid: "Sebagian Lunas",
  void: "Dibatalkan",
};

// Reminder cuma masuk akal untuk invoice yang MASIH punya tagihan berjalan
// - cocok dengan validasi backend (AccountsReceivableService::sendReminder()
// menolak status selain posted/partially_paid).
const REMINDABLE_STATUSES: InvoiceStatus[] = ["posted", "partially_paid"];

export function ArInvoiceListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<InvoiceStatus | "">("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<ArInvoice | null>(null);

  const { data, isLoading } = useArInvoiceList({ page, per_page: 10, status: status || undefined, overdue_only: overdueOnly || undefined });

  return (
    <div>
      <PageHeader title="AR Invoice" subtitle="Kelola tagihan piutang kepada customer - Accounts Receivable." />

      <div className="content-card">
        <div className="tabs">
          <button className="tab is-active">
            Semua Invoice
            <span className="tab__count">{data?.total ?? 0}</span>
          </button>
        </div>

        <div className="toolbar">
          <div className="toolbar__search" style={{ flex: "none", minWidth: "auto" }}>
            <select className="input" style={{ width: 170, paddingLeft: "0.75rem" }} value={status} onChange={(e) => { setStatus(e.target.value as InvoiceStatus | ""); setPage(1); }}>
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--grey-dark)" }}>
            <input type="checkbox" checked={overdueOnly} onChange={(e) => { setOverdueOnly(e.target.checked); setPage(1); }} />
            Jatuh tempo saja
          </label>
          <Link to="/finance/ar-invoices/new" style={{ marginLeft: "auto" }}>
            <Button><Plus size={15} /> Invoice Baru</Button>
          </Link>
        </div>

        {isLoading && <LoadingState />}

        {data && data.data.length === 0 && (
          <EmptyState title="Belum Ada Invoice Tercatat" subtitle="Invoice yang Anda buat atau yang cocok dengan filter akan ditampilkan di sini." />
        )}

        {data && data.data.length > 0 && (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>No. Invoice</th>
                  <th>Customer</th>
                  <th>Source</th>
                  <th>Jatuh Tempo</th>
                  <th>Total</th>
                  <th>Sisa Tagihan</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{inv.invoice_number}</td>
                    <td>{inv.customer_name}</td>
                    <td>
                      {inv.reference_type === "contract" ? (
                        <span title={`Kontrak: ${inv.reference_number ?? ""}`} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", fontWeight: 600, color: "#7c3aed", cursor: "help" }}>
                          🔄 {inv.reference_number ?? "Contract"}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--grey)", fontStyle: "italic" }}>Manual</span>
                      )}
                    </td>
                    <td>
                      {formatDate(inv.due_date)}
                      {inv.is_overdue && <span className="badge badge-churned" style={{ marginLeft: "0.4rem" }}>Telat {inv.days_overdue}h</span>}
                    </td>
                    <td>{formatCurrency(inv.total_amount)}</td>
                    <td>{formatCurrency(inv.outstanding_amount)}</td>
                    <td><span className={`badge badge-${inv.status === "paid" ? "active" : inv.status === "void" ? "churned" : "prospect"}`}>{STATUS_LABEL[inv.status]}</span></td>
                    <td>
                      {REMINDABLE_STATUSES.includes(inv.status) && (
                        <button
                          onClick={() => setReminderTarget(inv)}
                          style={{ border: "none", background: "none", color: "var(--accent)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}
                        >
                          <Mail size={13} /> Reminder
                        </button>
                      )}
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

      {reminderTarget && <SendReminderModal invoice={reminderTarget} onClose={() => setReminderTarget(null)} />}
    </div>
  );
}

function SendReminderModal({ invoice, onClose }: { invoice: ArInvoice; onClose: () => void }) {
  // Auto-isi dari kontak utama customer (crm_customer_contact.is_primary)
  // supaya Finance tidak perlu ketik manual tiap kirim reminder (rawan
  // salah ketik) - tetap bisa diedit kalau memang mau kirim ke email lain.
  const [email, setEmail] = useState(invoice.primary_contact_email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const sendMutation = useSendArInvoiceReminder();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendMutation.mutateAsync({ id: invoice.id, email });
      setSent(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (sent) {
    return (
      <Modal title="Reminder Terkirim" onClose={onClose}>
        <p style={{ color: "var(--good)", fontWeight: 600, marginBottom: "1rem" }}>
          Reminder untuk invoice {invoice.invoice_number} berhasil dikirim ke {email}.
        </p>
        <Button onClick={onClose} style={{ width: "100%" }}>Tutup</Button>
      </Modal>
    );
  }

  return (
    <Modal title={`Kirim Reminder — ${invoice.invoice_number}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: "0.85rem", color: "var(--grey-dark)", marginBottom: "1rem" }}>
          Kirim pengingat pembayaran ke <strong>{invoice.customer_name}</strong> - sisa tagihan {formatCurrency(invoice.outstanding_amount)}.
        </p>
        <InputField label="Email Penerima *" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="finance@customer.com" autoFocus />
        {invoice.primary_contact_email && (
          <p style={{ fontSize: "0.75rem", color: "var(--grey)", marginTop: "-0.6rem", marginBottom: "0.9rem" }}>
            Diisi otomatis dari kontak utama customer — ubah kalau perlu kirim ke email lain.
          </p>
        )}

        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={sendMutation.isPending}>
            {sendMutation.isPending ? "Mengirim..." : "Kirim Reminder"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
