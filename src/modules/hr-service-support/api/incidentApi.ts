import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Incident, IncidentListParams, IncidentWorklog } from "../types/itil";

const BASE = "/v1/hr-service-support";

export const incidentApi = {
  list(params: IncidentListParams) {
    return apiClient.get<PaginatedResponse<Incident>>(`${BASE}/incidents`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Incident }>(`${BASE}/incidents/${id}`);
  },
  create(values: Partial<Incident>) {
    return apiClient.post<ApiMessageResponse<Incident>>(`${BASE}/incidents`, values);
  },
  assign(id: number, employeeId: number) {
    return apiClient.post<ApiMessageResponse<Incident>>(`${BASE}/incidents/${id}/assign`, { employee_id: employeeId });
  },
  updateStatus(id: number, status: string) {
    return apiClient.post<ApiMessageResponse<Incident>>(`${BASE}/incidents/${id}/status`, { status });
  },
  // ── Integration: create incident from alarm ──────────────────────────────
  createFromAlarm(alarmId: number, values?: Partial<Incident>) {
    return apiClient.post<ApiMessageResponse<Incident>>(`${BASE}/alarms/${alarmId}/create-incident`, values ?? {});
  },

  // ── Worklog ──────────────────────────────────────────────────────────────
  worklogs(incidentId: number) {
    return apiClient.get<{ success: boolean; data: IncidentWorklog[] }>(`${BASE}/incidents/${incidentId}/worklogs`);
  },
  addWorklog(incidentId: number, values: { log_type?: string; description: string; hours_spent?: number }) {
    return apiClient.post<ApiMessageResponse<IncidentWorklog>>(`${BASE}/incidents/${incidentId}/worklogs`, values);
  },
};
