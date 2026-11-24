import { useUpdateTicketStatus } from "../api/useTickets";
import type { Ticket } from "../types/ticket";

const STATUS_LABELS: Record<string, string> = {
  trouble: "Trouble",
  maintenance: "Maintenance",
  pending_customer: "Pending Customer",
  normal: "Normal",
  closed: "Closed",
};

const STATUS_BADGE: Record<string, string> = {
  trouble: "churned",
  maintenance: "prospect",
  pending_customer: "inactive",
  normal: "active",
  closed: "inactive",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--grey)",
  medium: "#d97706",
  high: "#ea580c",
  critical: "#dc2626",
};

export function TicketRow({ ticket, onRequestClose, onRequestLogActivity, onRequestAssign }: {
  ticket: Ticket;
  onRequestClose: (ticket: Ticket) => void;
  onRequestLogActivity: (ticket: Ticket) => void;
  onRequestAssign: (ticket: Ticket) => void;
}) {
  const statusMutation = useUpdateTicketStatus(ticket.id);

  const isOverdue = ticket.is_response_overdue || ticket.is_resolution_overdue;

  function setNormal() {
    statusMutation.mutate({ status: "normal" });
  }

  return (
    <tr style={isOverdue ? { background: "#fef2f2" } : undefined}>
      <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{ticket.ticket_number}</td>
      <td style={{ fontWeight: 600 }}>{ticket.subject}</td>
      <td>
        <span style={{ color: PRIORITY_COLORS[ticket.priority] ?? "inherit", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase" }}>
          {ticket.priority}
        </span>
      </td>
      <td>
        <span className={`badge badge-${STATUS_BADGE[ticket.status] ?? "inactive"}`}>
          {STATUS_LABELS[ticket.status] ?? ticket.status}
        </span>
      </td>
      <td style={{ fontSize: "0.8rem", color: ticket.assignee ? "var(--text-primary)" : "var(--grey)" }}>
        {ticket.assignee?.name ?? "Belum ditugaskan"}
      </td>
      <td style={{ color: isOverdue ? "#dc2626" : "inherit", fontSize: "0.875rem" }}>
        {ticket.sla_resolution_due_at ? ticket.sla_resolution_due_at.split(" ")[0] : "—"}
        {isOverdue && <span style={{ marginLeft: "0.25rem" }}>⚠️</span>}
      </td>
      <td>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            onClick={() => onRequestAssign(ticket)}>
            Assign
          </button>
          <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
            onClick={() => onRequestLogActivity(ticket)}>
            Catat Aktivitas
          </button>
          {ticket.status !== "closed" && ticket.status !== "normal" && (
            <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
              disabled={statusMutation.isPending} onClick={setNormal}>
              Set Normal
            </button>
          )}
          {ticket.status !== "closed" && (
            <button className="btn btn-secondary" style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
              disabled={statusMutation.isPending} onClick={() => onRequestClose(ticket)}>
              Tutup Ticket
            </button>
          )}
        </div>
        {ticket.status === "closed" && ticket.resolution_action && (
          <span title={ticket.resolution_action} style={{ fontSize: "0.72rem", color: "var(--grey)", cursor: "help" }}>
            ✓ Selesai
          </span>
        )}
      </td>
    </tr>
  );
}
