import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ChangeRequest } from "../types/itil";

const BASE = "/v1/hr-service-support";

export const changeApi = {
  list(params: { status?: string; search?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<ChangeRequest>>(`${BASE}/change-requests`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: ChangeRequest }>(`${BASE}/change-requests/${id}`);
  },
  create(values: {
    title: string; description?: string; change_type?: string; risk_level?: string;
    affected_device_id?: number; scheduled_date?: string; rollback_plan?: string;
  }) {
    return apiClient.post<ApiMessageResponse<ChangeRequest>>(`${BASE}/change-requests`, values);
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<ChangeRequest>>(`${BASE}/change-requests/${id}/submit`);
  },
  syncApproval(id: number) {
    return apiClient.post<ApiMessageResponse<ChangeRequest>>(`${BASE}/change-requests/${id}/sync-approval`);
  },
  schedule(id: number, scheduledDate: string) {
    return apiClient.post<ApiMessageResponse<ChangeRequest>>(`${BASE}/change-requests/${id}/schedule`, { scheduled_date: scheduledDate });
  },
  implement(id: number, values: { successful: boolean; notes?: string }) {
    return apiClient.post<ApiMessageResponse<ChangeRequest>>(`${BASE}/change-requests/${id}/implement`, values);
  },
};
