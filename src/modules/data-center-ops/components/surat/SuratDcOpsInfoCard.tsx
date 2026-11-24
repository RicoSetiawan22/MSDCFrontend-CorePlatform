import React from "react";
import {
  FileText,
  Calendar,
  User,
  Building,
  Layers,
  ArrowRightLeft,
  Link as LinkIcon,
} from "lucide-react";
import { formatDate } from "@shared/lib/format";
import type { DocumentDetail } from "@modules/document-management/types/document";

export interface SuratDcOpsInfoCardProps {
  document: DocumentDetail;
  typeLabel: string;
}

const DIRECTION_LABELS: Record<string, string> = {
  internal: "Surat Internal (Teknis DC)",
  keluar: "Surat Keluar (Vendor / Customer)",
  masuk: "Surat Masuk (Instansi / Rekanan Luar)",
};

export const SuratDcOpsInfoCard: React.FC<SuratDcOpsInfoCardProps> = ({
  document,
  typeLabel,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
      {/* ── Header Card ── */}
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <FileText size={15} />
        </div>
        <h3 className="text-sm font-bold text-slate-800">Informasi Dokumen</h3>
      </div>

      {/* ── Metadata List ── */}
      <div className="flex flex-col gap-3.5 text-xs">
        {/* Nomor Surat */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
            <FileText size={13} className="text-slate-400" />
            Nomor Surat
          </span>
          <span className="font-mono font-bold text-slate-900 text-right break-all">
            {document.document_number}
          </span>
        </div>

        {/* Jenis Dokumen */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
            <Layers size={13} className="text-slate-400" />
            Jenis Surat
          </span>
          <span className="font-semibold text-slate-900 text-right">
            {typeLabel}
          </span>
        </div>

        {/* Arah Dokumen */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
            <ArrowRightLeft size={13} className="text-slate-400" />
            Arah Dokumen
          </span>
          <span className="font-semibold text-slate-800 text-right">
            {DIRECTION_LABELS[document.direction] ?? document.direction}
          </span>
        </div>

        {/* Tanggal Terbit */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
            <Calendar size={13} className="text-slate-400" />
            Tanggal Terbit
          </span>
          <span className="font-semibold text-slate-900 text-right">
            {document.issued_date ? formatDate(document.issued_date) : "—"}
          </span>
        </div>

        {/* Penerima / Ditujukan */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
            <User size={13} className="text-slate-400" />
            Penerima / Tujuan
          </span>
          <div className="flex flex-col items-end text-right">
            <span className="font-bold text-slate-900">
              {document.issued_to_name || "Pihak Terkait"}
            </span>
            {document.issued_to_type && (
              <span className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">
                Kategori: {document.issued_to_type}
              </span>
            )}
          </div>
        </div>

        {/* Modul Pemilik */}
        <div className="flex items-start justify-between gap-3">
          <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
            <Building size={13} className="text-slate-400" />
            Modul Pemilik
          </span>
          <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded text-[11px]">
            Data Center Operations
          </span>
        </div>

        {/* Sumber Terkait (Polymorphic Link) */}
        {document.source_type && (
          <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
              <LinkIcon size={13} className="text-slate-400" />
              Tautan Sumber
            </span>
            <span className="font-mono font-semibold text-slate-700 text-right text-[11px]">
              {document.source_type.split("\\").pop()} #{document.source_id}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuratDcOpsInfoCard;
