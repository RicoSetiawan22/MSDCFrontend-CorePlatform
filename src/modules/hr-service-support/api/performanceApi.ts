import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { PerformanceReview, PerformanceGoal, CrossModuleMetrics, KpiProgressEntry } from "../types/itil";

const BASE = "/v1/hr-service-support";

export const performanceApi = {
  listReviews(params: { employee_id?: number; review_period?: string; status?: string; search?: string; page?: number; per_page?: number }) {
    return apiClient.get<PaginatedResponse<PerformanceReview>>(`${BASE}/performance-reviews`, { params });
  },
  showReview(id: number) {
    return apiClient.get<{ data: PerformanceReview }>(`${BASE}/performance-reviews/${id}`);
  },
  createReview(employeeId: number, values: { reviewer_id?: number; review_period: string; review_date?: string; comments?: string }) {
    return apiClient.post<ApiMessageResponse<PerformanceReview>>(`${BASE}/employees/${employeeId}/performance-reviews`, values);
  },
  submitReview(id: number, values: { overall_score?: number; comments?: string }) {
    return apiClient.post<ApiMessageResponse<PerformanceReview>>(`${BASE}/performance-reviews/${id}/submit`, values);
  },
  acknowledgeReview(id: number) {
    return apiClient.post<ApiMessageResponse<PerformanceReview>>(`${BASE}/performance-reviews/${id}/acknowledge`);
  },
  listGoals(employeeId: number) {
    return apiClient.get<{ data: PerformanceGoal[] }>(`${BASE}/employees/${employeeId}/performance-goals`);
  },
  createGoal(employeeId: number, values: { review_id?: number; goal_description: string; target_value?: number; weight_pct?: number }) {
    return apiClient.post<ApiMessageResponse<PerformanceGoal>>(`${BASE}/employees/${employeeId}/performance-goals`, values);
  },
  updateGoalProgress(goalId: number, values: { actual_value: number; status?: string }) {
    return apiClient.post<ApiMessageResponse<PerformanceGoal>>(`${BASE}/performance-goals/${goalId}/progress`, values);
  },
  crossModuleMetrics(employeeId: number) {
    return apiClient.get<{ data: CrossModuleMetrics }>(`${BASE}/employees/${employeeId}/performance-metrics`);
  },
  kpiProgress(employeeId: number, params?: { from?: string; to?: string }) {
    return apiClient.get<{ data: KpiProgressEntry[] }>(`${BASE}/employees/${employeeId}/kpi-progress`, { params });
  },
};
