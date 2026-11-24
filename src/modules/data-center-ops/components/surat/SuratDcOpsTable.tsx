import React from "react";
import {
  FileText,
  Calendar,
  CheckCircle2,
  Eye,
  Pencil,
} from "lucide-react";
import { formatDate } from "@shared/lib/format";
import type { DocumentListItem, DocumentStatus } from "@modules/document-management/types/document";

export interface SuratDcOpsTableProps {
  documents: DocumentListItem[];
  isLoading: boolean;
  onOpenDetail: (id: number) => void;
  onEditDocument?: (id: number) => void;
  documentTypeMap?: Record<string, string>;
}

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  pending_approval: {
    label: "Menunggu Approval",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  approved: {
    label: "Disetujui",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Ditolak",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  archived: {
    label: "Diarsipkan",
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
};

export const SuratDcOpsTable: React.FC<SuratDcOpsTableProps> = ({
  documents,
  isLoading,
  onOpenDetail,
  onEditDocument,
  documentTypeMap = {},
}) => {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FEF9EE] text-[#7A5800] border-b border-amber-200/60 font-bold uppercase text-[11px] tracking-wider">
            <tr>
              <th className="py-3.5 px-4">No. Surat</th>
              <th className="py-3.5 px-4">Judul Dokumen</th>
              <th className="py-3.5 px-4">Tujuan / Penerima</th>
              <th className="py-3.5 px-4">Tanggal Terbit</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Tanda Tangan</th>
              <th className="py-3.5 px-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="py-3.5 px-4">
                  <div className="h-4 w-28 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-44 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-32 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-24 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-20 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="h-6 w-16 bg-slate-100 rounded mx-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-12 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
          <FileText size={24} />
        </div>
        <div className="flex flex-col gap-1 max-w-sm">
          <span className="text-sm font-bold text-slate-800">
            Belum Ada Surat / Dokumen
          </span>
          <span className="text-xs text-slate-500">
            Tidak ada dokumen operasional Data Center Ops yang sesuai dengan kriteria pencarian atau filter saat ini.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#FEF9EE] text-[#7A5800] border-b border-amber-200/60 font-bold uppercase text-[11px] tracking-wider select-none">
          <tr>
            <th className="py-3.5 px-4">No. Surat</th>
            <th className="py-3.5 px-4">Judul Dokumen</th>
            <th className="py-3.5 px-4">Tujuan / Penerima</th>
            <th className="py-3.5 px-4">Tanggal Terbit</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4">Tanda Tangan</th>
            <th className="py-3.5 px-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {documents.map((doc) => {
            const status = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.draft;
            const typeLabel = documentTypeMap[doc.document_type] || doc.document_type;
            const isSigned = doc.file?.is_signed;

            return (
              <tr
                key={doc.id}
                onClick={() => onOpenDetail(doc.id)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* No. Surat */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-amber-500 shrink-0" />
                    <span className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                      {doc.document_number}
                    </span>
                  </div>
                </td>

                {/* Judul & Jenis Surat */}
                <td className="py-3 px-4">
                  <div className="flex flex-col min-w-0 max-w-[280px]">
                    <span className="font-bold text-slate-900 truncate">
                      {doc.title}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {typeLabel}
                    </span>
                  </div>
                </td>

                {/* Tujuan / Penerima */}
                <td className="py-3 px-4">
                  <span className="font-semibold text-slate-800">
                    {doc.issued_to_name ?? "—"}
                  </span>
                </td>

                {/* Tanggal Terbit */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{doc.issued_date ? formatDate(doc.issued_date) : "—"}</span>
                  </div>
                </td>

                {/* Status Dokumen */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${status.bg} ${status.text} ${status.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    <span>{status.label}</span>
                  </span>
                </td>

                {/* Status Tanda Tangan */}
                <td className="py-3 px-4">
                  {isSigned ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} className="text-emerald-600" />
                      <span>Ditandatangani</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs font-medium">Belum TTD</span>
                  )}
                </td>

                {/* Tombol Aksi */}
                <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    {doc.status === "draft" && onEditDocument && (
                      <button
                        type="button"
                        onClick={() => onEditDocument(doc.id)}
                        title="Edit draf surat"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Pencil size={12} className="text-amber-600" />
                        <span>Edit</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenDetail(doc.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-200 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Eye size={12} />
                      <span>Detail</span>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SuratDcOpsTable;
