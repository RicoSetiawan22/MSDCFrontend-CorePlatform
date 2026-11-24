import React from "react";
import { Clock, CheckCircle2, AlertTriangle, ShieldAlert, Award } from "lucide-react";
import type { Ticket } from "../../types/ticket";
import { formatSlaDue } from "./TicketTable";

export interface TicketSlaTelemetryCardProps {
  ticket: Ticket;
}

export const TicketSlaTelemetryCard: React.FC<TicketSlaTelemetryCardProps> = ({
  ticket,
}) => {
  const responseDue = formatSlaDue(ticket.sla_response_due_at);
  const resolutionDue = formatSlaDue(ticket.sla_resolution_due_at);
  const firstResponse = formatSlaDue(ticket.first_response_at);
  const resolvedAt = formatSlaDue(ticket.resolved_at);
  const closedAt = formatSlaDue(ticket.closed_at);

  const isResponseOverdue = ticket.is_response_overdue;
  const isResolutionOverdue = ticket.is_resolution_overdue;
  const isCompliant = !isResponseOverdue && !isResolutionOverdue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80">
            <Clock size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Telemetri &amp; Kepatuhan SLA
            </h2>
            <p className="text-[11px] text-slate-500">
              Target batas waktu respons dan penanganan insiden NOC
            </p>
          </div>
        </div>

        {/* Status Kepatuhan Badge */}
        {ticket.status === "closed" ? (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
              isCompliant
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {isCompliant ? (
              <>
                <Award size={13} className="text-emerald-600" />
                <span>SLA Terpenuhi</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} className="text-rose-600" />
                <span>Terlewat SLA</span>
              </>
            )}
          </span>
        ) : isResolutionOverdue ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert size={13} className="text-rose-600" />
            <span>Target Resolusi Terlewat</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={13} className="text-blue-600" />
            <span>Dalam Batas Waktu SLA</span>
          </span>
        )}
      </div>

      {/* ── 2 Column Telemetry Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Kolom 1: Response Time SLA */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600 uppercase tracking-wider">
              1. Target Respon (First Response)
            </span>
            {isResponseOverdue ? (
              <span className="text-[10px] font-bold text-rose-600">Terlewat</span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600">Normal</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 font-medium">Batas Waktu Target:</span>
            <span className="font-mono text-xs font-bold text-slate-900 mt-0.5">
              {responseDue.formatted}
            </span>
          </div>

          <div className="flex flex-col pt-1.5 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium">Respons Pertama Masuk:</span>
            <span className="font-mono text-xs font-semibold text-slate-800 mt-0.5">
              {firstResponse.formatted !== "—" ? (
                firstResponse.formatted
              ) : (
                <span className="text-slate-400 italic font-sans text-[11px]">
                  Menunggu respons teknisi
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Kolom 2: Resolution Time SLA */}
        <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-600 uppercase tracking-wider">
              2. Target Resolusi (Resolution)
            </span>
            {isResolutionOverdue ? (
              <span className="text-[10px] font-bold text-rose-600">Terlewat</span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600">Normal</span>
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-slate-500 font-medium">Batas Waktu Target:</span>
            <span
              className={`font-mono text-xs font-bold mt-0.5 ${
                isResolutionOverdue ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {resolutionDue.formatted}
            </span>
          </div>

          <div className="flex flex-col pt-1.5 border-t border-slate-200/60">
            <span className="text-[11px] text-slate-500 font-medium">Waktu Selesai Ditangani:</span>
            <span className="font-mono text-xs font-semibold text-slate-800 mt-0.5">
              {resolvedAt.formatted !== "—" ? (
                resolvedAt.formatted
              ) : closedAt.formatted !== "—" ? (
                closedAt.formatted
              ) : (
                <span className="text-amber-700 italic font-sans text-[11px]">
                  Masih dalam progres
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tindakan Resolusi (Jika tiket ditutup) ── */}
      {ticket.resolution_action && (
        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-start gap-2.5">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block mb-0.5">
              Tindakan Resolusi Penyelesaian
            </span>
            <p className="text-xs text-emerald-800 leading-relaxed font-normal">
              {ticket.resolution_action}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketSlaTelemetryCard;
