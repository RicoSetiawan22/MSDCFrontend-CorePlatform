import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { WarrantyClaim, WarrantyClaimListParams, CreateWarrantyClaimValues, PoReceiptItem } from "../types/warrantyClaim";

const BASE = "/v1/procurement-inventory";

export const warrantyClaimApi = {
  list(params: WarrantyClaimListParams) {
    return apiClient.get<PaginatedResponse<WarrantyClaim>>(`${BASE}/warranty-claims`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: WarrantyClaim }>(`${BASE}/warranty-claims/${id}`);
  },
  poReceiptItems(purchaseOrderId: number) {
    return apiClient.get<{ data: PoReceiptItem[] }>(`${BASE}/purchase-orders/${purchaseOrderId}/receipt-items`);
  },
  attachProof(id: number, proofFileId: number) {
    return apiClient.post<ApiMessageResponse<WarrantyClaim>>(`${BASE}/warranty-claims/${id}/attach-proof`, { proof_file_id: proofFileId });
  },
  create(values: CreateWarrantyClaimValues) {
    return apiClient.post<ApiMessageResponse<WarrantyClaim>>(`${BASE}/warranty-claims`, values);
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/warranty-claims/${id}/submit`);
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/warranty-claims/${id}/cancel`);
  },
  markSentToVendor(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/warranty-claims/${id}/send-to-vendor`);
  },
  resolve(id: number, values: { resolution_notes?: string; resolved_date?: string }) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/warranty-claims/${id}/resolve`, values);
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/warranty-claims/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
};
