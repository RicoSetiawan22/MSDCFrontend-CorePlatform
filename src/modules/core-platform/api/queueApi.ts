import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { QueueStatus, PendingJob, FailedJob } from "../types/queue";

const BASE = "/v1/core-platform/queue";

export const queueApi = {
  status() {
    return apiClient.get<{ data: QueueStatus }>(`${BASE}/status`);
  },
  pendingJobs(params?: { per_page?: number; page?: number }) {
    return apiClient.get<PaginatedResponse<PendingJob>>(`${BASE}/jobs`, { params });
  },
  failedJobs(params?: { per_page?: number; page?: number }) {
    return apiClient.get<PaginatedResponse<FailedJob>>(`${BASE}/failed-jobs`, { params });
  },
  retry(uuid: string) {
    return apiClient.post<ApiMessageResponse<null>>(`${BASE}/failed-jobs/retry`, { uuid });
  },
  retryAll() {
    return apiClient.post<ApiMessageResponse<null>>(`${BASE}/failed-jobs/retry-all`);
  },
  forget(uuid: string) {
    return apiClient.post<ApiMessageResponse<null>>(`${BASE}/failed-jobs/forget`, { uuid });
  },
  flushFailed() {
    return apiClient.post<ApiMessageResponse<null>>(`${BASE}/failed-jobs/flush`);
  },
};
