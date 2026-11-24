import React from "react";
import {
  ArrowLeft,
  FileText,
  FileSignature,
  Send,
  Download,
  Upload,
  Printer,
  Pencil,
  CheckCircle2,
  Clock,
  AlertCircle,
  Archive,
} from "lucide-react";
import type { DocumentDetail, DocumentStatus } from "@modules/document-management/types/document";

export interface SuratDcOpsDetailHeroProps {
  document: DocumentDetail;
  typeLabel: string;
  requiresApproval: boolean;
  canSignCreator: boolean;
  isSigning: boolean;
  isSubmitting: boolean;
  isAttaching: boolean;
  isDownloading: boolean;
  onBack: () => void;
  onEdit?: () => void;
  onSign: () => void;
  onSubmitApproval: () => void;
  onPreviewPdf: () => void;
  onTriggerAttach: () => void;
  onPrint: () => void;
}

const STATUS_BADGES: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  draft: {
    label: "DRAFT",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: <Clock size={13} />,
  },
  pending_approval: {
    label: "MENUNGGU APPROVAL",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    icon: <Clock size={13} className="text-amber-600 animate-pulse" />,
  },
  approved: {
    label: "DISETUJUI / RESMI",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    icon: <CheckCircle2 size={13} className="text-emerald-600" />,
  },
  rejected: {
    label: "DITOLAK",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    icon: <AlertCircle size={13} className="text-rose-600" />,
  },
  archived: {
    label: "DIARSIPKAN",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    icon: <Archive size={13} className="text-indigo-600" />,
  },
};

export const SuratDcOpsDetailHero: React.FC<SuratDcOpsDetailHeroProps> = ({
  document,
  typeLabel,
  requiresApproval,
  canSignCreator,
  isSigning,
  isSubmitting,
  isAttaching,
  isDownloading,
  onBack,
  onEdit,
  onSign,
  onSubmitApproval,
  onPreviewPdf,
  onTriggerAttach,
  onPrint,
}) => {
  const statusConfig = STATUS_BADGES[document.status] ?? STATUS_BADGES.draft;
  const isSigned = Boolean(document.file?.is_signed || document.creator_signed_at);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
      {/* ── Baris 1: Nomor Surat, Title, Badges & Tombol Kembali ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <FileText size={18} />
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                {document.document_number}
              </h1>
            </div>

            {/* Status Badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
            >
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </span>

            {/* Tanda Tangan Badge */}
            {isSigned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={12} className="text-emerald-600" />
                <span>Terverifikasi Digital</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span>Belum TTD Lengkap</span>
              </span>
            )}
          </div>

          {/* Title & Type */}
          <div className="flex flex-col mt-0.5">
            <span className="text-base sm:text-lg font-bold text-slate-800 leading-snug">
              {document.title}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
              {typeLabel} • Ditujukan kepada:{" "}
              <strong className="text-slate-700">
                {document.issued_to_name || "Pihak Terkait"}
              </strong>
            </span>
          </div>
        </div>

        {/* Tombol Navigasi Kembali */}
        <div className="self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowLeft size={14} className="text-slate-500" />
            <span>Kembali ke Daftar</span>
          </button>
        </div>
      </div>

      {/* ── Baris 2: Toolbar Tombol Aksi Surat Resmi ── */}
      <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-slate-100">
        {/* Edit Draf Dokumen */}
        {document.status === "draft" && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Pencil size={13} className="text-amber-600" />
            <span>Edit Dokumen</span>
          </button>
        )}

        {/* Tanda Tangani Pembuat */}
        {document.status === "draft" && !document.creator_signed_at && canSignCreator && (
          <button
            type="button"
            onClick={onSign}
            disabled={isSigning}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
          >
            <FileSignature size={14} />
            <span>{isSigning ? "Menandatangani..." : "Tanda Tangani (Pembuat)"}</span>
          </button>
        )}

        {/* Ajukan Approval */}
        {document.status === "draft" && (
          <button
            type="button"
            onClick={onSubmitApproval}
            disabled={isSubmitting || !document.creator_signed_at}
            title={
              !document.creator_signed_at
                ? "Surat harus ditandatangani pembuat terlebih dahulu sebelum diajukan."
                : undefined
            }
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 ${
              document.creator_signed_at
                ? "bg-[#E59B00] hover:bg-[#d48f00] text-white hover:shadow"
                : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
            }`}
          >
            <Send size={14} />
            <span>
              {isSubmitting
                ? "Memproses..."
                : requiresApproval
                ? "Ajukan Approval"
                : "Selesaikan Surat"}
            </span>
          </button>
        )}

        {/* Preview / Unduh PDF */}
        {document.file_id && (
          <button
            type="button"
            onClick={onPreviewPdf}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <Download size={14} className="text-slate-500" />
            <span>
              {isDownloading
                ? "Memuat Berkas..."
                : document.file?.mime_type === "application/pdf"
                ? "Lihat / Unduh PDF"
                : "Unduh Berkas Surat"}
            </span>
          </button>
        )}

        {/* Lampirkan File */}
        <button
          type="button"
          onClick={onTriggerAttach}
          disabled={isAttaching}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Upload size={14} className="text-slate-500" />
          <span>{isAttaching ? "Mengunggah..." : "Unggah Lampiran"}</span>
        </button>

        {/* Cetak */}
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Printer size={14} className="text-slate-500" />
          <span>Cetak Dokumen</span>
        </button>
      </div>
    </div>
  );
};

export default SuratDcOpsDetailHero;
