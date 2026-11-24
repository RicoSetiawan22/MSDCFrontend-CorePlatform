import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type {
  Opportunity, OpportunityFormValues, OpportunityListParams,
  OpportunityStage, PipelineSummary,
} from "../types/opportunity";

const BASE_PATH = "/v1/crm-sales";

export const opportunityApi = {
  list(params: OpportunityListParams) {
    return apiClient.get<PaginatedResponse<Opportunity>>(`${BASE_PATH}/opportunities`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Opportunity }>(`${BASE_PATH}/opportunities/${id}`);
  },
  pipelineSummary() {
    return apiClient.get<{ data: PipelineSummary }>(`${BASE_PATH}/opportunities/pipeline-summary`);
  },
  create(values: OpportunityFormValues) {
    return apiClient.post<ApiMessageResponse<Opportunity>>(`${BASE_PATH}/opportunities`, values);
  },
  updateStage(id: number, stage: OpportunityStage, extra: { lost_reason?: string; competitor_name?: string; final_amount?: number; closer_id?: number | null } = {}) {
    return apiClient.post<ApiMessageResponse<Opportunity>>(`${BASE_PATH}/opportunities/${id}/stage`, { stage, ...extra });
  },
  /** subject WAJIB di backend (OpportunityController::logActivity()) -
   * signature lama di sini cuma kirim activity_type+notes tanpa subject,
   * jadi SETIAP panggilan pasti 422 (makanya fitur ini belum pernah
   * kepakai di UI manapun). */
  logActivity(id: number, activity: { activity_type: string; subject: string; notes?: string; activity_date?: string }) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE_PATH}/opportunities/${id}/activities`, activity);
  },
};
