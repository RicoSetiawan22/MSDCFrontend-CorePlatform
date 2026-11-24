import { useState, useMemo } from "react";
import { PageHeader } from "@shared/components/PageHeader";
import { extractErrorMessage } from "@shared/types/api";
import { useTicketList } from "../api/useTickets";
import {
  TicketStatusBanner,
  TicketKPICards,
  TicketToolbar,
  TicketTable,
  type TicketKPIMetrics,
} from "../components/ticket";
import { TicketFormModal } from "./TicketFormModal";
import { AssignTicketModal } from "./AssignTicketModal";
import { LogTicketActivityModal } from "./LogTicketActivityModal";
import { CloseTicketModal } from "./CloseTicketModal";
import type { Ticket, TicketStatus, TicketPriority, TicketType } from "../types/ticket";

export function TicketListPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // ── Modals State ──
  const [showForm, setShowForm] = useState(false);
  const [closingTicket, setClosingTicket] = useState<Ticket | null>(null);
  const [loggingTicket, setLoggingTicket] = useState<Ticket | null>(null);
  const [assigningTicket, setAssigningTicket] = useState<Ticket | null>(null);

  // ── 1. Fetch Seluruh Tiket untuk Kalkulasi KPI Metrics ──
  const { data: allTicketsPage } = useTicketList({ per_page: 100 });
  const allTickets = useMemo(() => allTicketsPage?.data ?? [], [allTicketsPage]);

  // ── 2. Fetch Data Tabel Terpaginasi & Filtered ──
  const {
    data: tableData,
    isLoading,
    isError,
    error,
    dataUpdatedAt,
    refetch,
  } = useTicketList({
    page,
    per_page: perPage,
    search: search.trim() || undefined,
    status: (statusFilter || undefined) as TicketStatus | undefined,
    priority: (priorityFilter || undefined) as TicketPriority | undefined,
    ticket_type: (typeFilter || undefined) as TicketType | undefined,
  });

  // ── 3. Format Waktu Terakhir Diperbarui (Last Updated Timestamp) ──
  const lastUpdatedTime = useMemo(() => {
    if (!dataUpdatedAt) return undefined;
    return new Date(dataUpdatedAt)
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
      .replace(/\./g, ":");
  }, [dataUpdatedAt]);

  // ── 4. Kalkulasi Metrik KPI ──
  const metrics: TicketKPIMetrics = useMemo(() => {
    const total = allTicketsPage?.total ?? allTickets.length;
    let openCount = 0;
    let remoteHandsCount = 0;
    let overdueCount = 0;

    allTickets.forEach((t) => {
      // Tiket aktif (bukan closed / resolved)
      if (t.status !== "closed" && t.status !== "normal") {
        openCount++;
      }
      // Remote hands
      if (t.ticket_type === "remote_hands") {
        remoteHandsCount++;
      }
      // Overdue SLA
      if (t.is_response_overdue || t.is_resolution_overdue) {
        overdueCount++;
      }
    });

    return {
      total,
      openCount,
      remoteHandsCount,
      overdueCount,
    };
  }, [allTicketsPage, allTickets]);

  const isOperational = metrics.overdueCount === 0;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* ── Header Judul Halaman Standar MSDC ── */}
      <PageHeader
        title="Ticket & Remote Hands"
        subtitle="Tiket operasional, eskalasi insiden dan permintaan remote hands dari customer"
        containerClassName="px-7 pt-2"
      />

      {/* ── Overview Card: Status Banner & 4 KPI Cards Sesuai Desain MSDC ── */}
      <div className="mx-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-5">
        <TicketStatusBanner
          isOperational={isOperational}
          lastUpdated={lastUpdatedTime}
          overdueCount={metrics.overdueCount}
          openCount={metrics.openCount}
        />

        <TicketKPICards metrics={metrics} />
      </div>

      {/* ── Container Card Putih (Toolbar & Tabel Tiket) ── */}
      <div className="mx-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col gap-4">
        {/* Toolbar: Search, Filters & Tombol + Tiket Baru */}
        <TicketToolbar
          search={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusFilterChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={(val) => {
            setPriorityFilter(val);
            setPage(1);
          }}
          typeFilter={typeFilter}
          onTypeFilterChange={(val) => {
            setTypeFilter(val);
            setPage(1);
          }}
          onNewTicket={() => setShowForm(true)}
          totalTickets={tableData?.total}
        />

        {/* Tabel Data Tiket & Paginasi */}
        <TicketTable
          tickets={tableData?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          errorMessage={error ? extractErrorMessage(error) : null}
          onRetry={() => refetch()}
          currentPage={page}
          totalPages={tableData?.last_page ?? 1}
          perPage={perPage}
          total={tableData?.total ?? 0}
          onPageChange={setPage}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          onRequestAssign={(ticket) => setAssigningTicket(ticket)}
          onRequestLogActivity={(ticket) => setLoggingTicket(ticket)}
          onRequestClose={(ticket) => setClosingTicket(ticket)}
        />
      </div>

      {/* ── Modals Dialog ── */}
      {showForm && (
        <TicketFormModal
          onClose={() => setShowForm(false)}
        />
      )}

      {assigningTicket && (
        <AssignTicketModal
          ticket={assigningTicket}
          onClose={() => {
            setAssigningTicket(null);
            refetch();
          }}
        />
      )}

      {loggingTicket && (
        <LogTicketActivityModal
          ticket={loggingTicket}
          onClose={() => {
            setLoggingTicket(null);
            refetch();
          }}
        />
      )}

      {closingTicket && (
        <CloseTicketModal
          ticket={closingTicket}
          onClose={() => {
            setClosingTicket(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default TicketListPage;
