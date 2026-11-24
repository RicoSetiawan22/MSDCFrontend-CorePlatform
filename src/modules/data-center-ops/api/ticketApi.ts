import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Ticket, TicketListParams, TicketStatus } from "../types/ticket";

const BASE = "/v1/data-center-ops";

export const ticketApi = {
  list(params: TicketListParams) {
    return apiClient.get<PaginatedResponse<Ticket>>(`${BASE}/tickets`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Ticket }>(`${BASE}/tickets/${id}`);
  },
  create(values: Partial<Ticket>) {
    return apiClient.post<ApiMessageResponse<Ticket>>(`${BASE}/tickets`, values);
  },
  logActivity(id: number, payload: { activity_type?: string; description: string; duration_minutes?: number }) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/tickets/${id}/activities`, payload);
  },
  updateStatus(id: number, status: TicketStatus, resolutionAction?: string) {
    return apiClient.post<ApiMessageResponse<Ticket>>(`${BASE}/tickets/${id}/status`, {
      status,
      resolution_action: resolutionAction,
    });
  },
  assign(id: number, userId: number) {
    return apiClient.post<ApiMessageResponse<Ticket>>(`${BASE}/tickets/${id}/assign`, { user_id: userId });
  },
};
