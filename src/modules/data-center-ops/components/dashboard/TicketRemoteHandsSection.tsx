import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket as TicketIcon,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Ticket } from "../../types/ticket";
import { DataTablePagination } from "../common/DataTablePagination";

export interface TicketRemoteHandsSectionProps {
  tickets?: Ticket[];
  onOpenNewTicket?: () => void;
  onRequestRemoteHands?: () => void;
  onViewTicketDetail?: (ticketId: number) => void;
}

export type TicketTabType = "ticket" | "remote_hands";

// Helper styling untuk Priority Badge pada tabel tiket aktif
const getPriorityStyle = (priority: string) => {
  const p = (priority || "").toLowerCase();
  if (p === "critical") {
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      label: "CRITICAL",
    };
  }
  if (p === "high") {
    return {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "HIGH",
    };
  }
  if (p === "medium") {
    return {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
      label: "MEDIUM",
    };
  }
  return {
    bg: "bg-slate-50",
    text: "text-slate-600",
    border: "border-slate-200",
    label: "LOW",
  };
};

export const TicketRemoteHandsSection: React.FC<
  TicketRemoteHandsSectionProps
> = ({
  tickets = [],
  onOpenNewTicket,
  onRequestRemoteHands,
  onViewTicketDetail,
}) => {
  const navigate = useNavigate();
  // ── 1. State Management ──
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TicketTabType>("ticket");

  // ── State Paginasi per Tab ──
  const [ticketPage, setTicketPage] = useState<number>(1);
  const [ticketPerPage, setTicketPerPage] = useState<number>(5);

  const [rhPage, setRhPage] = useState<number>(1);
  const [rhPerPage, setRhPerPage] = useState<number>(5);

  // ── 2. Data Filtering & Classification ──
  // A. Tiket Open (Insiden / General Request yang belum terselesaikan)
  const openTickets = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    return tickets.filter((t) => {
      if (t.ticket_type === "remote_hands") return false;
      return (
        t.status === "trouble" ||
        t.status === "maintenance" ||
        t.status === "pending_customer" ||
        (!t.resolved_at && t.status !== "closed" && t.status !== "normal")
      );
    });
  }, [tickets]);

  // B. Remote Hands Open (Permintaan layanan on-site yang aktif)
  const openRemoteHands = useMemo(() => {
    if (!tickets || tickets.length === 0) return [];
    return tickets.filter((t) => {
      if (t.ticket_type !== "remote_hands") return false;
      return t.status !== "closed" && t.status !== "normal" && !t.resolved_at;
    });
  }, [tickets]);

  // ── 3. Perhitungan Total Halaman & Proteksi Paginasi ──
  const ticketTotalPages = Math.ceil(openTickets.length / ticketPerPage) || 1;
  const rhTotalPages = Math.ceil(openRemoteHands.length / rhPerPage) || 1;

  useEffect(() => {
    if (ticketPage > ticketTotalPages) setTicketPage(ticketTotalPages);
  }, [ticketPage, ticketTotalPages]);

  useEffect(() => {
    if (rhPage > rhTotalPages) setRhPage(rhTotalPages);
  }, [rhPage, rhTotalPages]);

  // ── 4. Slice Data Paginasi ──
  const paginatedOpenTickets = useMemo(() => {
    const start = (ticketPage - 1) * ticketPerPage;
    return openTickets.slice(start, start + ticketPerPage);
  }, [openTickets, ticketPage, ticketPerPage]);

  const paginatedOpenRemoteHands = useMemo(() => {
    const start = (rhPage - 1) * rhPerPage;
    return openRemoteHands.slice(start, start + rhPerPage);
  }, [openRemoteHands, rhPage, rhPerPage]);

  const handleOpenTicketClick = () => {
    if (onOpenNewTicket) {
      onOpenNewTicket();
    } else {
      navigate("/dc/tickets?action=create");
    }
  };

  const handleRequestRemoteHandsClick = () => {
    if (onRequestRemoteHands) {
      onRequestRemoteHands();
    } else {
      navigate("/dc/tickets?action=create&type=remote_hands");
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all min-w-0">
      {/* ── 1. Top Card Header ── */}
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white select-none">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Ikon Ticket + Judul */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <TicketIcon size={18} />
            </div>
            <h3 className="m-0 text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
              Ticket &amp; Remote Hands Open
            </h3>
          </div>

          {/* Badge Peringkasan Metrik */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
            {openTickets.length} Open Ticket &bull; {openRemoteHands.length} Remote Hands
          </span>
        </div>

        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={
            isOpen
              ? "Tutup panel Ticket & Remote Hands"
              : "Buka panel Ticket & Remote Hands"
          }
          className="border border-slate-200/80 bg-white cursor-pointer text-slate-500 hover:text-slate-900 p-1.5 flex items-center justify-center rounded-lg hover:bg-slate-50 shadow-2xs transition-colors"
        >
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ── 2. Collapsible Body ── */}
      {isOpen && (
        <div className="p-5">
          {/* ── Toggle Filter Pills ── */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 mb-5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab("ticket")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "ticket"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Tiket Open ({openTickets.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("remote_hands")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "remote_hands"
                  ? "bg-amber-500 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              Remote Hands Open ({openRemoteHands.length})
            </button>
          </div>

          {/* ── Single Unified Card Content ── */}
          {activeTab === "ticket" ? (
            /* ── TAB 1: TIKET OPEN (Amber Theme) ── */
            <div className="min-w-0">
              {/* Header Kolom */}
              <div className="flex justify-between items-center mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-amber-700">
                    Tiket Open ({openTickets.length})
                  </h4>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs ${
                    openTickets.length === 0
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-rose-50 border border-rose-200 text-rose-700"
                  }`}
                >
                  {openTickets.length === 0
                    ? "Normal"
                    : `${openTickets.length} Active`}
                </span>
              </div>

              {/* Konten: Empty State vs Active Table */}
              {openTickets.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/70 p-10 flex flex-col items-center justify-center text-center gap-1.5 my-2">
                  <h5 className="m-0 text-sm font-bold text-slate-800">
                    Tidak ada tiket open.
                  </h5>
                  <p className="m-0 text-xs text-slate-500 max-w-sm">
                    Semua laporan insiden dan permintaan layanan telah selesai
                    ditangani.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs w-full my-2">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-3 px-4 w-[25%]">NO. TIKET</th>
                        <th className="py-3 px-4 w-[45%]">SUBJECT</th>
                        <th className="py-3 px-4 w-[18%]">PRIORITAS</th>
                        <th className="py-3 px-4 w-[12%] text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOpenTickets.map((t) => {
                        const prio = getPriorityStyle(t.priority);
                        return (
                          <tr
                            key={t.id}
                            onClick={() => onViewTicketDetail?.(t.id)}
                            className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                              {t.ticket_number}
                            </td>
                            <td
                              className="py-3.5 px-4 font-medium text-slate-800 max-w-[300px] truncate"
                              title={t.subject}
                            >
                              {t.subject}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${prio.bg} ${prio.text} ${prio.border}`}
                              >
                                {prio.label}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="text-amber-600 font-bold text-xs hover:underline">
                                Detail &rarr;
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Tab Tiket Open */}
              {openTickets.length > 0 && (
                <div className="mt-2">
                  <DataTablePagination
                    currentPage={ticketPage}
                    totalPages={ticketTotalPages}
                    perPage={ticketPerPage}
                    onPageChange={(page) => setTicketPage(page)}
                    onPerPageChange={(size) => {
                      setTicketPerPage(size);
                      setTicketPage(1);
                    }}
                    perPageOptions={[5, 10, 20]}
                  />
                </div>
              )}

              {/* Action Link Bawah: + Buka Tiket Baru */}
              <div className="border-t border-slate-100 pt-3.5 mt-3">
                <button
                  type="button"
                  onClick={handleOpenTicketClick}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer transition-colors"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Buka Tiket Baru</span>
                </button>
              </div>
            </div>
          ) : (
            /* ── TAB 2: REMOTE HANDS OPEN (Purple Theme) ── */
            <div className="min-w-0">
              {/* Header Kolom */}
              <div className="flex justify-between items-center mb-3.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <h4 className="m-0 text-xs font-extrabold uppercase tracking-wide text-purple-700">
                    Remote Hands Open ({openRemoteHands.length})
                  </h4>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700 shadow-2xs">
                  {openRemoteHands.length === 0
                    ? "Standby"
                    : `${openRemoteHands.length} In Progress`}
                </span>
              </div>

              {/* Konten: Empty State vs Active Table */}
              {openRemoteHands.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-xl bg-slate-50/70 p-10 flex flex-col items-center justify-center text-center gap-1.5 my-2">
                  <h5 className="m-0 text-sm font-bold text-slate-800">
                    Tidak ada remote hands open.
                  </h5>
                  <p className="m-0 text-xs text-slate-500 max-w-sm">
                    Tidak ada tugas on-site atau permintaan intervensi teknisi
                    NOC yang pending.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-2xs w-full my-2">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                        <th className="py-3 px-4 w-[25%]">NO. TIKET</th>
                        <th className="py-3 px-4 w-[45%]">TUGAS</th>
                        <th className="py-3 px-4 w-[18%]">ASSIGNEE</th>
                        <th className="py-3 px-4 w-[12%] text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOpenRemoteHands.map((t) => (
                        <tr
                          key={t.id}
                          onClick={() => onViewTicketDetail?.(t.id)}
                          className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 text-xs">
                            {t.ticket_number}
                          </td>
                          <td
                            className="py-3.5 px-4 font-medium text-slate-800 max-w-[300px] truncate"
                            title={t.subject}
                          >
                            {t.subject}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs">
                            {t.assignee?.name ||
                              (t.assigned_to
                                ? `User #${t.assigned_to}`
                                : "-")}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="text-purple-600 font-bold text-xs hover:underline">
                              Detail &rarr;
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Tab Remote Hands Open */}
              {openRemoteHands.length > 0 && (
                <div className="mt-2">
                  <DataTablePagination
                    currentPage={rhPage}
                    totalPages={rhTotalPages}
                    perPage={rhPerPage}
                    onPageChange={(page) => setRhPage(page)}
                    onPerPageChange={(size) => {
                      setRhPerPage(size);
                      setRhPage(1);
                    }}
                    perPageOptions={[5, 10, 20]}
                  />
                </div>
              )}

              {/* Action Link Bawah: + Request Remote Hands */}
              <div className="border-t border-slate-100 pt-3.5 mt-3">
                <button
                  type="button"
                  onClick={handleRequestRemoteHandsClick}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer transition-colors"
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>Request Remote Hands</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
