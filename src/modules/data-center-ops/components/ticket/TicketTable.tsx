import React from "react";
import { Link } from "react-router-dom";
import {
  UserCheck,
  Clock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  User,
  AlertCircle,
  RotateCw,
} from "lucide-react";
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketType,
} from "../../types/ticket";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { TicketTablePagination } from "./TicketTablePagination";

export interface TicketTableProps {
  tickets: Ticket[];
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onRequestAssign: (ticket: Ticket) => void;
  onRequestLogActivity: (ticket: Ticket) => void;
  onRequestClose: (ticket: Ticket) => void;
}

/* ──────────────────────────────────────────────────────────────
 * Format SLA: dipisah jadi tanggal & jam supaya bisa 2 baris
 * di laptop dan 1 baris di monitor besar (2xl).
 * ────────────────────────────────────────────────────────────── */
export function formatSlaDue(dateStr: string | null | undefined): {
  formatted: string;
  date: string;
  time: string | null;
  isInvalid: boolean;
} {
  if (!dateStr) return { formatted: "—", date: "—", time: null, isInvalid: true };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { formatted: dateStr, date: dateStr, time: null, isInvalid: false };

  const date = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);

  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/\./g, ":");

  const formatted = `${date}, ${time} WIB`;

  return { formatted, date, time: `${time} WIB`, isInvalid: false };
}

const PRIORITY_CONFIG: Record<
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

const STATUS_CONFIG: Record<
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
    label: "Pending Cust.",
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

const TYPE_CONFIG: Record<
  TicketType,
  { label: string; bg: string; text: string; border: string }
