import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, AlertTriangle } from "lucide-react";
import { useCreateContractFromSalesOrder } from "../api/useContracts";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { formatCurrency } from "@shared/lib/format";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError } from "@shared/types/api";

function addYears(date: Date, years: number): string {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function CreateContractFromSoModal({ soId, soNumber, soTotalAmount, onClose }: {
  soId: number; soNumber: string; soTotalAmount: string; onClose: () => void;
}) {
  const navigate = useNavigate();
  const create = useCreateContractFromSalesOrder();
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(addYears(new Date(), 1));
  // Default = total SO, TAPI selalu diperlihatkan & wajib dikonfirmasi -
  // SO ini kemungkinan besar sudah punya 1 AR Invoice dari konfirmasi
  // client (CreateInvoiceFromSalesOrder). Kalau nilai ini dibiarkan sama
  // dengan total SO itu tanpa staf sadar, begitu Contract aktif & Billing
  // Integration jalan bulan ini juga, customer ditagih 2x untuk layanan
  // yang sama - lihat guard di ContractManagementService::createFromSalesOrder().
  const [monthlyValue, setMonthlyValue] = useState(soTotalAmount);
  const [error, setError] = useState<string | null>(null);
  const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);

  function submitOnce() {
    return create.mutateAsync({ salesOrderId: soId, startDate, endDate, monthlyValue: Number(monthlyValue) })
      .then(() => navigate("/crm-sales/contracts"));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await submitOnce();
    } catch (err) {
      const seq = extractNumberSequenceError(err);
      if (seq) { setSeqError(seq); return; }
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="Konversi ke Kontrak" onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", textAlign: "center", padding: "0.5rem 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={24} color="#16a34a" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
            Buat Kontrak dari Sales Order?
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--grey)" }}>
            SO <strong style={{ fontFamily: "monospace" }}>{soNumber}</strong> akan dikonversi menjadi kontrak. Layanan akan disalin dari SO ini.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.6rem 0.8rem", fontSize: "0.78rem", color: "#92400e", textAlign: "left" }}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Kalau SO ini sudah pernah ditagih (client sudah upload PO/approval), total SO <strong>{formatCurrency(Number(soTotalAmount))}</strong> itu SUDAH jadi 1 AR Invoice.
            Pastikan <strong>Nilai Bulanan Contract</strong> di bawah ini BUKAN nilai yang sama itu — kalau dibiarkan sama, customer akan ditagih dua kali untuk layanan yang sama begitu billing bulanan jalan.
          </span>
        </div>

        <div style={{ width: "100%", textAlign: "left" }}>
          <InputField label="Nilai Bulanan Contract (Rp) *" type="number" required min={0.01} step="any"
            value={monthlyValue} onChange={(e) => setMonthlyValue(e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", width: "100%", textAlign: "left" }}>
          <InputField label="Tanggal Mulai *" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <InputField label="Tanggal Berakhir *" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        {error && <div className="input-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem", width: "100%" }}>
          <Button type="submit" disabled={create.isPending} style={{ flex: 1 }}>
            {create.isPending ? "Memproses..." : "Buat Kontrak"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Batal</Button>
        </div>
      </form>

      {seqError && (
        <NumberSequenceSetupModal
          moduleCode={seqError.module_code}
          suggestedPrefix={seqError.suggested_prefix}
          suggestedFormat={seqError.suggested_format}
          lockModuleCode
          onClose={() => setSeqError(null)}
          onCreated={() => { setSeqError(null); submitOnce().catch((err) => setError(extractErrorMessage(err))); }}
        />
      )}
    </Modal>
  );
}
