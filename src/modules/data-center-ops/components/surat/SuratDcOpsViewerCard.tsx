import React from "react";
import {
  FileCheck2,
  Clock,
  ShieldCheck,
  Paperclip,
  Download,
} from "lucide-react";
import { formatDate } from "@shared/lib/format";
import type { DocumentDetail } from "@modules/document-management/types/document";

export interface SuratDcOpsViewerCardProps {
  document: DocumentDetail;
  typeLabel: string;
  onPreviewPdf?: () => void;
  isDownloading?: boolean;
}

export const SuratDcOpsViewerCard: React.FC<SuratDcOpsViewerCardProps> = ({
  document,
  typeLabel,
  onPreviewPdf,
  isDownloading,
}) => {
  const hasFieldData =
    document.field_data && Object.keys(document.field_data).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      {/* ── Lembar Naskah Surat Dinas (Official Paper Sheet Style) ── */}
      <div className="border border-slate-200 rounded-xl p-6 sm:p-8 bg-white shadow-2xs flex flex-col gap-5 relative">
        {/* Garis Aksen Kop Surat */}
        <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-amber-500 to-amber-600 rounded-full" />

        {/* Kop Surat Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-black tracking-wider text-amber-600 uppercase font-mono">
              PT MICRO SCALE DATA CENTER • DATA CENTER OPERATIONS
            </span>
            <span className="text-sm font-extrabold text-slate-800">
              Dokumen Resmi Tata Naskah Teknik Fasilitas DC
            </span>
          </div>

          <div className="flex flex-col sm:items-end text-left sm:text-right">
            <span className="text-xs text-slate-400 font-mono">Nomor Dokumen</span>
            <span className="text-xs font-bold font-mono text-slate-900">
              {document.document_number}
            </span>
          </div>
        </div>

        {/* Informasi Header Surat */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 text-xs">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 font-medium">Perihal / Judul:</span>
            <span className="font-bold text-slate-900 text-sm">{document.title}</span>
            <span className="text-slate-500 text-[11px] font-medium mt-0.5">
              Klasifikasi: {typeLabel}
            </span>
          </div>

          <div className="flex flex-col gap-1 sm:items-end sm:text-right">
            <span className="text-slate-400 font-medium">Ditujukan Kepada:</span>
            <span className="font-bold text-slate-900 text-sm">
              {document.issued_to_name || "Pihak Terkait / Rekanan"}
            </span>
            <span className="text-slate-500 text-[11px] font-medium mt-0.5">
              Tanggal: {document.issued_date ? formatDate(document.issued_date) : "—"}
            </span>
          </div>
        </div>

        {/* Isi Naskah HTML Surat */}
        <div className="pt-4 border-t border-slate-100">
          {document.body_html ? (
            <div
              className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-sans text-xs sm:text-sm"
              dangerouslySetInnerHTML={{ __html: document.body_html }}
            />
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
              Tidak ada teks isi manual — rincian naskah disimpan dalam lampiran PDF / variabel template di bawah.
            </div>
          )}
        </div>

        {/* Rincian Parameter / Field Data Template */}
        {hasFieldData && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rincian Parameter Dokumen
            </span>
            <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-slate-50/50">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Nama Variabel</th>
                    <th className="py-2 px-3">Nilai / Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 text-slate-800">
                  {Object.entries(document.field_data ?? {}).map(([key, val]) => (
                    <tr key={key} className="hover:bg-white transition-colors">
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-500 font-semibold">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900">{val || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Kotak Stempel Tanda Tangan Digital Resmi ── */}
        <div className="mt-6 pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Stempel 1: Pembuat Surat */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between min-h-[140px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dibuat Oleh:
            </span>

            <div className="my-3 flex flex-col items-center justify-center text-center">
              {document.creator_signed_at ? (
                <div className="flex flex-col items-center gap-1 text-emerald-700">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800 mt-1">
                    ✓ Ditandatangani Digital
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {formatDate(document.creator_signed_at)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Clock size={20} className="text-slate-300" />
                  <span className="text-xs font-medium italic">Belum Ditandatangani</span>
                </div>
              )}
            </div>

            <div className="text-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 text-xs block truncate">
                {document.creator?.name || "Staf Data Center Ops"}
              </span>
              <span className="text-[10px] text-slate-400">Teknisi / Pembuat Dokumen</span>
            </div>
          </div>

          {/* Stempel 2: Pejabat Penyetujui / Approver */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col justify-between min-h-[140px]">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Disetujui / Mengetahui:
            </span>

            <div className="my-3 flex flex-col items-center justify-center text-center">
              {document.approver_signed_at ? (
                <div className="flex flex-col items-center gap-1 text-emerald-700">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                    <FileCheck2 size={20} className="text-emerald-600" />
                  </div>
                  <span className="text-xs font-bold text-emerald-800 mt-1">
                    ✓ Disetujui & Disahkan
                  </span>
                  <span className="text-[10px] text-emerald-600 font-mono">
                    {formatDate(document.approver_signed_at)}
                  </span>
                </div>
              ) : document.status === "pending_approval" ? (
                <div className="flex flex-col items-center gap-1 text-amber-600">
                  <Clock size={20} className="text-amber-500 animate-pulse" />
                  <span className="text-xs font-bold">Menunggu Persetujuan Atasan</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Clock size={20} className="text-slate-300" />
                  <span className="text-xs font-medium italic">Draf / Belum Diajukan</span>
                </div>
              )}
            </div>

            <div className="text-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800 text-xs block truncate">
                {document.approver?.name || "Data Center Operations Manager"}
              </span>
              <span className="text-[10px] text-slate-400">Kepala Bagian / Penyetujui</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lampiran File Berkas Dokumen ── */}
      {document.file && (
        <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Paperclip size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 truncate max-w-md">
                {document.file.original_name}
              </span>
              <span className="text-[11px] text-slate-500">
                Tipe: {document.file.mime_type} •{" "}
                {document.file.is_signed ? "Telah Disertifikasi Digital" : "Berkas Asli"}
              </span>
            </div>
          </div>

          {onPreviewPdf && (
            <button
              type="button"
              onClick={onPreviewPdf}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95 self-start sm:self-center"
            >
              <Download size={13} className="text-slate-500" />
              <span>{isDownloading ? "Memuat..." : "Buka / Unduh"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SuratDcOpsViewerCard;
