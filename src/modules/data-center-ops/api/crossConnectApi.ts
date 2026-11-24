import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { CrossConnect, CrossConnectDetail, CrossConnectFormValues, CrossConnectListParams } from "../types/crossConnect";

const BASE = "/v1/data-center-ops";

export const crossConnectApi = {
  list(params: CrossConnectListParams) {
    return apiClient.get<PaginatedResponse<CrossConnect>>(`${BASE}/cross-connects`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: CrossConnectDetail }>(`${BASE}/cross-connects/${id}`);
  },
  create(values: CrossConnectFormValues) {
    return apiClient.post<ApiMessageResponse<CrossConnect>>(`${BASE}/cross-connects`, values);
  },
  update(id: number, values: CrossConnectFormValues) {
    return apiClient.put<ApiMessageResponse<CrossConnect>>(`${BASE}/cross-connects/${id}`, values);
  },
  /** available -> active (kabel dipasang, mulai menyambungkan customer). */
  lock(id: number, installationDate?: string) {
    return apiClient.post<ApiMessageResponse<CrossConnect>>(`${BASE}/cross-connects/${id}/lock`, { installation_date: installationDate });
  },
  /** active -> available (kabel dilepas, jadi stok lagi). */
  release(id: number) {
    return apiClient.post<ApiMessageResponse<CrossConnect>>(`${BASE}/cross-connects/${id}/release`, {});
  },
  markDamaged(id: number) {
    return apiClient.post<ApiMessageResponse<CrossConnect>>(`${BASE}/cross-connects/${id}/mark-damaged`, {});
  },
  /** damaged -> available (sudah diperbaiki/diganti). */
  repair(id: number) {
    return apiClient.post<ApiMessageResponse<CrossConnect>>(`${BASE}/cross-connects/${id}/repair`, {});
  },
};
