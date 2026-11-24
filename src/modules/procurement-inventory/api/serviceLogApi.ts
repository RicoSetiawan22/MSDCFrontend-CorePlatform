import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse } from "@shared/types/api";
import type { ServiceLogLine, ServiceLogListParams, ServiceLogSummary } from "../types/serviceLog";

const BASE = "/v1/procurement-inventory";

export const serviceLogApi = {
  list(params: ServiceLogListParams) {
    return apiClient.get<PaginatedResponse<ServiceLogLine>>(`${BASE}/service-log`, { params });
  },
  summary(params: Pick<ServiceLogListParams, "date_from" | "date_to">) {
    return apiClient.get<{ data: ServiceLogSummary }>(`${BASE}/service-log/summary`, { params });
  },
};
