import { useState } from "react";
import { Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCreateArPayment } from "../api/useArPayments";
import { useArCustomerOutstanding } from "../api/useArCustomerProfiles";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput, FormTextarea, SearchableSelect } from "@shared/components/ui/FormKit";
import { CustomerPicker } from "@shared/components/CustomerPicker";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { LoadingState } from "@shared/components/LoadingState";
import { formatCurrency, formatDate } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { PaymentMethod } from "../types/arPayment";

interface ArPaymentModalProps {
  onClose: () => void;
}

const METHOD_OPTIONS = [
  { value: "cash", label: "Tunai (Cash)", sublabel: "Bayar dengan uang tunai" },
  { value: "bank_transfer", label: "Transfer Bank", sublabel: "Transfer via bank" },
  { value: "virtual_account", label: "Virtual Account", sublabel: "Bayar via VA" },
  { value: "other", label: "Lainnya", sublabel: "Cara bayar lain" },
];

export function ArPaymentModal({ onClose }: ArPaymentModalProps) {
  const createMutation = useCreateArPayment();

  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [customerName, setCustomerName] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank_transfer");
  const [depositAccountCode, setDepositAccountCode] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; unallocated: number; warning: string | null } | null>(null);
  const [allocations, setAllocations] = useState<Record<number, string>>({});

  const { data: outstanding, isLoading: isLoadingOutstanding } = useArCustomerOutstanding(customerId);

  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + Number(v || 0), 0);
  const amountNumber = Number(amount || 0);

  function toggleInvoice(invoiceId: number, invoiceOutstanding: number) {
    setAllocations((prev) => {
      if (invoiceId in prev) {
        const next = { ...prev };
        delete next[invoiceId];
        return next;
      }
      const alreadyAllocated = Object.values(prev).reduce((sum, v) => sum + Number(v || 0), 0);
      const remaining = amountNumber > 0 ? Math.max(0, amountNumber - alreadyAllocated) : invoiceOutstanding;
      const suggested = Math.min(invoiceOutstanding, remaining || invoiceOutstanding);
      return { ...prev, [invoiceId]: String(suggested) };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!customerId) { setError("Pilih customer dulu."); return; }

    const allocationList = Object.entries(allocations)
      .filter(([, v]) => Number(v) > 0)
      .map(([invoiceId, v]) => ({ invoice_id: Number(invoiceId), amount_allocated: Number(v) }));

    try {
      const res = await createMutation.mutateAsync({
        customer_id: customerId,
        customer_name: customerName,
        payment_date: paymentDate || undefined,
        payment_method: paymentMethod,
        deposit_account_code: depositAccountCode,
        amount: amountNumber,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        allocations: allocationList.length > 0 ? allocationList : undefined,
      });
      setSuccessInfo({ message: res.message, unallocated: res.unallocated_amount, warning: res.warning });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (successInfo) {
    return (
      <Modal title="✅ Pembayaran Tercatat" onClose={onClose} maxWidth={480}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "1rem 0", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#d9f2e6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={32} color="#15803d" />
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#15803d" }}>{successInfo.message}</div>
          {successInfo.warning && (
            <div style={{ background: "#fef3c7", color: "#92400e", padding: "0.6rem 0.875rem", borderRadius: 8, fontSize: "0.8rem", textAlign: "left", width: "100%" }}>
              ⚠️ {successInfo.warning}
            </div>
          )}
          <Button onClick={onClose} style={{ width: "100%" }}>Tutup</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="💰 Catat Pembayaran Piutang" onClose={onClose} maxWidth={640}>
      {/* Info banner */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#dbeafe", color: "#1d4ed8", padding: "0.7rem 0.875rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.8rem" }}>
        <Wallet size={15} />
        Piutang customer otomatis berkurang sejumlah pembayaran ini.
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        <CustomerPicker
          label="Customer *"
          selectedCustomerId={customerId}
          selectedCustomerName={customerName || undefined}
          onSelect={(c) => { setCustomerId(c.id); setCustomerName(c.company_name); setAllocations({}); }}
          onClear={() => { setCustomerId(undefined); setCustomerName(""); setAllocations({}); }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <FormInput type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} label="Tanggal Bayar" />
          <SearchableSelect
            value={paymentMethod}
            onChange={(v) => setPaymentMethod(v as PaymentMethod)}
            options={METHOD_OPTIONS}
            placeholder="Pilih metode..."
          />
        </div>

        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Deposit / Kas *</label></div>
          <AccountPicker
            value={depositAccountCode}
            onChange={setDepositAccountCode}
            placeholder="Cari akun kas/bank..."
          />
        </div>

        <FormInput
          label="Jumlah Dibayar *"
          type="number" min={0.01} step="any"
          value={amount}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />

        {/* Outstanding invoices */}
        {customerId && (
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Alokasikan ke Invoice (opsional)</label></div>
            {isLoadingOutstanding && <LoadingState label="Memuat invoice outstanding..." />}
            {outstanding && outstanding.invoices.length === 0 && (
              <div style={{ fontSize: "0.8rem", color: "var(--grey)", padding: "0.75rem", border: "1px solid var(--border)", borderRadius: 8 }}>
                Customer ini tidak punya invoice outstanding.
              </div>
            )}
            {outstanding && outstanding.invoices.length > 0 && (
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
                {outstanding.invoices.map((inv) => {
                  const isChecked = inv.id in allocations;
                  return (
                    <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.875rem", borderBottom: "1px solid var(--border)" }}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleInvoice(inv.id, inv.outstanding_amount)} style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--accent)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.83rem", fontWeight: 700, fontFamily: "monospace" }}>{inv.invoice_number}</div>
                        <div style={{ fontSize: "0.7rem", color: inv.is_overdue ? "#dc2626" : "var(--grey)" }}>
                          Jatuh tempo {formatDate(inv.due_date)}{inv.is_overdue ? ` — telat ${inv.days_overdue} hari` : ""} · Sisa {formatCurrency(inv.outstanding_amount)}
                        </div>
                      </div>
                      {isChecked && (
                        <FormInput
                          type="number" min={0.01} max={inv.outstanding_amount} step="any"
                          value={allocations[inv.id] ?? ""}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setAllocations((p) => ({ ...p, [inv.id]: e.target.value }))}
                          style={{ width: 130, textAlign: "right", fontSize: "0.82rem" }}
                        />
                      )}
                    </div>
                  );
                })}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0.875rem", background: "#f9fafb", fontSize: "0.8rem" }}>
                  <span style={{ color: "var(--grey)" }}>Total dialokasikan</span>
                  <strong style={{ color: totalAllocated > amountNumber && amountNumber > 0 ? "#dc2626" : "var(--grey-dark)", fontFamily: "monospace" }}>
                    {formatCurrency(totalAllocated)}{amountNumber > 0 ? ` / ${formatCurrency(amountNumber)}` : ""}
                  </strong>
                </div>
              </div>
            )}
            <div style={{ fontSize: "0.68rem", color: "var(--grey)", marginTop: "0.3rem" }}>
              Tidak centang = dialokasikan otomatis FIFO (invoice paling awal jatuh tempo dilunasi duluan).
            </div>
          </div>
        )}

        {totalAllocated > amountNumber && amountNumber > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fee2e2", color: "#991b1b", padding: "0.6rem 0.875rem", borderRadius: 8, fontSize: "0.8rem" }}>
            <AlertTriangle size={14} /> Total dialokasikan melebihi jumlah dibayar.
          </div>
        )}

        <FormInput value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} label="No. Referensi" placeholder="mis. no. transfer bank (opsional)" />
        <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} label="Catatan" placeholder="Catatan pembayaran (opsional)" />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={createMutation.isPending} style={{ flex: 1 }}>
            {createMutation.isPending ? "Menyimpan..." : "💰 Catat Pembayaran"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
