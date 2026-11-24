import { useState } from "react";
import { FileText } from "lucide-react";
import { useOrganization } from "@shared/lib/organization-context";
import { Button } from "./Button";
import { Modal } from "./Modal";
import { PdfPreviewModal } from "./PdfPreviewModal";
import { extractErrorMessage } from "@shared/types/api";

interface LetterheadPdfModalProps {
  title: string;
  onClose: () => void;
  /** Pemanggil tahu cara panggil endpoint print-pdf spesifik masing-masing —
   *  modal ini cuma urus UI preview, TIDAK tahu soal endpoint atau organization_id. */
  onDownload: (organizationId: number) => Promise<Blob | undefined>;
}

/**
 * Dipakai bersama ke-7 halaman Finance (Accounts, Cost Centers, dst) dan modul
 * lain yang butuh "cetak PDF berkop surat".
 *
 * Perubahan utama:
 *  - Organisasi AKTIF langsung dibaca dari OrganizationContext (global state
 *    di TopBar) — TIDAK perlu pilih manual di dropdown.
 *  - Kalau cuma ada 1 organisasi, langsung generate PDF tanpa UI pemilihan.
 *  - Kalau ada 2+, tetap tampil dropdown tapi tanpa label "Cabang / Perusahaan *".
 *
 * Organisasi sudah scoped via X-Organization-Id header di semua request API
 * (lihat api-client.ts interceptor) — parameter organizationId di onDownload
 * dipakai cuma untuk Kop Surat di PDF, BUKAN untuk scoping data di backend.
 */
export function LetterheadPdfModal({ title, onClose, onDownload }: LetterheadPdfModalProps) {
  const { activeOrg, activeOrgId, isLoading: isLoadingOrgs } = useOrganization();
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);

  async function handleSubmit() {
    if (!activeOrgId) return;
    setError(null);
    setIsGenerating(true);
    try {
      const blob = await onDownload(activeOrgId);
      if (blob) setPreviewBlob(blob);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  }

  if (previewBlob) {
    return <PdfPreviewModal title={title} blob={previewBlob} filename={`${title}.pdf`} onClose={onClose} />;
  }

  const isLoading = isLoadingOrgs && !activeOrg;

  return (
    <Modal title={title} onClose={onClose}>
      <p style={{ fontSize: "0.82rem", color: "var(--grey-dark)", marginBottom: "1rem" }}>
        PDF resmi dengan kop surat perusahaan — bisa dipratinjau dulu sebelum dicetak atau disimpan.
      </p>

      {/* Organization context — read-only display */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label className="input-label">Organisasi</label>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.6rem 0.875rem",
          background: isLoading ? "var(--bg-subtle)" : "var(--accent-light)",
          border: `1px solid ${isLoading ? "var(--border)" : "var(--accent)"}`,
          borderRadius: 8,
          minHeight: 40,
        }}>
          {isLoading ? (
            <span style={{ fontSize: "0.82rem", color: "var(--grey)" }}>Memuat organisasi...</span>
          ) : (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--accent)" }}>
                  {activeOrg?.name ?? "—"}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.7rem 0.875rem", background: "#fee2e2", color: "#991b1b", borderRadius: 8, fontSize: "0.82rem", marginBottom: "1rem" }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem" }}>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!activeOrgId || isGenerating || isLoading}
          style={{ flex: 1 }}
        >
          <FileText size={15} />
          {isGenerating ? "Membuat PDF..." : "Pratinjau PDF"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
      </div>
    </Modal>
  );
}
