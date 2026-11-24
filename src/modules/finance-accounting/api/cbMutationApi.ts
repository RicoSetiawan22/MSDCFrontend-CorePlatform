import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { CbMutation, CbMutationFormValues, CbMutationListParams } from "../types/cbMutation";

const BASE_PATH = "/v1/finance-accounting/cb";

export const cbMutationApi = {
  list(params: CbMutationListParams) {
    return apiClient.get<PaginatedResponse<CbMutation>>(`${BASE_PATH}/mutations`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: CbMutation }>(`${BASE_PATH}/mutations/${id}`);
  },
  storeDeposit(values: CbMutationFormValues) {
    return apiClient.post<ApiMessageResponse<CbMutation>>(`${BASE_PATH}/deposits`, values);
  },
  storeWithdrawal(values: CbMutationFormValues) {
    return apiClient.post<ApiMessageResponse<CbMutation>>(`${BASE_PATH}/withdrawals`, values);
  },
  storeTransfer(values: CbMutationFormValues) {
    return apiClient.post<ApiMessageResponse<CbMutation>>(`${BASE_PATH}/transfers`, values);
  },
  void(id: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<CbMutation>>(`${BASE_PATH}/mutations/${id}/void`, { reason });
  },
};
