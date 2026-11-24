import { useRef, useState } from "react";
import { Download, FileSignature, History, Send, Upload, Archive } from "lucide-react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { LoadingState } from "@shared/components/LoadingState";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ImagePreviewModal } from "@shared/components/ImagePreviewModal";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { formatDate } from "@shared/lib/format";
import { useAuth } from "@shared/lib/auth-context";
import { extractErrorMessage } from "@shared/types/api";
import {
  useDocument, useDocumentRevisions, useSubmitDocumentForApproval, useArchiveDocument, useAttachDocumentFile, useSignDocument, useDocumentTypes,
} from "../api/useDocuments";
import { documentApi } from "../api/documentApi";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_COLORS } from "../types/document";

export function DocumentDetailModal({ documentId, onClose }: { documentId: number; onClose: () => void }) {
  const { user } = useAuth();
  const { data: document, isLoading } = useDocument(documentId);
  const { data: revisions } = useDocumentRevisions(documentId);
  const { data: types } = useDocumentTypes();
  // Jenis surat ini butuh approval atasan atau tidak (meta.requires_approval,
  // diatur di Core Platform > Kelola Jenis Surat) - default true kalau
  // belum diset, sama seperti default backend-nya (lihat
  // DocumentService::typeRequiresApproval()).
  const requiresApproval = types?.find(t => t.code === document?.document_type)?.meta.requires_approval ?? true;
  const submit = useSubmitDocumentForApproval();
  const attachFile = useAttachDocumentFile();
  const signDocument = useSignDocument();
  const archiveDocument = useArchiveDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [imagePreview, setImagePreview] = useState<{ blob: Blob; filename: string } | null>(null);
  const [downloading, setDownloading] = useState(false);

  function handleSubmit() {
    setError(null);
    submit.mutate(documentId, { onError: e => setError(extractErrorMessage(e)) });
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    attachFile.mutate({ id: documentId, file }, { onError: err => setError(extractErrorMessage(err)) });
    e.target.value = "";
  }

  // TIDAK digate ke document?.file_id seperti dulu - surat baru (draft,
  // belum pernah generatePdf()) MEMANG file_id-nya masih null, tanda
  // tangan pembuat (signAsCreator()) justru yang men-generate PDF pertama
  // kalinya (lihat DocumentService::signAsCreator()).
  function handleArchiveDirectly() {
    if (confirm("Arsipkan surat ini langsung sebagai arsip permanen tanpa alur approval?")) {
      setError(null);
      archiveDocument.mutate(documentId, {
        onError: (err) => setError(extractErrorMessage(err)),
      });
    }
  }

  function handleSign() {
    setError(null);
    signDocument.mutate(documentId, { onError: e => setError(extractErrorMessage(e)) });
  }

  /** File di file_id BUKAN selalu PDF hasil generate - "Lampirkan File"
   * (attachFile) sekarang dibatasi PDF/gambar saja (lihat accept di input
   * file bawah + validasi mimes di backend), jadi selalu bisa ditampilkan
   * inline: PDF lewat PdfPreviewModal, gambar lewat ImagePreviewModal.
   * Fallback download tetap ada untuk file lama (sebelum pembatasan ini)
   * yang tipenya bukan keduanya. */
  async function handlePreviewPdf() {
    if (!document?.file_id) return;
    setDownloading(true);
    setError(null);
    try {
      const res = await documentApi.downloadFile(document.file_id);
      const blob = res.data as Blob;
      const filename = document.file?.original_name ?? `${document.document_number.replace(/\//g, "-")}`;
      if (document.file?.mime_type === "application/pdf") {
        setPdfPreview({ blob, filename: `${document.document_number.replace(/\//g, "-")}.pdf` });
      } else if (document.file?.mime_type?.startsWith("image/")) {
        setImagePreview({ blob, filename });
      } else {
        downloadBlobAsFile(blob, filename);
      }
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Modal title={document ? `${document.document_number}` : "Detail Surat"} onClose={onClose} maxWidth={640}>
        {isLoading || !document ? <LoadingState /> : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{document.title}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--grey)", marginTop: 2 }}>
                  {document.issued_date ? formatDate(document.issued_date) : "—"}
                  {document.issued_to_name && <> · {document.issued_to_name}</>}
                </div>
              </div>
              <span style={{
                fontSize: "0.72rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: 20, whiteSpace: "nowrap",
                background: DOCUMENT_STATUS_COLORS[document.status].bg, color: DOCUMENT_STATUS_COLORS[document.status].color,
              }}>
                {DOCUMENT_STATUS_LABELS[document.status]}
              </span>
            </div>

            <div style={{
              border: "1px solid var(--border)", borderRadius: 8, padding: "1rem 1.1rem", background: "var(--bg-subtle)",
              maxHeight: 280, overflowY: "auto", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "1rem",
            }}>
              {document.body_html
                ? <div dangerouslySetInnerHTML={{ __html: document.body_html }} />
                : <div style={{ color: "var(--grey)", fontStyle: "italic" }}>Tidak ada isi teks — lihat lampiran file.</div>}
            </div>

            {document.file && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", fontSize: "0.82rem", flexWrap: "wrap" }}>
                <span>📎 {document.file.original_name}</span>
              </div>
            )}
            {document.status === "archived" && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem 0.9rem",
                borderRadius: 8, background: "#faf5ff", border: "1px solid #e9d5ff", color: "#581c87",
                fontSize: "0.78rem", lineHeight: 1.5, marginBottom: "1rem"
              }}>
                <Archive size={16} style={{ color: "#9333ea", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontWeight: 700, color: "#6b21a8" }}>Arsip Surat Fisik / Surat Lama</div>
                  <div>Dokumen ini tersimpan dalam arsip permanen dan telah selesai tanpa memerlukan alur approval atau tanda tangan berjenjang.</div>
                </div>
              </div>
            )}

            {/* Dua stempel independen - "Dibuat oleh" wajib ada sebelum surat
                bisa diajukan approval (lihat tombol Ajukan Approval di bawah),
                "Mengetahui" terisi otomatis begitu manager approve. */}
            {(document.creator_signed_at || document.approver_signed_at) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: "1rem", fontSize: "0.78rem" }}>
                {document.creator_signed_at && (
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ Ditandatangani Pembuat ({formatDate(document.creator_signed_at)})</span>
                )}
                {document.approver_signed_at && (
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>✓ Disetujui & Ditandatangani Manager ({formatDate(document.approver_signed_at)})</span>
                )}
                {!requiresApproval && document.status === "approved" && !document.approver_signed_at && (
                  <span style={{ color: "var(--grey)", fontStyle: "italic" }}>Jenis surat ini tidak memerlukan approval atasan - selesai begitu ditandatangani pembuat.</span>
                )}
              </div>
            )}

            {error && <div className="input-error" style={{ marginBottom: "1rem" }}>{error}</div>}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: "1rem" }}>
              {document.status === "draft" && (
                <Button
                  onClick={handleSubmit}
                  disabled={submit.isPending || !document.creator_signed_at}
                  title={!document.creator_signed_at ? "Surat harus ditandatangani pembuat terlebih dahulu" : undefined}
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Send size={14} /> {submit.isPending ? "Memproses..." : requiresApproval ? "Ajukan Approval" : "Selesaikan Surat"}
                </Button>
              )}
              {document.status === "draft" && (
                <Button
                  variant="secondary"
                  onClick={handleArchiveDirectly}
                  disabled={archiveDocument.isPending}
                  title="Simpan langsung surat ini ke arsip permanen tanpa alur approval"
                  style={{ display: "flex", alignItems: "center", gap: 4, color: "#7e22ce" }}
                >
                  <Archive size={14} /> {archiveDocument.isPending ? "Mengarsipkan..." : "Arsipkan Langsung"}
                </Button>
              )}
              {document.file_id && (
                <Button variant="secondary" onClick={handlePreviewPdf} disabled={downloading} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Download size={14} />
                  {downloading ? "Memuat..." : document.file?.mime_type === "application/pdf" ? "Lihat/Unduh PDF" : document.file?.mime_type?.startsWith("image/") ? "Lihat Gambar" : "Unduh File"}
                </Button>
              )}
              {document.status === "draft" && !document.creator_signed_at && document.created_by === user?.id && (
                <Button variant="secondary" onClick={handleSign} disabled={signDocument.isPending} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <FileSignature size={14} /> {signDocument.isPending ? "Menandatangani..." : "Tanda Tangani (Pembuat)"}
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={handleFileChosen} />
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={attachFile.isPending} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Upload size={14} /> {attachFile.isPending ? "Mengunggah..." : "Lampirkan File"}
              </Button>
              <Button variant="secondary" onClick={() => setShowHistory(v => !v)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <History size={14} /> Riwayat ({revisions?.length ?? 0})
              </Button>
            </div>

            {showHistory && (
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                {!revisions || revisions.length === 0 ? (
                  <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>Belum ada riwayat.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {revisions.map(r => (
                      <div key={r.id} style={{ fontSize: "0.78rem", display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <span>Rev {r.revision_number}: {r.change_note ?? "—"}</span>
                        <span style={{ color: "var(--grey)", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {pdfPreview && (
        <PdfPreviewModal title={document?.title ?? "Surat"} blob={pdfPreview.blob} filename={pdfPreview.filename} onClose={() => setPdfPreview(null)} />
      )}
      {imagePreview && (
        <ImagePreviewModal title={document?.title ?? "Surat"} blob={imagePreview.blob} filename={imagePreview.filename} onClose={() => setImagePreview(null)} />
      )}
    </>
  );
}
