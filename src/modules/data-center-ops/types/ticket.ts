export type TicketStatus = "trouble" | "maintenance" | "pending_customer" | "normal" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketType = "incident" | "remote_hands" | "maintenance" | "request" | "other";

export interface Ticket {
  id: number;
  ticket_number: string;
  customer_id: number | null;
  contract_id: number | null;
  contract_service_id: number | null;
  contract?: { id: number; contract_number: string } | null;
  site_id: number | null;
  device_id: number | null;
  sla_id: number | null;
  ticket_type: TicketType;
  priority: TicketPriority;
  subject: string;
  description: string | null;
  status: TicketStatus;
  /** users.id (akun login) - BUKAN hr_employee.id, beda dengan
   * HrServiceSupport\SupportTicket. Lihat Ticket::assignee() di backend. */
  assigned_to: number | null;
  assignee?: { id: number; name: string } | null;
  sla_response_due_at: string | null;
  sla_resolution_due_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  resolution_action: string | null;
  escalated_at: string | null;
  is_response_overdue: boolean;
  is_resolution_overdue: boolean;
  created_at: string;
  updated_at: string;
  activities?: TicketActivityItem[];
}

export interface TicketActivityItem {
  id: number;
  ticket_id: number;
  user_id?: number | null;
  user?: { id: number; name: string } | null;
  activity_type: string;
  description: string;
  duration_minutes?: number | null;
  created_at: string;
  updated_at?: string;
}

export interface TicketListParams {
  page?: number;
  per_page?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  ticket_type?: TicketType;
  search?: string;
}
