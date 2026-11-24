import { Eye, Trash2, FileText, User, Calendar, Paperclip } from "lucide-react";
import { useFileThumbnail } from "@modules/core-platform/api/useFilePreview";
import { formatDate } from "@shared/lib/format";
import { DOCUMENT_STATUS_COLORS, DOCUMENT_STATUS_LABELS } from "../types/document";
import type { DocumentListItem } from "../types/document";

interface DocumentGalleryCardProps {
  doc: DocumentListItem;
  onView: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export function DocumentGalleryCard({
  doc,
  onView,
  onDelete,
  isDeleting = false,
}: DocumentGalleryCardProps) {
  const { url } = useFileThumbnail(doc.file_id, "small");

  const statusColor = DOCUMENT_STATUS_COLORS[doc.status] || {
    bg: "#f1f5f9",
    color: "#475569",
  };
  const statusLabel = DOCUMENT_STATUS_LABELS[doc.status] || doc.status;

  const isPdf = doc.file?.mime_type?.includes("pdf") || doc.file?.original_name?.toLowerCase().endsWith(".pdf");
  const isImage = doc.file?.mime_type?.includes("image") || /\.(png|jpg|jpeg|webp)$/i.test(doc.file?.original_name || "");

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden hover:border-amber-400 hover:shadow-lg transition-all duration-200 flex flex-col h-full">
      {/* ===== 1. PREVIEW / THUMBNAIL AREA (ALA IMAGE MANAGEMENT) ===== */}
      <div
        onClick={onView}
        className="aspect-[4/3] bg-gradient-to-b from-slate-50 to-slate-100/80 w-full relative overflow-hidden flex items-center justify-center cursor-pointer border-b border-slate-100 select-none"
      >
        {url ? (
          <img
            src={url}
            alt={doc.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Fallback A4 Stylized Document Simulation when no direct image thumbnail */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            {/* Background Sheet Simulation */}
            <div className="w-[82%] h-[88%] bg-white rounded-lg shadow-sm border border-slate-200/90 p-3 flex flex-col justify-between group-hover:border-amber-300 transition-colors">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-[8px]">
                      M
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      MSDC PERSURATAN
                    </span>
                  </div>
                  {doc.file && (
                    <span className="text-[8px] font-mono font-semibold px-1 py-0.2 rounded bg-slate-100 text-slate-500">
                      {isPdf ? "PDF" : isImage ? "IMG" : "DOC"}
                    </span>
                  )}
                </div>
                {/* Simulated doc lines */}
                <div className="w-full h-1.5 bg-slate-100 rounded"></div>
                <div className="w-4/5 h-1.5 bg-slate-100 rounded"></div>
                <div className="w-2/3 h-1.5 bg-slate-100 rounded"></div>
              </div>

              {/* Centered Document Stamp/Badge Icon */}
              <div className="my-auto py-1 flex items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-xs group-hover:scale-110 transition-transform">
                  <FileText size={20} />
                </div>
              </div>

              {/* Bottom footer simulation */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100/70 text-[8px] text-slate-400 font-mono">
                <span className="truncate max-w-[100px]">{doc.document_number}</span>
                <span>{doc.issued_date ? formatDate(doc.issued_date) : "—"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Hover Overlay Icon ala ImageManagementPage */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 bg-white/95 text-slate-800 p-2 rounded-full shadow-lg transition-all duration-200 transform scale-90 group-hover:scale-100 pointer-events-auto">
            <Eye size={18} className="text-slate-700" />
          </div>
        </div>

        {/* Top-Left: Document Direction & Type Tag */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-white/95 text-slate-700 shadow-xs border border-slate-200/80 backdrop-blur-xs uppercase tracking-tight">
            {doc.document_type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Top-Right: Status Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs backdrop-blur-xs"
            style={{
              backgroundColor: statusColor.bg,
              color: statusColor.color,
              borderColor: `${statusColor.color}30`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: statusColor.color }}
            />
            {statusLabel}
          </span>
        </div>

        {/* Attached file indicator badge at bottom right inside preview */}
        {doc.file && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[9px] font-medium backdrop-blur-xs shadow-xs">
              <Paperclip size={10} />
              <span className="truncate max-w-[90px]">{doc.file.original_name}</span>
            </div>
          </div>
        )}
      </div>

      {/* ===== 2. CARD CONTENT / METADATA ===== */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Document Number */}
          <div className="text-[10px] font-mono font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded w-fit mb-1.5 border border-slate-200/50">
            {doc.document_number}
          </div>

          {/* Title */}
          <h4
            onClick={onView}
            className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
            title={doc.title}
          >
            {doc.title}
          </h4>

          {/* Meta details: Destination / Issuer */}
          <div className="space-y-1 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <User size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{doc.issued_to_name || "Internal / Terkait"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span>{doc.issued_date ? formatDate(doc.issued_date) : "—"}</span>
            </div>
          </div>
        </div>

        {/* ===== 3. ACTION FOOTER ===== */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onView}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <Eye size={13} />
            <span>Lihat Detail</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeleting}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Hapus Surat"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
