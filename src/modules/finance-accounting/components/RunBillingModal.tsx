import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, SkipForward, XCircle } from "lucide-react";
import { useRunBilling } from "../api/useBillingContracts";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { FormInput } from "@shared/components/ui/FormKit";
import { extractErrorMessage } from "@shared/types/api";
import type { RunBillingResult } from "../types/billingRun";

interface RunBillingModalProps {
  onClose: () => void;
}

export function RunBillingModal({ onClose }: RunBillingModalProps) {
  const [periodDate, setPeriodDate] = useState("");
  const [contractId, setContractId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunBillingResult | null>(null);
  const runMutation = useRunBilling();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await runMutation.mutateAsync({ periodDate, contractId: contractId ? Number(contractId) : undefined });
      setResult(res);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (result) {
    return (
      <Modal title={`📋 Hasil Billing — ${result.period}`} onClose={onClose} maxWidth={560}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div style={{ textAlign: "center", padding: "1rem", borderRadius: 12, background: "#d9f2e6" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d" }}>{result.success}</div>
            <div style={{ fontSize: "0.72rem", color: "#15803d", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Berhasil</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem", borderRadius: 12, background: "#fef3c7" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#92400e" }}>{result.skipped}</div>
            <div style={{ fontSize: "0.72rem", color: "#92400e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Dilewati</div>
          </div>
          <div style={{ textAlign: "center", padding: "1rem", borderRadius: 12, background: "#fee2e2" }}>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#991b1b" }}>{result.failed}</div>
            <div style={{ fontSize: "0.72rem", color: "#991b1b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>Gagal</div>
          </div>
        </div>

        {/* Log entries */}
        <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
          {result.logs.map((log, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.7rem 0.9rem", borderBottom: i < result.logs.length - 1 ? "1px solid var(--border)" : "none" }}>
              {log.status === "success"  && <CheckCircle2 size={16} color="#15803d" style={{ flexShrink: 0, marginTop: 1 }} />}
              {log.status === "skipped"   && <SkipForward  size={16} color="#92400e" style={{ flexShrink: 0, marginTop: 1 }} />}
              {log.status === "failed"   && <XCircle      size={16} color="#991b1b" style={{ flexShrink: 0, marginTop: 1 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, fontFamily: "monospace", marginBottom: "0.15rem" }}>{log.contract_number}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--grey)" }}>
                  {log.status === "success" ? (
                    <>Draft invoice <strong style={{ fontFamily: "monospace" }}>{log.invoice_number}</strong> berhasil dibuat - review &amp; posting di <Link to="/finance/integration/ar" style={{ color: "var(--accent)", fontWeight: 600 }}>AR Integration</Link></>
                  ) : log.message}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={onClose} style={{ width: "100%", marginTop: "1.25rem" }}>Tutup</Button>
      </Modal>
    );
  }

  return (
    <Modal title="⚡ Jalankan Billing Bulanan" onClose={onClose} maxWidth={480}>
      {/* Info section */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "#dbeafe", padding: "0.875rem", borderRadius: 10, marginBottom: "1.25rem", fontSize: "0.82rem", color: "#1d4ed8" }}>
        <CalendarCheck size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          Generate <strong>draft</strong> invoice AR otomatis untuk semua kontrak aktif pada periode ini - belum masuk piutang/jurnal GL sampai direview &amp; diposting Finance lewat AR Integration.
          Kontrak yang <strong>sudah ditagih</strong> di periode yang sama akan <strong>dilewati otomatis</strong> — tidak dobel.
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
          label="Contract ID (opsional)"
          type="number"
          value={contractId}
          onChange={(e) => setContractId(e.target.value)}
          placeholder="Kosongkan = jalankan SEMUA kontrak aktif"
          hint="Isi ID kontrak spesifik untuk test 1 kontrak saja"
        />

        {error && (
          <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem" }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={runMutation.isPending} style={{ flex: 1 }}>
            {runMutation.isPending ? "Menjalankan..." : "⚡ Jalankan Billing"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
