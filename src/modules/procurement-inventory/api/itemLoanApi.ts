import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ItemLoan, ItemLoanListParams, CreateItemLoanValues, AvailableAssetForLoan } from "../types/itemLoan";

const BASE = "/v1/procurement-inventory";

export const itemLoanApi = {
  list(params: ItemLoanListParams) {
    return apiClient.get<PaginatedResponse<ItemLoan>>(`${BASE}/item-loans`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: ItemLoan }>(`${BASE}/item-loans/${id}`);
  },
  // Aset yang SEDANG dipinjam (proses/status manapun sampai dikembalikan)
  // TIDAK ikut di sini - difilter di BACKEND (ItemLoanController::
  // availableAssets()), bukan client-side.
  availableAssets(search?: string) {
    return apiClient.get<{ data: AvailableAssetForLoan[] }>(`${BASE}/assets-available-for-loan`, { params: { search: search || undefined } });
  },
  create(values: CreateItemLoanValues) {
    return apiClient.post<ApiMessageResponse<ItemLoan>>(`${BASE}/item-loans`, values);
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/item-loans/${id}/submit`);
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/item-loans/${id}/cancel`);
  },
  markAsLoaned(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/item-loans/${id}/mark-loaned`);
  },
  markAsReturned(id: number, values: { condition_in?: string; actual_return_date?: string }) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/item-loans/${id}/mark-returned`, values);
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/item-loans/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
};
