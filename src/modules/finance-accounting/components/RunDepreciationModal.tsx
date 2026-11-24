import { useState } from "react";
import { CheckCircle2, SkipForward, TrendingDown } from "lucide-react";
import { useRunDepreciation } from "../api/useFixedAssets";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput } from "@shared/components/ui/FormKit";
import { formatCurrency } from "@shared/lib/format";
import { extractErrorMessage } from "@shared/types/api";
import type { RunDepreciationResult } from "../types/depreciation";

interface RunDepreciationModalProps {
  onClose: () => void;
}

export function RunDepreciationModal({ onClose }: RunDepreciationModalProps) {
  const [periodDate, setPeriodDate] = useState("");
  const [assetId, setAssetId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunDepreciationResult | null>(null);
  const runMutation = useRunDepreciation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await runMutation.mutateAsync({ periodDate, assetId: assetId ? Number(assetId) : undefined });
      setResult(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (result) {
    return (
      <Modal title={`📉 Hasil Depresiasi — ${result.period}`} onClose={onClose} maxWidth={560}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ textAlign: "center", padding: "1rem", borderRadius: 12, background: "#d9f2e6" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d" }}>{result.entries_created}</div>
            <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Aset Diproses</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem", borderRadius: 12, background: "#ede9fe" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#7c3aed", fontFamily: "monospace" }}>{formatCurrency(result.total_depreciation)}</div>
            <div style={{ fontSize: "0.72rem", color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total Beban</div>
          </div>
        </div>

        {result.journal_numbers.length > 0 && (
          <div style={{ background: "#f9fafb", border: "1px solid var(--border)", borderRadius: 8, padding: "0.7rem 0.875rem", fontSize: "0.78rem", color: "var(--grey)", marginBottom: "1rem" }}>
            {result.journal_numbers.length} jurnal GL dibuat (per cost center): <strong style={{ fontFamily: "monospace", color: "var(--accent)" }}>{result.journal_numbers.join(", ")}</strong>
          </div>
        )}

        {(result.entries.length > 0 || result.skipped.length > 0) && (
          <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
            {result.entries.map((entry, i) => (
              <div key={`e-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.875rem", borderBottom: i < result.entries.length - 1 ? "1px solid var(--border)" : "none" }}>
                <CheckCircle2 size={15} color="#15803d" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: "0.8rem" }}>
                  Beban {formatCurrency(entry.amount)} — Nilai buku baru {formatCurrency(entry.book_value_after)}
                </div>
              </div>
            ))}
            {result.skipped.map((s, i) => (
              <div key={`s-${i}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.875rem", borderBottom: i < result.skipped.length - 1 ? "1px solid var(--border)" : "none", background: "#fef3c7" }}>
                <SkipForward size={15} color="#92400e" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: "0.8rem", color: "#92400e" }}>
                  <strong style={{ fontFamily: "monospace" }}>{s.asset_number}</strong> — {s.reason}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onClose} style={{ width: "100%", marginTop: "1.25rem" }}>Tutup</Button>
      </Modal>
    );
  }

  return (
    <Modal title="📉 Jalankan Depresiasi Bulanan" onClose={onClose} maxWidth={480}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#ede9fe", padding: "0.875rem", borderRadius: 10, marginBottom: "1.25rem", fontSize: "0.82rem", color: "#7c3aed" }}>
        <TrendingDown size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          Hitung & posting beban depresiasi untuk semua aset <strong>in-service</strong>.
          Aset yang <strong>sudah diproses</strong> di periode sama akan dilewati otomatis — idempotent.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <FormInput
          label="Periode (Bulan) *"
          type="date"
          required
          value={periodDate}
          onChange={(e) => setPeriodDate(e.target.value)}
        />
        <FormInput
          label="Asset ID (opsional)"
          type="number"
          value={assetId}
          onChange={(e) => setAssetId(e.target.value)}
          placeholder="Kosongkan = jalankan SEMUA aset in-service"
          hint="Isi ID aset spesifik untuk test 1 aset saja"
        />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={runMutation.isPending} style={{ flex: 1 }}>
            {runMutation.isPending ? "Menjalankan..." : "📉 Jalankan Depresiasi"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
