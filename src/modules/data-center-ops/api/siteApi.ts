import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Site, SiteListParams } from "../types/site";

const BASE = "/v1/data-center-ops";

export const siteApi = {
  list(params: SiteListParams) {
    return apiClient.get<PaginatedResponse<Site>>(`${BASE}/sites`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Site }>(`${BASE}/sites/${id}`);
  },
  create(values: Partial<Site>) {
    return apiClient.post<ApiMessageResponse<Site>>(`${BASE}/sites`, values);
  },
  update(id: number, values: Partial<Site>) {
    return apiClient.put<ApiMessageResponse<Site>>(`${BASE}/sites/${id}`, values);
  },
  setStatus(id: number, status: string) {
    return apiClient.post<ApiMessageResponse<Site>>(`${BASE}/sites/${id}/status`, { status });
  },
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/sites/${id}`);
  },
};
