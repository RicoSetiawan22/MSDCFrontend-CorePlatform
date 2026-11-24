import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { SupportTicket, SupportTicketListParams, TicketStatus } from "../types/ticket";

const BASE = "/v1/hr-service-support";

export const ticketApi = {
  // ── List & Detail ────────────────────────────────────────────────────────────
  list(params: SupportTicketListParams) {
    return apiClient.get<PaginatedResponse<SupportTicket>>(`${BASE}/support-tickets`, { params });
  },
  show(id: number) {
    return apiClient.get<{ success: boolean; data: SupportTicket }>(`${BASE}/support-tickets/${id}`);
  },

  // ── Mutations ────────────────────────────────────────────────────────────────
  create(values: Partial<SupportTicket>) {
    return apiClient.post<ApiMessageResponse<SupportTicket>>(`${BASE}/support-tickets`, values);
  },
  updateStatus(id: number, status: TicketStatus) {
    return apiClient.post<ApiMessageResponse<SupportTicket>>(`${BASE}/support-tickets/${id}/status`, { status });
  },
  assign(id: number, employeeId: number) {
    return apiClient.post<ApiMessageResponse<SupportTicket>>(`${BASE}/support-tickets/${id}/assign`, { employee_id: employeeId });
  },
  escalate(id: number, values?: Partial<SupportTicket>) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/support-tickets/${id}/escalate`, values ?? {});
  },
  rateSatisfaction(id: number, rating: number) {
    return apiClient.post<ApiMessageResponse<SupportTicket>>(`${BASE}/support-tickets/${id}/satisfaction`, { rating });
  },

  // ── Activity Thread ────────────────────────────────────────────────────────
  activities(ticketId: number) {
    return apiClient.get<{ success: boolean; data: TicketActivity[] }>(`${BASE}/support-tickets/${ticketId}/activities`);
  },
  logActivity(ticketId: number, values: { description: string; activity_type?: string }) {
    return apiClient.post<ApiMessageResponse<TicketActivity>>(`${BASE}/support-tickets/${ticketId}/activities`, values);
  },
};

export interface TicketActivity {
  id: number;
  ticket_id: number;
  activity_type: "comment" | "status_change" | "assignment" | "escalation" | "satisfaction_rating" | "internal_note";
  description: string;
  performed_by: number | null;
  performed_by_name?: string;
  performed_at: string;
  created_at: string;
}
