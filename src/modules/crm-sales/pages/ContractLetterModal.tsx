import { useEffect, useState } from "react";
import { apiClient } from "@shared/lib/api-client";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { CrmPdfPreviewModal } from "../components/CrmPdfPreviewModal";
import { contractApi } from "../api/contractApi";
import { extractErrorMessage } from "@shared/types/api";
import type { ContractDetail } from "../types/contract";

/** Keputusan final: satu PDF backend resmi, tanpa editor nama/jabatan signer. */
export function ContractLetterModal({ contract, onClose }: { contract: ContractDetail; onClose: () => void }) {
  const organizationId = useActiveOrgId();
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!organizationId) { setError("Pilih organisasi aktif terlebih dahulu."); return; }
    let cancelled = false;
    apiClient.get(contractApi.printPdfUrl(contract.id, organizationId), { responseType: "blob" })
      .then(res => { if (!cancelled) setBlob(res.data as Blob); })
      .catch(err => { if (!cancelled) setError(extractErrorMessage(err)); });
    return () => { cancelled = true; };
  }, [contract.id, organizationId]);
  if (error) return <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", background: "#0009" }}>
    <div style={{ background: "white", borderRadius: 12, padding: 24, width: 380 }}><p>{error}</p><button onClick={onClose}>Tutup</button></div>
  </div>;
  if (!blob) return <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 10000, display: "grid", placeItems: "center", background: "#0009" }}>
    <div style={{ background: "white", borderRadius: 12, padding: 24 }}>Menyiapkan PDF Kontrak resmi... <button onClick={onClose}>Batal</button></div>
  </div>;
  return <CrmPdfPreviewModal blob={blob} filename={`Kontrak_${contract.contract_number}.pdf`} title={`Perjanjian & SLA ${contract.contract_number}`} onClose={onClose} />;
}
