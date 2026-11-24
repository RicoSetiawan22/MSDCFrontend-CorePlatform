import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTicket } from "../api/useTickets";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import {
  TicketDetailHero,
  TicketInfoCard,
  TicketSlaTelemetryCard,
  TicketActivityTimeline,
} from "../components/ticket";
import { AssignTicketModal } from "./AssignTicketModal";
import { LogTicketActivityModal } from "./LogTicketActivityModal";
import { CloseTicketModal } from "./CloseTicketModal";

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = id ? Number(id) : undefined;

  // ── Modals State ──
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  // ── Query ──
  const { data: ticket, isLoading, refetch } = useTicket(ticketId);

  // ── React UI Patterns: Loading & Empty States ──
  if (isLoading && !ticket) {
    return (
      <div className="py-24">
        <LoadingState />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="px-7 py-12">
        <EmptyState
          title="Tiket Tidak Ditemukan"
          subtitle="Nomor tiket ini mungkin sudah dihapus atau URL tidak valid."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-14">
      {/* ── 1. Hero / Header Section ── */}
      <TicketDetailHero
        ticket={ticket}
        onRequestAssign={() => setShowAssignModal(true)}
        onRequestLogActivity={() => setShowLogModal(true)}
        onRequestClose={() => setShowCloseModal(true)}
      />

      {/* ── 2. Bento Grid 2 Columns Layout ── */}
      <div className="mx-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri (7 Kolom): Informasi Insiden & Telemetri SLA */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <TicketInfoCard ticket={ticket} />
          <TicketSlaTelemetryCard ticket={ticket} />
        </div>

        {/* Kolom Kanan (5 Kolom): Timeline Aktivitas & Remote Hands */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <TicketActivityTimeline
            ticket={ticket}
            onActivityAdded={() => {
              refetch();
            }}
          />
        </div>
      </div>

      {/* ── 3. Modals ── */}
      {showAssignModal && (
        <AssignTicketModal
          ticket={ticket}
          onClose={() => {
            setShowAssignModal(false);
            refetch();
          }}
        />
      )}

      {showLogModal && (
        <LogTicketActivityModal
          ticket={ticket}
          onClose={() => {
            setShowLogModal(false);
            refetch();
          }}
        />
      )}

      {showCloseModal && (
        <CloseTicketModal
          ticket={ticket}
          onClose={() => {
            setShowCloseModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default TicketDetailPage;
