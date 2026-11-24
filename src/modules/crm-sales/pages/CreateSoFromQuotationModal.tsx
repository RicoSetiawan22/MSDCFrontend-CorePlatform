import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";
import { useCreateSalesOrderFromQuotation } from "../api/useSalesOrders";
import { Button } from "@shared/components/Button";
import { CrmModalShell } from "./CreateContractFromQuotationModal";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError } from "@shared/types/api";

export function CreateSoFromQuotationModal({ quotationId, quotationNumber, onClose }: {
  quotationId: number; quotationNumber: string; onClose: () => void;
}) {
  const navigate = useNavigate();
  const create = useCreateSalesOrderFromQuotation();
  const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);

  async function handle() {
    try {
      await create.mutateAsync(quotationId);
      navigate("/crm-sales/sales-orders");
    } catch (err) {
      const seq = extractNumberSequenceError(err);
      if (seq) { setSeqError(seq); return; }
      alert(extractErrorMessage(err));
    }
  }

  return (
    <CrmModalShell title="Konversi ke Sales Order" onClose={onClose} maxWidth={420}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", textAlign: "center", padding: "0.5rem 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={24} color="#7c3aed" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
            Buat Sales Order dari Quotation?
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--grey)" }}>
            Quotation <strong style={{ fontFamily: "monospace" }}>{quotationNumber}</strong> akan dikonversi menjadi Sales Order. Item dan nilai akan disalin otomatis.
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", width: "100%" }}>
          <Button onClick={handle} disabled={create.isPending} style={{ flex: 1 }}>
            {create.isPending ? "Memproses..." : "Buat Sales Order"}
          </Button>
          <Button variant="secondary" onClick={onClose} style={{ flex: 1 }}>Batal</Button>
        </div>
      </div>

      {seqError && (
        <NumberSequenceSetupModal
          moduleCode={seqError.module_code}
          suggestedPrefix={seqError.suggested_prefix}
          suggestedFormat={seqError.suggested_format}
          lockModuleCode
          onClose={() => setSeqError(null)}
          onCreated={() => { setSeqError(null); create.mutateAsync(quotationId).then(() => navigate("/crm-sales/sales-orders")).catch((err) => alert(extractErrorMessage(err))); }}
        />
      )}
    </CrmModalShell>
  );
}