> = {
  remote_hands: {
    label: "Remote Hands",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
  },
  incident: {
    label: "Incident",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  maintenance: {
    label: "Maintenance",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  request: {
    label: "Request",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  other: {
    label: "Other",
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
  },
};

/* ──────────────────────────────────────────────────────────────
 * Tooltip kecil untuk tombol aksi (mengurangi duplikasi markup)
 * ────────────────────────────────────────────────────────────── */
const ActionTooltip: React.FC<{
  label: string;
  tone?: "dark" | "emerald";
  children: React.ReactNode;
}> = ({ label, tone = "dark", children }) => {
  const bg = tone === "emerald" ? "bg-emerald-700" : "bg-slate-900";
  return (
    <div className="relative group/tooltip">
      {children}
      <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tooltip:opacity-100 transition-all duration-150 transform group-hover/tooltip:-translate-y-0.5 z-50">
        <div
          className={`px-2 py-0.5 text-[11px] font-semibold text-white ${bg} rounded-md shadow-lg whitespace-nowrap`}
        >
          {label}
        </div>
        <div className={`w-1.5 h-1.5 ${bg} rotate-45 mx-auto -mt-1`} />
      </div>
    </div>
  );
};

const ACTION_BTN_BASE =
  "w-6.5 h-6.5 sm:w-7 sm:h-7 inline-flex items-center justify-center rounded-lg border transition-all cursor-pointer shadow-2xs active:scale-95";

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  currentPage,
  totalPages,
  perPage,
  total,
  onPageChange,
  onPerPageChange,
  onRequestAssign,
  onRequestLogActivity,
  onRequestClose,
}) => {
  if (isLoading && tickets.length === 0) {
    return (
      <div className="py-16">
        <LoadingState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-3">
          <AlertCircle size={24} />
        </div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Gagal Memuat Data</h3>
        <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
          {errorMessage || "Terjadi kendala komunikasi dengan server. Periksa hak akses atau koneksi jaringan Anda."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RotateCw size={13} />
            <span>Coba Muat Ulang</span>
          </button>
        )}
      </div>
    );
  }

  if (!isLoading && !isError && tickets.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          title="Belum Ada Tiket"
          subtitle="Tiket operasional atau permohonan remote hands akan muncul di sini."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ── Table Container ── */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-xs">
        {/* overflow-x-auto sebagai safety fallback */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-xs 2xl:text-sm">
            {/* Lebar kolom proporsional: SUBJECT dipangkas ~60% agar tidak dominan dan kolom lain bernapas lega */}
            <colgroup>
              <col className="w-[125px] 2xl:w-[155px]" />
              <col className="w-[180px] xl:w-[220px] 2xl:w-[280px]" />
              <col className="w-[105px] 2xl:w-[120px]" />
              <col className="w-[95px] 2xl:w-[110px]" />
              <col className="w-[105px] 2xl:w-[120px]" />
              <col className="w-[125px] 2xl:w-[150px]" />
              <col className="w-[110px] 2xl:w-[140px]" />
              <col className="w-[130px] 2xl:w-[145px]" />
            </colgroup>

            {/* Header Strip Kuning Emas Pastel Sesuai Desain MSDC */}
            <thead className="bg-[#FEF9EE] text-slate-800 font-bold border-b border-[#F3EDE0]">
              <tr className="[&>th]:py-3.5 [&>th]:px-2.5 [&>th]:text-[11px] 2xl:[&>th]:text-xs [&>th]:font-bold [&>th]:tracking-wider [&>th]:text-slate-700 [&>th]:whitespace-nowrap">
                <th>NO TIKET</th>
                <th>SUBJECT</th>
                <th className="text-center">TIPE</th>
                <th className="text-center">PRIORITAS</th>
                <th className="text-center">STATUS</th>
                <th>PIC</th>
                <th>SLA DUE</th>
                <th className="text-center">AKSI</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket) => {
                const priorityStyle =
                  PRIORITY_CONFIG[ticket.priority] ?? PRIORITY_CONFIG.low;
                const statusStyle =
                  STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.normal;
                const typeStyle =
                  TYPE_CONFIG[ticket.ticket_type] ?? TYPE_CONFIG.other;

                const isOverdue =
                  ticket.is_response_overdue || ticket.is_resolution_overdue;
                const slaInfo = formatSlaDue(ticket.sla_resolution_due_at);

                return (
                  <tr
                    key={ticket.id}
                    className={`hover:bg-amber-50/25 transition-colors ${
                      isOverdue ? "bg-rose-50/20" : ""
                    }`}
                  >
                    {/* 1. NO TIKET */}
                    <td className="py-3 px-2.5 whitespace-nowrap">
                      <Link
                        to={`/dc/tickets/${ticket.id}`}
                        title={ticket.ticket_number}
                        className="font-mono font-bold text-amber-700 hover:text-amber-900 hover:underline transition-colors block text-[11px] 2xl:text-xs truncate"
                      >
                        {ticket.ticket_number}
                      </Link>
                    </td>

                    {/* 2. SUBJECT (Dipangkas proporsional & truncate aman) */}
                    <td className="py-3 px-2.5">
                      <div className="max-w-[170px] xl:max-w-[210px] 2xl:max-w-[270px]">
                        <div
                          className="font-semibold text-slate-900 truncate text-xs"
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </div>
                        {ticket.description && (
                          <p
                            className="text-[11px] 2xl:text-xs text-slate-500 truncate mt-0.5 font-normal"
                            title={ticket.description}
                          >
                            {ticket.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 3. TIPE TIKET (Centered & berjarak lega dari prioritas) */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center min-w-[76px] px-2 py-0.5 rounded-md text-[10px] 2xl:text-[11px] font-bold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
                      >
                        {typeStyle.label}
                      </span>
                    </td>

                    {/* 4. PRIORITAS (Centered & berjarak lega) */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center min-w-[58px] px-2 py-0.5 rounded-md text-[10px] 2xl:text-[11px] font-black tracking-wider uppercase border ${priorityStyle.bg} ${priorityStyle.text} ${priorityStyle.border}`}
                      >
                        {priorityStyle.label}
                      </span>
                    </td>

                    {/* 5. STATUS (Centered) */}
                    <td className="py-3 px-2 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] 2xl:text-[11px] font-bold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyle.dot}`}
                        />
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* 6. PIC (ASSIGNEE - Ruang cukup agar tidak terpotong) */}
                    <td className="py-3 px-2.5">
                      {ticket.assignee ? (
                        <div className="flex items-center gap-1.5 font-semibold text-slate-800 min-w-0">
                          <User size={13} className="text-slate-400 shrink-0" />
                          <span
                            className="truncate max-w-[100px] xl:max-w-[130px]"
                            title={ticket.assignee.name}
                          >
                            {ticket.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic whitespace-nowrap">
                          Belum ditugaskan
                        </span>
                      )}
                    </td>

                    {/* 7. SLA DUE: 2 baris di laptop, 1 baris di 2xl */}
                    <td className="py-3 px-2.5">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={`font-mono text-[11px] leading-tight ${
                            isOverdue
                              ? "text-rose-700 font-bold"
                              : "text-slate-700 font-medium"
                          }`}
                        >
                          <span className="whitespace-nowrap">
                            {slaInfo.date}
                          </span>
                          {slaInfo.time && (
                            <>
                              <br className="2xl:hidden" />
                              <span className="hidden 2xl:inline">, </span>
                              <span
                                className={`whitespace-nowrap ${
                                  isOverdue ? "" : "text-slate-500"
                                }`}
                              >
                                {slaInfo.time}
                              </span>
                            </>
                          )}
                        </span>

                        {isOverdue && ticket.status !== "closed" && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 whitespace-nowrap"
                            title="Terlewat Target SLA"
                          >
                            <AlertTriangle
                              size={11}
                              className="stroke-[2.5] shrink-0"
                            />
                            <span>Lewat SLA</span>
                          </span>
                        )}

                        {ticket.status === "closed" && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 whitespace-nowrap">
                            <CheckCircle2 size={11} className="shrink-0" />
                            <span>Selesai</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 8. AKSI */}
                    <td className="py-3 px-1.5 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Aksi 1: Tugaskan PIC */}
                        <ActionTooltip label="Tugaskan PIC">
                          <button
                            type="button"
                            onClick={() => onRequestAssign(ticket)}
                            aria-label={`Tugaskan PIC untuk tiket ${ticket.ticket_number}`}
                            className={`${ACTION_BTN_BASE} text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border-blue-200/80`}
                          >
                            <UserCheck size={13} strokeWidth={2.2} />
                          </button>
                        </ActionTooltip>

                        {/* Aksi 2: Catat Aktivitas */}
                        <ActionTooltip label="Catat Aktivitas">
                          <button
                            type="button"
                            onClick={() => onRequestLogActivity(ticket)}
                            aria-label={`Catat aktivitas tiket ${ticket.ticket_number}`}
                            className={`${ACTION_BTN_BASE} text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border-amber-200/80`}
                          >
                            <Clock size={13} strokeWidth={2.2} />
                          </button>
                        </ActionTooltip>

                        {/* Aksi 3: Lihat Detail */}
                        <ActionTooltip label="Detail Tiket">
                          <Link
                            to={`/dc/tickets/${ticket.id}`}
                            aria-label={`Lihat detail tiket ${ticket.ticket_number}`}
                            className={`${ACTION_BTN_BASE} text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border-slate-200/80`}
                          >
                            <Eye size={13} strokeWidth={2.2} />
                          </Link>
                        </ActionTooltip>

                        {/* Aksi 4: Tutup Tiket (jika belum closed) */}
                        {ticket.status !== "closed" && (
                          <ActionTooltip label="Tutup Tiket" tone="emerald">
                            <button
                              type="button"
                              onClick={() => onRequestClose(ticket)}
                              aria-label={`Tutup tiket ${ticket.ticket_number}`}
                              className={`${ACTION_BTN_BASE} text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 border-emerald-200/80`}
                            >
                              <CheckCircle2 size={13} strokeWidth={2.2} />
                            </button>
                          </ActionTooltip>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Kontrol Paginasi Terpusat (Centered Sesuai Desain RackTable) ── */}
      {total > 0 ? (
        <TicketTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          perPageOptions={[10, 20, 50]}
        />
      ) : null}
    </div>
  );
};

export default TicketTable;