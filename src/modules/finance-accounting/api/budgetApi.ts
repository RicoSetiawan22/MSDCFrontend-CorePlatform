import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { BgBudget, BgBudgetFormValues, BgBudgetListParams, BudgetVsActualReport } from "../types/budget";

const BASE_PATH = "/v1/finance-accounting/budget";

export const budgetApi = {
  list(params: BgBudgetListParams) {
    return apiClient.get<PaginatedResponse<BgBudget>>(`${BASE_PATH}/budgets`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: BgBudget }>(`${BASE_PATH}/budgets/${id}`);
  },
  /** UPSERT - kombinasi department_id+account_id+fiscal_year yang SAMA
   * akan UPDATE baris yang sudah ada, bukan bikin baris baru. */
  save(values: BgBudgetFormValues) {
    return apiClient.post<ApiMessageResponse<BgBudget>>(`${BASE_PATH}/budgets`, values);
  },
  remove(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE_PATH}/budgets/${id}`);
  },
  vsActual(fiscalYear: number, departmentId?: number, asOfDate?: string) {
    return apiClient.get<{ data: BudgetVsActualReport }>(`${BASE_PATH}/vs-actual`, { params: { fiscal_year: fiscalYear, department_id: departmentId, as_of_date: asOfDate } });
  },
};
