import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { FileCheck, X } from "lucide-react";
import { useCreateContractFromQuotation } from "../api/useContracts";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { NumberSequenceSetupModal } from "@modules/core-platform/components/NumberSequenceSetupModal";
import { extractErrorMessage, extractNumberSequenceError, type NumberSequenceNotConfiguredError } from "@shared/types/api";
import type { ContractFromQuotationValues } from "../types/contract";
import { MSDC_PDF_LOGO } from "../lib/pdfBrand";

/** Popup CRM yang stabil. Portal memastikan posisi tidak berubah walau tombol berada
 * di dalam grid/card/table, serta menjaga header popup konsisten. */
export function CrmModalShell({ title, onClose, children, maxWidth = 600 }: {
  title: string; onClose: () => void; children: ReactNode; maxWidth?: number;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, boxSizing: "border-box", background: "rgba(9,39,71,.56)" }}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ display: "flex", flexDirection: "column", width: "100%",
        maxWidth, maxHeight: "calc(100vh - 40px)", overflow: "hidden", background: "#fff", borderRadius: 16,
        boxShadow: "0 20px 60px rgba(9,39,71,.25)" }}>
        <header style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 16, padding: "18px 24px 18px 28px",
          background: "#092747", color: "#fff", borderBottom: "4px solid #F7AB00", width: "100%", boxSizing: "border-box" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, marginBottom: 3, opacity: .8 }}>CRM &amp; SALES</div>
            <strong style={{ display: "block", fontSize: 15, lineHeight: 1.3 }}>{title}</strong>
          </div>
          <img src={MSDC_PDF_LOGO} alt="MSDC Surabaya" style={{ width: 108, height: 58, flexShrink: 0, objectFit: "contain" }}/>
          <button type="button" aria-label="Tutup popup" onClick={onClose} title="Tutup" style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, padding: 0, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 8, color: "#fff", cursor: "pointer" }}>
            <X size={17}/>
          </button>
        </header>
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", padding: "22px 28px 24px", color: "#16213d", background: "#fff" }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

/** Alur BARU: begitu Quotation 'accepted', langkah selanjutnya adalah buat
 * Contract dulu (BUKAN langsung Sales Order) - Contract ini yang nanti
 * dijalankan lewat approval Finance->Legal, tanda tangan klien, baru
 * rack/resource dikunci dan SO diterbitkan otomatis. Lihat
 * ContractManagementService::createFromQuotation(). */
export function CreateContractFromQuotationModal({ quotationId, quotationNumber, onClose }: {
  quotationId: number; quotationNumber: string; onClose: () => void;
}) {
  const navigate = useNavigate();
  const create = useCreateContractFromQuotation();
  const [seqError, setSeqError] = useState<NumberSequenceNotConfiguredError | null>(null);
  // start_date default hari ini (sama dengan fallback backend kalau tidak
  // diisi - lihat ContractManagementService::createFromQuotation()) supaya
  // field-nya tidak kosong pas modal dibuka. end_date SENGAJA kosong -
  // opsional, kontrak tanpa batas waktu (mis. auto_renew) tetap valid.
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  function buildPayload(): ContractFromQuotationValues {
    return {
      quotation_id: quotationId,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
  }

  async function handle() {
    setDateError(null);
    if (endDate && startDate && endDate <= startDate) {
      setDateError("Tanggal berakhir harus setelah tanggal mulai.");
      return;
    }
    try {
      const contract = await create.mutateAsync(buildPayload());
      navigate(`/crm-sales/contracts/${contract.id}`);
    } catch (err) {
      const seq = extractNumberSequenceError(err);
      if (seq) { setSeqError(seq); return; }
      alert(extractErrorMessage(err));
    }
  }

  return (
    <CrmModalShell title={`Buat Contract dari Quotation ${quotationNumber}`} onClose={onClose} maxWidth={590}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", textAlign: "center", padding: "0.5rem 0" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileCheck size={24} color="#16a34a" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.4rem" }}>
            Buat Contract dari Quotation?
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--grey)" }}>
            Quotation <strong style={{ fontFamily: "monospace" }}>{quotationNumber}</strong> akan dikonversi menjadi Contract. Layanan akan disalin otomatis - Sales Order baru diterbitkan otomatis setelah Contract disetujui (Finance → Legal), ditandatangani klien, dan resource/rack dikunci.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", width: "100%", textAlign: "left" }}>
          <InputField label="Periode Mulai *" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <InputField label="Periode Berakhir" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} hint="Opsional - kosongkan kalau tanpa batas waktu" />
        </div>
        {dateError && <div className="input-error" style={{ width: "100%", textAlign: "left" }}>{dateError}</div>}

        <div style={{ display: "flex", gap: "0.6rem", width: "100%" }}>
          <Button onClick={handle} disabled={create.isPending} style={{ flex: 1 }}>
            {create.isPending ? "Memproses..." : "Buat Contract"}
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
          onCreated={() => {
            setSeqError(null);
            create.mutateAsync(buildPayload())
              .then((contract) => navigate(`/crm-sales/contracts/${contract.id}`))
              .catch((err) => alert(extractErrorMessage(err)));
          }}
        />
      )}
    </CrmModalShell>
  );
}
