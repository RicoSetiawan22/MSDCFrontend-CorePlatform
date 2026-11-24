import { useState, type FormEvent } from "react";
import { FileText } from "lucide-react";
import { useDownloadGeneralJournalPdf } from "../api/useGlJournals";
import { useActiveOrgId } from "@shared/lib/organization-context";
import { Button } from "@shared/components/Button";
import { InputField } from "@shared/components/InputField";
import { Modal } from "@shared/components/Modal";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { extractErrorMessage } from "@shared/types/api";

interface PrintGeneralJournalModalProps {
  /** Tanggal dari filter halaman JournalListPage (opsional, agar modal pre-filled) */
  initialDateFrom?: string;
  initialDateTo?: string;
  onClose: () => void;
}

export function PrintGeneralJournalModal({
  initialDateFrom,
  initialDateTo,
  onClose,
}: PrintGeneralJournalModalProps) {
  const activeOrgId = useActiveOrgId();
  const [dateFrom, setDateFrom] = useState(initialDateFrom ?? "");
  const [dateTo, setDateTo] = useState(initialDateTo ?? "");
  const [status, setStatus] = useState<"posted" | "draft" | "reversed" | "">("");
  const [error, setError] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const downloadMutation = useDownloadGeneralJournalPdf();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!activeOrgId) {
      setError("Pilih organisasi aktif dari tombol di header halaman sebelum mencetak.");
      return;
    }
    try {
      const blob = await downloadMutation.mutateAsync({ dateFrom, dateTo, organizationId: activeOrgId, status: status || undefined });
      if (blob) setPreviewBlob(blob);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (previewBlob) {
    return (
      <PdfPreviewModal
        title="Jurnal Umum"
        blob={previewBlob}
        filename={`jurnal-umum_${dateFrom}_sd_${dateTo}.pdf`}
        onClose={onClose}
      />
    );
  }

  return (
    <Modal title="Cetak Jurnal Umum (PDF)" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: "0.82rem", color: "var(--grey-dark)", marginBottom: "1rem" }}>
          PDF resmi dengan kop surat perusahaan — pratinjau dulu sebelum mencetak atau menyimpan.
          Organisasi menyesuaikan dengan cabang yang aktif dipilih di header halaman.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <InputField
            label="Dari Tanggal *"
            type="date"
            required
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <InputField
            label="Sampai Tanggal *"
            type="date"
            required
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label className="input-label" style={{ marginBottom: "0.2rem", display: "block" }}>Status</label>
          <select className="input" style={{ width: "100%" }} value={status} onChange={(e) => setStatus(e.target.value as any)}>
            <option value="">Semua Status</option>
            <option value="posted">Posted</option>
            <option value="draft">Draft</option>
            <option value="reversed">Reversed</option>
          </select>
        </div>

        {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <Button type="submit" disabled={downloadMutation.isPending}>
            <FileText size={15} />
            {downloadMutation.isPending ? "Membuat PDF..." : "Pratinjau PDF"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>Batal</Button>
        </div>
      </form>
    </Modal>
  );
}
