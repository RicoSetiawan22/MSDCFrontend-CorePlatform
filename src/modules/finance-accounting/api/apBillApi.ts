import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ApBill, ApBillFormValues, ApBillListParams } from "../types/apBill";
import type { ApAgingReport } from "../types/apAging";

const BASE_PATH = "/v1/finance-accounting/ap";

export const apBillApi = {
  list(params: ApBillListParams) {
    return apiClient.get<PaginatedResponse<ApBill>>(`${BASE_PATH}/bills`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: ApBill }>(`${BASE_PATH}/bills/${id}`);
  },
  create(values: ApBillFormValues) {
    return apiClient.post<ApiMessageResponse<ApBill>>(`${BASE_PATH}/bills`, values);
  },
  void(id: number) {
    return apiClient.post<ApiMessageResponse<ApBill>>(`${BASE_PATH}/bills/${id}/void`);
  },
  agingReport(asOfDate?: string) {
    return apiClient.get<{ data: ApAgingReport }>(`${BASE_PATH}/aging-report`, { params: { as_of_date: asOfDate } });
  },
  agingApPdf(asOfDate: string, organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/aging-report/print-pdf`, {
      params: { organization_id: organizationId, as_of_date: asOfDate },
      responseType: "blob",
    });
  },
};
