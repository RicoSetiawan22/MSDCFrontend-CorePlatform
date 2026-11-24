import React from "react";
import { Check, Clock, AlertCircle, GitCommit, CheckCircle2 } from "lucide-react";
import { formatDate } from "@shared/lib/format";
import type { DocumentDetail } from "@modules/document-management/types/document";

export interface SuratDcOpsWorkflowCardProps {
  document: DocumentDetail;
  requiresApproval: boolean;
}

export const SuratDcOpsWorkflowCard: React.FC<SuratDcOpsWorkflowCardProps> = ({
  document,
  requiresApproval,
}) => {
  const isPending = document.status === "pending_approval";
  const isApproved = document.status === "approved";
  const isRejected = document.status === "rejected";
  const isSignedCreator = Boolean(document.creator_signed_at);

  const steps = [
    {
      id: "step_created",
      title: "Dokumen Dibuat",
      description: `Dibuat oleh ${document.creator?.name || "Staf DC"}`,
      timestamp: document.created_at ? formatDate(document.created_at) : undefined,
      state: "completed" as const,
    },
    {
      id: "step_signed",
      title: "Tanda Tangan Pembuat",
      description: isSignedCreator
        ? "Telah ditandatangani secara digital"
        : "Menunggu tanda tangan pembuat dokumen",
      timestamp: document.creator_signed_at
        ? formatDate(document.creator_signed_at)
        : undefined,
      state: isSignedCreator ? ("completed" as const) : ("current" as const),
    },
    {
      id: "step_approval",
      title: requiresApproval ? "Persetujuan Manager DC" : "Verifikasi Akhir",
      description: isApproved
        ? `Disetujui oleh ${document.approver?.name || "Manager DC"}`
        : isRejected
        ? "Dokumen ditolak pada tahap review"
        : isPending
        ? "Sedang ditinjau oleh atasan / manager"
        : "Menunggu pengajuan approval",
      timestamp: document.approver_signed_at
        ? formatDate(document.approver_signed_at)
        : undefined,
      state: isApproved
        ? ("completed" as const)
        : isRejected
        ? ("rejected" as const)
        : isPending
        ? ("current" as const)
        : ("upcoming" as const),
    },
    {
      id: "step_final",
      title: "Dokumen Sah & Berlaku",
      description: isApproved
        ? "Surat resmi terbit dan berkekuatan sah"
        : "Menunggu seluruh tahap persetujuan rampung",
      state: isApproved
        ? ("completed" as const)
        : isRejected
        ? ("rejected" as const)
        : ("upcoming" as const),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
      {/* ── Header Card ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <GitCommit size={15} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Alur Persetujuan (Workflow)</h3>
        </div>

        {isApproved && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
            <CheckCircle2 size={12} />
            <span>Selesai</span>
          </span>
        )}
      </div>

      {/* ── Stepper List ── */}
      <div className="flex flex-col gap-5 pt-1">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="flex items-start gap-3 relative">
              {/* Vertical connector line */}
              {!isLast && (
                <div
                  className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-5 ${
                    step.state === "completed" ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Step Icon Node */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs transition-all ${
                  step.state === "completed"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : step.state === "current"
                    ? "bg-amber-500 text-white ring-4 ring-amber-100 shadow-xs animate-pulse"
                    : step.state === "rejected"
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {step.state === "completed" ? (
                  <Check size={14} />
                ) : step.state === "current" ? (
                  <Clock size={13} />
                ) : step.state === "rejected" ? (
                  <AlertCircle size={14} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Details */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold leading-tight ${
                      step.state === "completed"
                        ? "text-slate-900"
                        : step.state === "current"
                        ? "text-amber-700"
                        : step.state === "rejected"
                        ? "text-rose-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.timestamp && (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {step.timestamp}
                    </span>
                  )}
                </div>

                <span className="text-[11px] text-slate-500 font-medium">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuratDcOpsWorkflowCard;
