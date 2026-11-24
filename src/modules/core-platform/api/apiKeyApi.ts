import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ApiKey, ApiKeyListParams, ApiKeyCreateValues } from "../types/apiKey";

const BASE = "/v1/core-platform";

export const apiKeyApi = {
  list(params: ApiKeyListParams) {
    return apiClient.get<PaginatedResponse<ApiKey>>(`${BASE}/api-keys`, { params });
  },
  /** raw_key CUMA muncul di response create ini - tidak pernah ditampilkan lagi setelahnya. */
  create(values: ApiKeyCreateValues) {
    return apiClient.post<ApiMessageResponse<{ api_key: ApiKey; raw_key: string }>>(`${BASE}/api-keys`, values);
  },
  updateAllowedIps(id: number, allowedIps: string[]) {
    return apiClient.put<ApiMessageResponse<ApiKey>>(`${BASE}/api-keys/${id}`, { allowed_ips: allowedIps });
  },
  revoke(id: number) {
    return apiClient.post<ApiMessageResponse<ApiKey>>(`${BASE}/api-keys/${id}/revoke`, {});
  },
  /** Hard delete - permanen, beda dari revoke() (nonaktifkan, riwayat tetap ada). */
  destroy(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/api-keys/${id}`);
  },
};
