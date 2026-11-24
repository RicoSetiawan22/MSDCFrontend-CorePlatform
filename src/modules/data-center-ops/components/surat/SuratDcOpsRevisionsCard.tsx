import React from "react";
import { History, GitCommit, FileText } from "lucide-react";
import { formatDate } from "@shared/lib/format";
import type { DocumentRevisionItem } from "@modules/document-management/types/document";

export interface SuratDcOpsRevisionsCardProps {
  revisions?: DocumentRevisionItem[];
  isLoading?: boolean;
}

export const SuratDcOpsRevisionsCard: React.FC<SuratDcOpsRevisionsCardProps> = ({
  revisions = [],
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
      {/* ── Header Card ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <History size={15} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Riwayat Revisi Dokumen ({revisions.length})
          </h3>
        </div>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex flex-col gap-2.5 animate-pulse">
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </div>
      ) : revisions.length === 0 ? (
        <div className="py-6 flex flex-col items-center justify-center text-center gap-1.5 text-slate-400">
          <FileText size={20} className="text-slate-300" />
          <span className="text-xs font-medium">Belum ada riwayat revisi dokumen.</span>
          <span className="text-[11px] text-slate-400">
            Perubahan isi atau lampiran akan tercatat otomatis di sini.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[260px] overflow-y-auto pr-1">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col gap-1 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <GitCommit size={13} className="text-amber-500" />
                  Revisi #{rev.revision_number}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatDate(rev.created_at)}
                </span>
              </div>

              <span className="text-[11px] text-slate-600">
                {rev.change_note || "Pembaruan isi draf dokumen."}
              </span>

              {rev.changed_by_relation?.name && (
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Oleh: {rev.changed_by_relation.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuratDcOpsRevisionsCard;
