import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
} from "lucide-react";
import type { Ticket, TicketStatus, TicketPriority } from "../../types/ticket";
import { PageHeader } from "@shared/components/PageHeader";

export interface TicketDetailHeroProps {
  ticket: Ticket;
  onRequestAssign: () => void;
  onRequestLogActivity: () => void;
  onRequestClose: () => void;
}

const PRIORITY_BADGE: Record<
  TicketPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  critical: {
    label: "CRITICAL",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  high: {
    label: "HIGH",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  medium: {
    label: "MEDIUM",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  low: {
    label: "LOW",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

const STATUS_BADGE: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  trouble: {
    label: "Trouble",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  pending_customer: {
    label: "Pending Customer",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  normal: {
    label: "Normal",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export const TicketDetailHero: React.FC<TicketDetailHeroProps> = ({
  ticket,
  onRequestAssign,
  onRequestLogActivity,
  onRequestClose,
}) => {
  const priority = PRIORITY_BADGE[ticket.priority] ?? PRIORITY_BADGE.medium;
  const status = STATUS_BADGE[ticket.status] ?? STATUS_BADGE.normal;
  const isOverdue = ticket.is_response_overdue || ticket.is_resolution_overdue;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Breadcrumb ── */}
      <nav aria-label="Breadcrumb" className="px-7 pt-5 flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Link to="/dc/tickets" className="hover:text-amber-600 transition-colors">
          Ticket &amp; Remote Hands
        </Link>
        <ChevronRight size={13} className="text-slate-400" />
        <span className="text-slate-800 font-semibold">{ticket.ticket_number}</span>
      </nav>

      {/* ── Banner Header Standar MSDC ── */}
      <PageHeader
        title="Detail Tiket Operasional"
        subtitle="Manajemen insiden, permohonan remote hands & penelusuran SLA"
        containerClassName="px-7 py-2"
      />

      {/* ── Hero Title Card Putih Modern ── */}
      <div className="mx-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {ticket.ticket_number}
            </span>

            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase border ${priority.bg} ${priority.text} ${priority.border}`}
            >
              {priority.label}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${status.bg} ${status.text} ${status.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>

            {isOverdue && ticket.status !== "closed" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                <AlertTriangle size={12} className="stroke-[2.5]" />
                <span>Overdue SLA</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {ticket.subject}
          </h1>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <User size={13} className="text-slate-400" />
              <span>
                PIC:{" "}
                <strong className="text-slate-700 font-semibold">
                  {ticket.assignee?.name ?? "Belum ditugaskan"}
                </strong>
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <span>
              Tipe: <strong className="text-slate-700 capitalize">{ticket.ticket_type.replace(/_/g, " ")}</strong>
            </span>
          </div>
        </div>

        {/* ── Action Buttons on Hero ── */}
        <div className="flex items-center gap-2 flex-wrap self-stretch md:self-auto justify-end">
          <button
            type="button"
            onClick={onRequestAssign}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <UserCheck size={14} className="stroke-[2.2]" />
            <span>Tugaskan PIC</span>
          </button>

          <button
            type="button"
            onClick={onRequestLogActivity}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/80 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Clock size={14} className="stroke-[2.2]" />
            <span>Catat Aktivitas</span>
          </button>

          {ticket.status !== "closed" && (
            <button
              type="button"
              onClick={onRequestClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <CheckCircle2 size={14} className="stroke-[2.2]" />
              <span>Tutup Tiket</span>
            </button>
          )}

          <Link
            to="/dc/tickets"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} className="stroke-[2.2]" />
            <span>Kembali</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailHero;
