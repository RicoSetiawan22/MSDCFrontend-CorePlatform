import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { PurchaseRequest, PurchaseRequestListParams } from "../types/pr";

const BASE = "/v1/procurement-inventory";

export const prApi = {
  list(params: PurchaseRequestListParams) {
    return apiClient.get<PaginatedResponse<PurchaseRequest>>(`${BASE}/purchase-requests`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: PurchaseRequest }>(`${BASE}/purchase-requests/${id}`);
  },
  create(values: Partial<PurchaseRequest>) {
    return apiClient.post<ApiMessageResponse<PurchaseRequest>>(`${BASE}/purchase-requests`, values);
  },
  update(id: number, values: Partial<PurchaseRequest>) {
    return apiClient.put<ApiMessageResponse<PurchaseRequest>>(`${BASE}/purchase-requests/${id}`, values);
  },
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/purchase-requests/${id}`);
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/purchase-requests/${id}/submit`);
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/purchase-requests/${id}/cancel`);
  },
  approve(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/purchase-requests/${id}/approve`);
  },
  reject(id: number, reason: string) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/purchase-requests/${id}/reject`, { reason });
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/purchase-requests/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
};
