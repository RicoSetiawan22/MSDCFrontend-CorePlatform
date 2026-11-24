import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ArPayment, ArPaymentFormValues, ArPaymentListParams } from "../types/arPayment";

const BASE_PATH = "/v1/finance-accounting/ar";

export const arPaymentApi = {
  list(params: ArPaymentListParams) {
    return apiClient.get<PaginatedResponse<ArPayment>>(`${BASE_PATH}/payments`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: ArPayment }>(`${BASE_PATH}/payments/${id}`);
  },
  create(values: ArPaymentFormValues) {
    return apiClient.post<ApiMessageResponse<ArPayment> & { unallocated_amount: number; warning: string | null }>(`${BASE_PATH}/payments`, values);
  },
  void(id: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<ArPayment>>(`${BASE_PATH}/payments/${id}/void`, { reason });
  },
};
