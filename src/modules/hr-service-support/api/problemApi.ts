import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Problem } from "../types/itil";

const BASE = "/v1/hr-service-support";

export const problemApi = {
  list(params: { status?: string; search?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<Problem>>(`${BASE}/problems`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Problem }>(`${BASE}/problems/${id}`);
  },
  create(values: { title: string; root_cause?: string; assigned_to?: number }) {
    return apiClient.post<ApiMessageResponse<Problem>>(`${BASE}/problems`, values);
  },
  linkIncident(problemId: number, incidentId: number) {
    return apiClient.post<ApiMessageResponse<void>>(`${BASE}/problems/${problemId}/link-incident`, { incident_id: incidentId });
  },
  updateStatus(id: number, status: string) {
    return apiClient.post<ApiMessageResponse<Problem>>(`${BASE}/problems/${id}/status`, { status });
  },
};
