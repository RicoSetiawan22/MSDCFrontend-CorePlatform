import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { useCreateGlJournal } from "../api/useGlJournals";
import { Button } from "@shared/components/Button";
import { FormInput, FormTextarea } from "@shared/components/ui/FormKit";
import { AccountPicker } from "@shared/components/ui/AccountPicker";
import { CostCenterPicker } from "@shared/components/ui/CostCenterPicker";
import { ProfitCenterPicker } from "@shared/components/ui/ProfitCenterPicker";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { GlJournalLineInput } from "../types/glJournal";

const EMPTY_LINE: GlJournalLineInput = { account_id: null as number | null, debit: 0, credit: 0, description: "" };

export function JournalFormPage() {
  const navigate = useNavigate();
  const createMutation = useCreateGlJournal();

  const [journalDate, setJournalDate] = useState("");
  const [description, setDescription] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [status, setStatus] = useState<"draft" | "posted">("draft");
  const [costCenterId, setCostCenterId] = useState("");
  const [profitCenterId, setProfitCenterId] = useState("");
  const [lines, setLines] = useState<GlJournalLineInput[]>([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
  const [error, setError] = useState<string | null>(null);

  const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);
  const difference = Math.round((totalDebit - totalCredit) * 100) / 100;
  const isBalanced = difference === 0 && totalDebit > 0;

  function updateLine(index: number, patch: Partial<GlJournalLineInput>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const result = await createMutation.mutateAsync({
        journal_date: journalDate || undefined,
        description: description || undefined,
        reference_number: referenceNumber || undefined,
        status,
        cost_center_id: costCenterId ? Number(costCenterId) : undefined,
        profit_center_id: profitCenterId ? Number(profitCenterId) : undefined,
        lines: lines.filter((l) => l.account_id),
      });
      navigate(`/finance/gl/journals/${result.journal_number}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <div>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.85rem 2rem", borderBottom: "1px solid var(--border)", background: "white", boxShadow: "0 1px 4px rgba(20,22,31,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button type="button" onClick={() => navigate("/finance/gl/journals")} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: 8, background: "white", cursor: "pointer" }}>
            <ArrowLeft size={16} color="var(--grey)" />
          </button>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Jurnal Manual Baru</div>
            <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>General Ledger — Posting jurnal akuntansi</div>
          </div>
        </div>
        <Button type="submit" form="journal-form" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Menyimpan..." : "💾 Posting Jurnal"}
        </Button>
      </div>

      {/* Form */}
      <form id="journal-form" onSubmit={handleSubmit} style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 900 }}>
        {error && <div style={{ padding: "0.75rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.85rem" }}>⚠️ {error}</div>}

        {/* Header fields */}
        <div className="content-card" style={{ margin: 0, padding: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
            <FormInput type="date" label="Tanggal Jurnal" value={journalDate} onChange={(e) => setJournalDate(e.target.value)} />
            <FormInput label="No. Referensi" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="mis. INV-2026-0001, PO-001" />
          </div>
          <div style={{ marginTop: "1rem" }}>
            <FormTextarea label="Keterangan Jurnal" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Deskripsi transaksi..." />
          </div>
          {/* Status + CC/PC */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Status</label></div>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "posted")}>
                <option value="draft">Draft (belum posting)</option>
                <option value="posted">Posted (langsung posting)</option>
              </select>
            </div>
            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Cost Center</label></div>
              <CostCenterPicker
                value={costCenterId}
                onChange={setCostCenterId}
                placeholder="Opsional..."
              />
            </div>
            <div>
              <div style={{ marginBottom: "0.4rem" }}><label className="input-label">Profit Center</label></div>
              <ProfitCenterPicker
                value={profitCenterId}
                onChange={setProfitCenterId}
                placeholder="Opsional..."
              />
            </div>
          </div>
          <div style={{ fontSize: "0.72rem", color: "var(--grey)", marginTop: "0.5rem", lineHeight: 1.4 }}>
            Cost Center & Profit Center berlaku untuk <strong>seluruh jurnal</strong> ini. Tanpa keduanya, jurnal tidak muncul di Cost Center Report / Profit Center Report.
          </div>
        </div>

        {/* Journal Lines */}
        <div className="content-card" style={{ margin: 0, padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>Baris Jurnal</span>
            <Button type="button" variant="secondary" onClick={() => setLines((p) => [...p, { ...EMPTY_LINE }])} style={{ fontSize: "0.75rem", padding: "0.35rem 0.75rem" }}>
              <Plus size={13} /> Tambah Baris
            </Button>
          </div>

          {/* Column header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 36px", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "2px solid var(--border)", marginBottom: "0.5rem" }}>
            {["Akun", "Keterangan", "Debit (Rp)", "Kredit (Rp)", ""].map((h) => (
              <div key={h} style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--grey)" }}>{h}</div>
            ))}
          </div>

          {lines.map((line, index) => (
            <div key={index} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 1fr 1fr 36px", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <AccountPicker value={line.account_id ?? ""} onChange={(v) => updateLine(index, { account_id: v ? Number(v) : null })} placeholder="Pilih akun..." />
              <input
                className="input"
                value={line.description ?? ""}
                onChange={(e) => updateLine(index, { description: e.target.value })}
                placeholder="Keterangan baris..."
                style={{ fontSize: "0.82rem" }}
              />
              <input
                className="input"
                type="number"
                min="0"
                value={line.debit || ""}
                onChange={(e) => updateLine(index, { debit: Number(e.target.value) || 0, credit: 0 })}
                placeholder="0"
                style={{ fontFamily: "monospace", fontSize: "0.82rem", textAlign: "right" }}
              />
              <input
                className="input"
                type="number"
                min="0"
                value={line.credit || ""}
                onChange={(e) => updateLine(index, { credit: Number(e.target.value) || 0, debit: 0 })}
                placeholder="0"
                style={{ fontFamily: "monospace", fontSize: "0.82rem", textAlign: "right" }}
              />
              {lines.length > 2 && (
                <button
                  type="button"
                  onClick={() => setLines((p) => p.filter((_, i) => i !== index))}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "var(--grey)", display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 6 }}
                >
                  ✕
                </button>
              )}
              {lines.length <= 2 && <div />}
            </div>
          ))}

          {/* Balance checker */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--grey)" }}>
              Total Debit: <strong>{formatCurrency(totalDebit)}</strong>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--grey)" }}>
              Total Kredit: <strong>{formatCurrency(totalCredit)}</strong>
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: isBalanced ? "var(--good)" : "var(--bad)" }}>
              Selisih: {difference === 0 ? "✅ Balanced" : formatCurrency(difference)}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
