import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { GlPeriod } from "../types/glPeriod";

const BASE_PATH = "/v1/finance-accounting/gl/periods";

export const glPeriodApi = {
  list(fiscalYear: number) {
    return apiClient.get<{ data: GlPeriod[] }>(BASE_PATH, { params: { fiscal_year: fiscalYear } });
  },
  generate(fiscalYear: number) {
    return apiClient.post<ApiMessageResponse<GlPeriod[]>>(`${BASE_PATH}/generate`, { fiscal_year: fiscalYear });
  },
  close(id: number) {
    return apiClient.post<ApiMessageResponse<GlPeriod>>(`${BASE_PATH}/${id}/close`);
  },
  reopen(id: number) {
    return apiClient.post<ApiMessageResponse<GlPeriod>>(`${BASE_PATH}/${id}/reopen`);
  },
};
