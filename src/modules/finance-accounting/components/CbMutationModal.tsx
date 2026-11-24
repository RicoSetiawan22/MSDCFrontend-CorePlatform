import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight } from "lucide-react";
import { useCreateCbDeposit, useCreateCbWithdrawal, useCreateCbTransfer } from "../api/useCbMutations";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput, FormTextarea } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { extractErrorMessage } from "@shared/types/api";
import type { MutationType } from "../types/cbMutation";

interface CbMutationModalProps {
  onClose: () => void;
}

const TYPES = [
  { key: "deposit"    as MutationType, label: "Setoran",    icon: ArrowDownCircle,  desc: "Uang MASUK ke kas/bank dari luar AR/AP (mis. setoran modal).",        color: "#15803d", bg: "#d9f2e6" },
  { key: "withdrawal" as MutationType, label: "Penarikan",  icon: ArrowUpCircle,    desc: "Uang KELUAR dari kas/bank untuk keperluan di luar AP (mis. biaya ops).", color: "#dc2626", bg: "#fee2e2" },
  { key: "transfer"   as MutationType, label: "Transfer",    icon: ArrowLeftRight,   desc: "Pindah dana antar 2 akun kas/bank milik sendiri.",                       color: "#1d4ed8", bg: "#dbeafe" },
];

export function CbMutationModal({ onClose }: CbMutationModalProps) {
  const [type, setType] = useState<MutationType>("deposit");
  const [amount, setAmount] = useState("");
  const [mutationDate, setMutationDate] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");
  const [counterAccountId, setCounterAccountId] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);

  const depositMutation = useCreateCbDeposit();
  const withdrawalMutation = useCreateCbWithdrawal();
  const transferMutation = useCreateCbTransfer();

  const activeMutation = type === "deposit" ? depositMutation : type === "withdrawal" ? withdrawalMutation : transferMutation;
  const cfg = TYPES.find((t) => t.key === type)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        amount: Number(amount),
        mutation_date: mutationDate || undefined,
        reference_number: referenceNumber || undefined,
        description: description || undefined,
        from_account_id: fromAccountId || undefined,
        to_account_id: toAccountId || undefined,
        counter_account_id: counterAccountId || undefined,
      };
      if (type === "deposit") await depositMutation.mutateAsync(payload);
      else if (type === "withdrawal") await withdrawalMutation.mutateAsync(payload);
      else await transferMutation.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="💵 Catat Mutasi Kas/Bank" onClose={onClose} maxWidth={560}>
      {/* Type selector tabs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "1rem" }}>
        {TYPES.map((t) => {
          const Icon = t.icon;
          const isActive = type === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem",
                padding: "0.875rem 0.5rem",
                borderRadius: 10, cursor: "pointer",
                border: isActive ? `2px solid ${t.color}` : "1px solid var(--border)",
                background: isActive ? t.bg : "white",
                color: isActive ? t.color : "var(--grey)",
                transition: "all 0.15s",
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Description */}
      <div style={{
        background: cfg.bg,
        color: cfg.color,
        padding: "0.6rem 0.875rem",
        borderRadius: 8,
        fontSize: "0.8rem",
        marginBottom: "1.25rem",
        fontWeight: 600,
      }}>
        {cfg.desc}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

        {(type === "withdrawal" || type === "transfer") && (
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Asal (Kas/Bank) *</label></div>
            <AccountPicker value={fromAccountId} onChange={(v) => setFromAccountId(v ? Number(v) : "")} placeholder="Pilih akun kas/bank asal..." />
          </div>
        )}

        {(type === "deposit" || type === "transfer") && (
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Tujuan (Kas/Bank) *</label></div>
            <AccountPicker value={toAccountId} onChange={(v) => setToAccountId(v ? Number(v) : "")} placeholder="Pilih akun kas/bank tujuan..." />
          </div>
        )}

        {(type === "deposit" || type === "withdrawal") && (
          <div>
            <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Akun Lawan (Counter) *</label></div>
            <AccountPicker value={counterAccountId} onChange={(v) => setCounterAccountId(v ? Number(v) : "")} placeholder={type === "deposit" ? "mis. Modal Disetor..." : "mis. Biaya Operasional..."} />
          </div>
        )}

        <FormInput
          label="Jumlah (Rp) *"
          type="number" required min={0.01} step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <FormInput type="date" value={mutationDate} onChange={(e) => setMutationDate(e.target.value)} label="Tanggal" />
          <FormInput value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} label="No. Referensi" placeholder="opsional" />
        </div>

        <FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} label="Deskripsi" placeholder="Keterangan mutasi kas/bank..." />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={activeMutation.isPending} style={{ flex: 1 }}>
            {activeMutation.isPending ? "Menyimpan..." : `💵 Catat ${cfg.label}`}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
