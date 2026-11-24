import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ApPayment, ApPaymentFormValues, ApPaymentListParams } from "../types/apPayment";

const BASE_PATH = "/v1/finance-accounting/ap";

export const apPaymentApi = {
  list(params: ApPaymentListParams) {
    return apiClient.get<PaginatedResponse<ApPayment>>(`${BASE_PATH}/payments`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: ApPayment }>(`${BASE_PATH}/payments/${id}`);
  },
  create(values: ApPaymentFormValues) {
    return apiClient.post<ApiMessageResponse<ApPayment> & { unallocated_amount?: number; warning?: string | null }>(`${BASE_PATH}/payments`, values);
  },
  void(id: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<ApPayment>>(`${BASE_PATH}/payments/${id}/void`, { reason });
  },
};
