import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  PermissionRequest, PermissionRequestListParams, PermissionRequestReport, PermissionRequestType,
} from "../types/permission";

const BASE = "/v1/hr-service-support";

export const permissionApi = {
  list(params?: PermissionRequestListParams) {
    return apiClient.get<{ success: boolean; data: PaginatedResponse<PermissionRequest> }>(`${BASE}/permission-requests`, { params });
  },
  show(id: number) {
    return apiClient.get<{ success: boolean; data: PermissionRequest }>(`${BASE}/permission-requests/${id}`);
  },
  submit(values: {
    organization_id?: number;
    employee_id: number;
    type: PermissionRequestType;
    start_date: string;
    end_date: string;
    reason?: string;
    requested_check_in?: string;
    requested_check_out?: string;
    out_start_time?: string;
    out_end_time?: string;
  }) {
    const activeOrgId = localStorage.getItem("msdc_active_org_id");
    const orgId = values.organization_id || (activeOrgId ? Number(activeOrgId) : undefined);
    return apiClient.post<ApiMessageResponse<PermissionRequest>>(`${BASE}/permission-requests`, {
      ...values,
      ...(orgId ? { organization_id: orgId } : {}),
    });
  },
  // TIDAK ADA approve()/reject() di sini lagi - approval Ijin sekarang lewat
  // Workflow Engine Core Platform ("My Approvals" Kepala Posisi terkait),
  // lihat PermissionRequestController::store() & useApprovals di
  // core-platform. cancel() tetap ada untuk requester membatalkan
  // pengajuan yang masih 'pending'.
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<PermissionRequest>>(`${BASE}/permission-requests/${id}/cancel`);
  },
  report(dateFrom: string, dateTo: string) {
    return apiClient.get<{ success: boolean; data: PermissionRequestReport }>(`${BASE}/permission-requests/report`, {
      params: { date_from: dateFrom, date_to: dateTo },
    });
  },
  printPdf(organizationId: number, params?: { date_from?: string; date_to?: string; type?: PermissionRequestType; status?: string; employee_id?: number }) {
    return apiClient.get<Blob>(`${BASE}/permission-requests/print-pdf`, {
      params: { organization_id: organizationId, ...params },
      responseType: "blob",
    });
  },
};
