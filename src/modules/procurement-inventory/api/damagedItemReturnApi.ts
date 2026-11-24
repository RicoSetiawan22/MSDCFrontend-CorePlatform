import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { DamagedItemReturn, DamagedItemReturnListParams, CreateDamagedItemReturnValues, ReturnableAsset } from "../types/damagedItemReturn";

export interface DamagedReturnEvidence {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  previewable: boolean;
}

const BASE = "/v1/procurement-inventory";

export const damagedItemReturnApi = {
  list(params: DamagedItemReturnListParams) {
    return apiClient.get<PaginatedResponse<DamagedItemReturn>>(`${BASE}/damaged-item-returns`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: DamagedItemReturn }>(`${BASE}/damaged-item-returns/${id}`);
  },
  // Aset yang TIDAK sedang dipegang siapa pun, atau sudah dalam proses
  // pengembalian lain, TIDAK ikut di sini - difilter di BACKEND
  // (DamagedItemReturnController::returnableAssets()).
  returnableAssets(search?: string) {
    return apiClient.get<{ data: ReturnableAsset[] }>(`${BASE}/assets-returnable`, { params: { search: search || undefined } });
  },
  create(values: CreateDamagedItemReturnValues) {
    return apiClient.post<ApiMessageResponse<DamagedItemReturn>>(`${BASE}/damaged-item-returns`, values);
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/damaged-item-returns/${id}/submit`);
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/damaged-item-returns/${id}/cancel`);
  },
  markAsReceived(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/damaged-item-returns/${id}/mark-received`);
  },
  evidence(id: number, signal?: AbortSignal) {
    return apiClient.get<{ data: DamagedReturnEvidence[] }>(`${BASE}/damaged-item-returns/${id}/evidence`, { signal });
  },
  evidenceContent(id: number, reference: string, signal?: AbortSignal) {
    return apiClient.get<Blob>(`${BASE}/damaged-item-returns/${id}/evidence/${encodeURIComponent(reference)}`, { responseType: "blob", signal });
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/damaged-item-returns/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
};
