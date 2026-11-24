/** HARUS persis sama dengan validasi backend
 * (SupportTicketService::updateStatus()) - sebelumnya ada "acknowledged" di
 * sini yang TIDAK PERNAH diterima backend (backend pakai "waiting_customer"),
 * jadi tombol ubah status selalu gagal 422 begitu dipilih. */
export type TicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketChannel = "email" | "phone" | "portal" | "chat" | "walk_in";

export interface SupportTicket {
  id: number;
  ticket_number: string;
  customer_id: number | null;
  contract_id: number | null;
  contract_service_id: number | null;
  sla_id: number | null;
  contract?: { id: number; contract_number: string } | null;
  customer?: { id: number; company_name: string } | null;
  channel: TicketChannel;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: number | null;
  /** hr_employee, BUKAN users - lihat SupportTicket::assignee() di backend. */
  assignee?: { id: number; full_name: string } | null;
  incident_id: number | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  satisfaction_rating: number | null;
  opened_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
}

export interface SupportTicketListParams {
  page?: number;
  per_page?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
}
