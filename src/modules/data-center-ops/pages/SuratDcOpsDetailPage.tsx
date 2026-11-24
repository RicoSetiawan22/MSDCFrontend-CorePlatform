import { useRef, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@shared/components/PageHeader";
import { LoadingState } from "@shared/components/LoadingState";
import { PdfPreviewModal } from "@shared/components/PdfPreviewModal";
import { ImagePreviewModal } from "@shared/components/ImagePreviewModal";
import { downloadBlobAsFile } from "@shared/lib/downloadFile";
import { extractErrorMessage } from "@shared/types/api";
import { useAuth } from "@shared/lib/auth-context";
import {
  useDocument,
  useDocumentRevisions,
  useDocumentTypes,
  useSubmitDocumentForApproval,
  useSignDocument,
  useAttachDocumentFile,
} from "@modules/document-management/api/useDocuments";
import { documentApi } from "@modules/document-management/api/documentApi";
import {
  SuratDcOpsDetailBreadcrumb,
  SuratDcOpsDetailHero,
  SuratDcOpsViewerCard,
  SuratDcOpsInfoCard,
  SuratDcOpsWorkflowCard,
  SuratDcOpsRevisionsCard,
  SuratDcOpsEditModal,
} from "../components/surat";

export function SuratDcOpsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const documentId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const { user } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Queries ──
  const {
    data: document,
    isLoading,
    isError,
    error: queryError,
    refetch,
  } = useDocument(documentId);

  const { data: revisions, isLoading: isRevisionsLoading } =
    useDocumentRevisions(documentId);

  const { data: docTypes } = useDocumentTypes();

  // ── Mutations ──
  const submitApproval = useSubmitDocumentForApproval();
  const signDocument = useSignDocument();
  const attachFile = useAttachDocumentFile();

  // ── Local States ──
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);
  const [imagePreview, setImagePreview] = useState<{
    blob: Blob;
    filename: string;
  } | null>(null);

  // ── Lookup label jenis surat & aturan approval ──
  const selectedTypeMeta = useMemo(() => {
    if (!docTypes || !document) return null;
    return docTypes.find((t) => t.code === document.document_type) ?? null;
  }, [docTypes, document]);

  const typeLabel = selectedTypeMeta?.label || document?.document_type || "Dokumen Resmi";
  const requiresApproval = selectedTypeMeta?.meta.requires_approval ?? true;

  // Pembuat surat atau admin yang berhak tanda tangan di draf
  const canSignCreator =
    Boolean(user?.id) &&
    (document?.created_by === user?.id || !document?.created_by);

  // ── Handlers ──
  function handleSign() {
    if (!documentId) return;
    setActionError(null);
    signDocument.mutate(documentId, {
      onSuccess: () => refetch(),
      onError: (err) => setActionError(extractErrorMessage(err)),
    });
  }

  function handleSubmitApproval() {
    if (!documentId) return;
    setActionError(null);
    submitApproval.mutate(documentId, {
      onSuccess: () => refetch(),
      onError: (err) => setActionError(extractErrorMessage(err)),
    });
  }

  async function handlePreviewPdf() {
    if (!document?.file_id) return;
    setActionError(null);
    setDownloading(true);
    try {
      const res = await documentApi.downloadFile(document.file_id);
      const blob = res.data as Blob;
      const filename =
        document.file?.original_name ??
        `${document.document_number.replace(/\//g, "-")}.pdf`;

      if (document.file?.mime_type === "application/pdf") {
        setPdfPreview({ blob, filename });
      } else if (document.file?.mime_type?.startsWith("image/")) {
        setImagePreview({ blob, filename });
      } else {
        downloadBlobAsFile(blob, filename);
      }
    } catch (e) {
      setActionError(extractErrorMessage(e));
    } finally {
      setDownloading(false);
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !documentId) return;
    setActionError(null);
    attachFile.mutate(
      { id: documentId, file },
      {
        onSuccess: () => {
          if (fileInputRef.current) fileInputRef.current.value = "";
          refetch();
        },
        onError: (err) => setActionError(extractErrorMessage(err)),
      }
    );
  }

  // ── State Loading Skeleton ──
  if (isLoading && !document) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Surat & Dokumen Operasional"
          subtitle="Memuat naskah surat dan informasi tanda tangan digital..."
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-20 flex items-center justify-center">
          <LoadingState />
        </div>
      </div>
    );
  }

  // ── State Error / Not Found ──
  if (isError || !document) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] pb-16">
        <PageHeader
          title="Surat & Dokumen Operasional"
          subtitle="Tata naskah dinas dan berita acara operasional Data Center"
          containerClassName="px-7 pt-5 pb-2"
        />
        <div className="px-7 py-16 flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
            <AlertCircle size={28} />
          </div>
          <div className="flex flex-col gap-1 max-w-md">
            <h3 className="text-base font-bold text-slate-800">
              Dokumen Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500">
              {(queryError as Error)?.message ||
                "Nomor surat atau dokumen ini mungkin telah dihapus atau URL tidak valid."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dc/surat")}
            className="mt-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
          >
            ← Kembali ke Daftar Surat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] pb-16">
      {/* ── 1. Breadcrumb Navigasi Paling Atas ── */}
      <SuratDcOpsDetailBreadcrumb documentNumber={document.document_number} />

      {/* ── 2. Header Banner MSDC ── */}
      <PageHeader
        title="Detail Surat & Dokumen"
        subtitle="Verifikasi legalitas naskah dinas, status tanda tangan digital, dan riwayat revisi"
        containerClassName="px-7 pt-2 pb-2"
      />

      {/* ── 3. Konten Utama: Hero + Bento Grid 2 Kolom ── */}
      <div className="mx-7 mt-3 flex flex-col gap-6">
        {/* Pesan Error Aksi jika ada */}
        {actionError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0" />
              <span>{actionError}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hero Section */}
        <SuratDcOpsDetailHero
          document={document}
          typeLabel={typeLabel}
          requiresApproval={requiresApproval}
          canSignCreator={canSignCreator}
          isSigning={signDocument.isPending}
          isSubmitting={submitApproval.isPending}
          isAttaching={attachFile.isPending}
          isDownloading={downloading}
          onBack={() => navigate("/dc/surat")}
          onEdit={() => setShowEditModal(true)}
          onSign={handleSign}
          onSubmitApproval={handleSubmitApproval}
          onPreviewPdf={handlePreviewPdf}
          onTriggerAttach={() => fileInputRef.current?.click()}
          onPrint={() => window.print()}
        />

        {/* Hidden File Input untuk Unggah Lampiran */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={handleFileChosen}
        />

        {/* Bento Grid 2 Kolom Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Kolom Kiri (7 Kolom): Lembar Naskah Surat Resmi & Stempel TTD */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <SuratDcOpsViewerCard
              document={document}
              typeLabel={typeLabel}
              onPreviewPdf={handlePreviewPdf}
              isDownloading={downloading}
            />
          </div>

          {/* Kolom Kanan (5 Kolom): Metadata, Alur Approval, dan Riwayat Revisi */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <SuratDcOpsInfoCard document={document} typeLabel={typeLabel} />

            <SuratDcOpsWorkflowCard
              document={document}
              requiresApproval={requiresApproval}
            />

            <SuratDcOpsRevisionsCard
              revisions={revisions}
              isLoading={isRevisionsLoading}
            />
          </div>
        </div>
      </div>

      {/* ── Modal Pratinjau PDF & Gambar ── */}
      {pdfPreview && (
        <PdfPreviewModal
          title={document.title || "Surat Resmi"}
          blob={pdfPreview.blob}
          filename={pdfPreview.filename}
          onClose={() => setPdfPreview(null)}
        />
      )}

      {imagePreview && (
        <ImagePreviewModal
          title={document.title || "Surat Resmi"}
          blob={imagePreview.blob}
          filename={imagePreview.filename}
          onClose={() => setImagePreview(null)}
        />
      )}

      {/* ── Modal Edit Dokumen (Draft Only) ── */}
      {showEditModal && documentId && (
        <SuratDcOpsEditModal
          documentId={documentId}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default SuratDcOpsDetailPage;
