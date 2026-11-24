import { useState } from "react";
import { Wallet, CheckCircle2 } from "lucide-react";
import { useCreateApPayment } from "../api/useApPayments";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput, FormTextarea, SearchableSelect } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { extractErrorMessage } from "@shared/types/api";
import type { ApPaymentMethod } from "../types/apPayment";

interface ApPaymentModalProps {
  onClose: () => void;
}

const METHOD_OPTIONS: { value: ApPaymentMethod; label: string; sublabel: string }[] = [
  { value: "cash", label: "Tunai (Cash)", sublabel: "Bayar dengan uang tunai" },
  { value: "bank_transfer", label: "Transfer Bank", sublabel: "Via bank transfer" },
  { value: "check", label: "Cek / Giro", sublabel: "Pembayaran dengan cek" },
  { value: "other", label: "Lainnya", sublabel: "Cara lain" },
];

export function ApPaymentModal({ onClose }: ApPaymentModalProps) {
  const createMutation = useCreateApPayment();

  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<ApPaymentMethod>("bank_transfer");
  const [withdrawalAccountCode, setWithdrawalAccountCode] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ message: string; warning?: string | null } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vendorId) { setError("Pilih vendor dulu."); return; }

    try {
      const res = await createMutation.mutateAsync({
        vendor_id: Number(vendorId),
        vendor_name: vendorName,
        payment_date: paymentDate || undefined,
        payment_method: paymentMethod,
        withdrawal_account_code: withdrawalAccountCode,
        amount: Number(amount),
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });
      setSuccessInfo({ message: res.message, warning: res.warning });
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
    <Modal title="💸 Catat Pembayaran Vendor" onClose={onClose} maxWidth={520}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fee2e2", color: "#991b1b", padding: "0.7rem 0.875rem", borderRadius: 8, marginBottom: "1.25rem", fontSize: "0.8rem" }}>
        <Wallet size={15} />
        Hutang ke vendor otomatis berkurang sejumlah pembayaran ini.
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {/* Vendor selection — text input as placeholder (VendorPicker needs separate implementation) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <FormInput
            label="Vendor ID *"
            type="number"
            required
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            placeholder="ID vendor"
          />
          <FormInput
            label="Nama Vendor *"
            required
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            placeholder="Nama vendor"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <FormInput type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} label="Tanggal Bayar" />
          <SearchableSelect
            value={paymentMethod}
            onChange={(v) => setPaymentMethod(v as ApPaymentMethod)}
            options={METHOD_OPTIONS}
            placeholder="Pilih metode..."
          />
        </div>

        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Penarikan / Kas *</label></div>
          <AccountPicker
            value={withdrawalAccountCode}
            onChange={setWithdrawalAccountCode}
            placeholder="Cari akun kas/bank..."
          />
          <div style={{ fontSize: "0.7rem", color: "var(--grey)", marginTop: "0.3rem" }}>
            Akun kas/bank tempat pembayaran keluar (mis. Bank BCA 111002).
          </div>
        </div>

        <FormInput
          label="Jumlah Dibayar *"
          type="number" required min={0.01} step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />
        <FormInput value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} label="No. Referensi" placeholder="mis. no. transfer bank (opsional)" />
        <FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} label="Catatan" placeholder="Catatan pembayaran (opsional)" />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={createMutation.isPending} style={{ flex: 1 }}>
            {createMutation.isPending ? "Menyimpan..." : "💸 Catat Pembayaran"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
