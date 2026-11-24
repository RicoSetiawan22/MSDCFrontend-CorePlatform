import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, AlertTriangle, BookX } from "lucide-react";
import { useCreateGlJournal } from "../api/useGlJournals";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { CurrencyInput, formatRupiah } from "@shared/components/CurrencyInput";
import { extractErrorMessage } from "@shared/types/api";
import type { GlJournalLineInput } from "../types/glJournal";

const EMPTY_LINE: GlJournalLineInput = { account_id: null as number | null, debit: 0, credit: 0, description: "" };

interface JournalFormModalProps {
  onClose: () => void;
}

export function JournalFormModal({ onClose }: JournalFormModalProps) {
  const navigate = useNavigate();
  const createMutation = useCreateGlJournal();

  const [journalDate, setJournalDate] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState<"draft" | "posted">("posted");
  const [lines, setLines] = useState<GlJournalLineInput[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  const isBalanced = difference === 0 && totalDebit > 0;
  const validLines = lines.filter((l) => l.account_id && ((l.debit ?? 0) > 0 || (l.credit ?? 0) > 0));

  function updateLine(index: number, patch: Partial<GlJournalLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isBalanced || validLines.length < 2) return;
    setError(null);
    try {
      const result = await createMutation.mutateAsync({
        journal_date: journalDate || undefined,
        description: description || undefined,
        reference_number: referenceNumber || undefined,
        status,
        lines: validLines,
      });
      onClose();
      navigate(`/finance/gl/journals/${result.journal_number}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="📒 Jurnal Manual Baru" onClose={onClose} maxWidth={820}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

        {/* Header banner */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
          <BookX size={20} color="#1d4ed8" />
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1d4ed8" }}>Jurnal Umum</div>
            <div style={{ fontSize: "0.72rem", color: "#6366f1" }}>Buat transaksi GL manual dengan akun debit & kredit yang balance.</div>
          </div>
        </div>

        {/* Meta fields — 3 cols */}
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px", gap: "0.875rem" }}>
          <FormInput type="date" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} label="Tanggal Jurnal *" />
          <FormInput value={description} onChange={(e) => setDescription(e.target.value)} label="Deskripsi *" placeholder="mis. Penerimaan pembayaran customer" />
          <FormInput value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} label="No. Referensi" placeholder="opsional" />
        </div>

        {/* Status toggle */}
        <div>
          <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Status Jurnal</label></div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {(["draft", "posted"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                style={{
                  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.65rem", borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${status === s ? (s === "posted" ? "#16a34a" : "#d97706") : "#e5e7eb"}`,
                  background: status === s ? (s === "posted" ? "#f0fdf4" : "#fffbeb") : "white",
                  color: status === s ? (s === "posted" ? "#16a34a" : "#d97706") : "#9ca3af",
                  fontSize: "0.88rem", fontWeight: 700,
                  transition: "all 0.15s",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>{s === "draft" ? "📝" : "✅"}</span>
                {s === "draft" ? "Draft" : "Posted"}
              </button>
            ))}
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.35rem" }}>
            {status === "draft" ? "Draft tidak masuk laporan resmi — harus diposting terpisah." : "Langsung final dan masuk laporan GL."}
          </div>
        </div>

        {/* Lines */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
            <label className="input-label" style={{ margin: 0 }}>
              Baris Akun <span style={{ fontWeight: 400, color: "var(--grey)" }}>— minimal 2 baris, debit = kredit</span>
            </label>
            <button type="button" onClick={() => setLines((p) => [...p, { ...EMPTY_LINE }])} className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>
              <Plus size={13} /> Tambah Baris
            </button>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 120px 36px", gap: "0.5rem", padding: "0 0.25rem", marginBottom: "0.35rem" }}>
            {["Akun (Kode / Nama)", "Memo / Keterangan", "Debit (Rp)", "Kredit (Rp)", ""].map((h) => (
              <div key={h} style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--grey)", textTransform: "uppercase", letterSpacing: "0.03em" }}>{h}</div>
            ))}
          </div>

          <div style={{ maxHeight: 300, overflowY: "auto", overflowX: "visible", paddingRight: 4 }}>
            {lines.map((line, index) => (
              <div key={index} style={{ display: "grid", gridTemplateColumns: "1fr 150px 120px 120px 36px", gap: "0.5rem", alignItems: "center", padding: "0.5rem", borderRadius: 8, background: index % 2 === 0 ? "transparent" : "#f9fafb", marginBottom: "0.35rem", border: "1px solid var(--border)", position: "relative" }}>
                <AccountPicker
                  value={line.account_id ?? ""}
                  onChange={(v) => updateLine(index, { account_id: v ? Number(v) : null })}
                  placeholder="Cari kode/nama akun..."
                  error={undefined}
                />
                <FormInput
                  value={line.description ?? ""}
                  onChange={(e) => updateLine(index, { description: e.target.value })}
                  placeholder="Memo..."
                  style={{ fontSize: "0.82rem" }}
                />
                <CurrencyInput value={line.debit as number} onChange={(v) => updateLine(index, { debit: v, credit: v > 0 ? 0 : line.credit })} />
                <CurrencyInput value={line.credit as number} onChange={(v) => updateLine(index, { credit: v, debit: v > 0 ? 0 : line.debit })} />
                <button type="button" onClick={() => setLines((p) => p.length > 2 ? p.filter((_, i) => i !== index) : p)} disabled={lines.length <= 2} style={{ border: "none", background: "none", cursor: lines.length <= 2 ? "not-allowed" : "pointer", color: lines.length <= 2 ? "var(--border)" : "#dc2626", display: "flex", justifyContent: "center", fontSize: "1rem" }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Balance checker — prominent */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.25rem", borderRadius: 12,
          background: isBalanced ? "#f0fdf4" : totalDebit === 0 && totalCredit === 0 ? "#f9fafb" : "#fef2f2",
          border: `2px solid ${isBalanced ? "#16a34a" : totalDebit === 0 && totalCredit === 0 ? "#e5e7eb" : "#dc2626"}`,
        }}>
          <div style={{ display: "flex", gap: "2.5rem" }}>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 3 }}>Total Debit</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "monospace", color: "#1d4ed8" }}>Rp {formatRupiah(totalDebit)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 3 }}>Total Kredit</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "monospace", color: "#7c3aed" }}>Rp {formatRupiah(totalCredit)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", marginBottom: 3 }}>Selisih</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, fontFamily: "monospace", color: difference === 0 ? "#16a34a" : "#dc2626" }}>Rp {formatRupiah(Math.abs(difference))}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.9rem" }}>
            {isBalanced
              ? <><CheckCircle2 size={20} color="#16a34a" /> <span style={{ color: "#16a34a" }}>Balance ✓</span></>
              : totalDebit === 0 && totalCredit === 0
                ? <span style={{ color: "var(--grey)", fontSize: "0.8rem" }}>Masukkan jumlah</span>
                : <><AlertTriangle size={20} color="#dc2626" /> <span style={{ color: "#dc2626" }}>Tidak Balance</span></>}
          </div>
        </div>

        {/* Info bar */}
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem", color: "var(--grey)" }}>
          <span>{validLines.length} baris dengan akun</span>
          <span>•</span>
          <span>{lines.length} baris total</span>
          <span>•</span>
          <span style={{ color: validLines.length >= 2 && isBalanced ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
            {validLines.length >= 2 && isBalanced ? "✓ Siap disimpan" : validLines.length < 2 ? "Min. 2 baris dengan akun" : "Debit ≠ Kredit"}
          </span>
        </div>

        {error && (
          <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", color: "#dc2626", borderRadius: 8, fontSize: "0.82rem", border: "1px solid #fecaca" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button type="submit" disabled={createMutation.isPending || !isBalanced || validLines.length < 2} style={{ flex: 1, opacity: (!isBalanced || validLines.length < 2) ? 0.5 : 1, padding: "0.7rem", fontSize: "0.9rem" }}>
            {createMutation.isPending ? "Menyimpan..." : "💾 Simpan Jurnal"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} style={{ padding: "0.7rem 1.25rem" }}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
