import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  CctvCamera,
  CctvCheckResult,
  CctvFilterParams,
  CctvStatusSummary,
  CctvStreamTestResult,
  CreateCctvPayload,
  UpdateCctvPayload,
} from "../types/cctv";

const BASE = "/v1/data-center-ops/cctv-cameras";

export const cctvApi = {
  list(params?: CctvFilterParams) {
    return apiClient.get<PaginatedResponse<CctvCamera> & { summary?: CctvStatusSummary }>(BASE, { params });
  },

  get(id: number) {
    return apiClient.get<{ data: CctvCamera }>(`${BASE}/${id}`);
  },

  create(payload: CreateCctvPayload) {
    return apiClient.post<ApiMessageResponse<CctvCamera>>(BASE, payload);
  },

  update(id: number, payload: UpdateCctvPayload) {
    return apiClient.put<ApiMessageResponse<CctvCamera>>(`${BASE}/${id}`, payload);
  },

  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/${id}`);
  },

  /**
   * Menguji alamat stream sebelum disimpan ke basis data
   */
  test(payload: { source_url: string }) {
    return apiClient.post<CctvStreamTestResult>(`${BASE}/test`, payload);
  },

  /**
   * Menguji ulang koneksi kamera tersimpan dan memperbarui statusnya di DB
   */
  check(id: number) {
    return apiClient.post<CctvCheckResult>(`${BASE}/${id}/check`);
  },
};

