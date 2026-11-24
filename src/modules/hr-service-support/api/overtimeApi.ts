import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { OvertimeRecord, OvertimeListParams, OvertimeCandidateDay } from "../types/overtime";

const BASE = "/v1/hr-service-support";

interface OvertimeApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const overtimeApi = {
  list(params: OvertimeListParams) {
    return apiClient.get<PaginatedResponse<OvertimeRecord>>(`${BASE}/overtime-records`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: OvertimeRecord }>(`${BASE}/overtime-records/${id}`);
  },
  generate(month: number, year: number) {
    return apiClient.post<{ message: string; success?: boolean } | ApiMessageResponse<void>>(`${BASE}/overtime-records/generate`, { month, year });
  },
  postToFinance(id: number, ratePerHour: number) {
    return apiClient.post<ApiMessageResponse<OvertimeRecord>>(`${BASE}/overtime-records/${id}/post-to-finance`, { rate_per_hour: ratePerHour });
  },
  // ── Alur pengajuan HRD -> approval Manager ──────────────────────────────
  candidates(employeeId: number, month: number, year: number) {
    return apiClient.get<OvertimeApiResponse<OvertimeCandidateDay[]>>(`${BASE}/overtime-records/candidates`, {
      params: { employee_id: employeeId, month, year },
    });
  },
  // Approve/reject TIDAK ADA di sini - lewat Workflow Engine generik Core
  // Platform (halaman "My Approvals", lihat workflowApi.ts), sama jalur
  // persis dengan Quotation/Contract di CRM Sales, supaya approval di
  // seluruh sistem konsisten satu pintu.
  submit(values: { employee_id: number; month: number; year: number; days: { overtime_date: string; notes?: string }[]; attachment_file_id?: number }) {
    return apiClient.post<OvertimeApiResponse<OvertimeRecord>>(`${BASE}/overtime-records/submit`, values);
  },
  // Tarif lembur (master data Core Platform) - dipakai kasih estimasi
  // biaya di SubmitOvertimeModal (jam x rate) sebelum diajukan.
  overtimeRates() {
    return apiClient.get<{ success: boolean; data: { id: number; code: string; name: string; rate_per_hour: number; is_default: boolean; is_active: boolean }[] }>(
      "/v1/core-platform/overtime-rates"
    );
  },
};
