import { apiClient } from "@shared/lib/api-client";
import type { CoreDashboardSummary } from "../types/dashboard";

export const dashboardApi = {
  getSummary() {
    return apiClient.get<{ success: boolean; data: CoreDashboardSummary }>(
      "/v1/core-platform/dashboard/summary"
    );
  },
  remindApprover(instanceId: number, approverUserId?: number | null) {
    return apiClient.post<{ success: boolean; message: string }>(
      `/v1/core-platform/workflow/instances/${instanceId}/remind`,
      { approver_user_id: approverUserId }
    );
  },
};
