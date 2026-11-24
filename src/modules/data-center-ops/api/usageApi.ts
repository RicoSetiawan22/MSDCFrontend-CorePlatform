import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { UsageRecord, UsageListParams } from "../types/usage";

const BASE = "/v1/data-center-ops";

export const usageApi = {
  list(params: UsageListParams) {
    return apiClient.get<PaginatedResponse<UsageRecord>>(`${BASE}/usage-records`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: UsageRecord }>(`${BASE}/usage-records/${id}`);
  },
  /** Generate/refresh usage record untuk periode tertentu */
  generateMonthly(month: number, year: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/usage-records/generate`, {
      month, year,
    });
  },
  /** Submit remote hands usage untuk dibilling */
  billRemoteHands(id: number, ratePerHour: number) {
    return apiClient.post<ApiMessageResponse<UsageRecord>>(
      `${BASE}/usage-records/${id}/bill-remote-hands`,
      { rate_per_hour: ratePerHour }
    );
  },
  /** Tandai usage record (rack_space/power/bandwidth) dikirim ke Finance */
  markSent(id: number) {
    return apiClient.post<ApiMessageResponse<UsageRecord>>(
      `${BASE}/usage-records/${id}/mark-sent`,
      {}
    );
  },
};
