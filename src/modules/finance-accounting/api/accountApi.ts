import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Account, AccountFormValues, AccountListParams } from "../types/account";

const BASE_PATH = "/v1/finance-accounting";

export const accountApi = {
  list(params: AccountListParams) {
    return apiClient.get<PaginatedResponse<Account>>(`${BASE_PATH}/accounts`, { params });
  },
  create(values: AccountFormValues) {
    return apiClient.post<ApiMessageResponse<Account>>(`${BASE_PATH}/accounts`, values);
  },
  activate(id: number) {
    return apiClient.post<ApiMessageResponse<Account>>(`${BASE_PATH}/accounts/${id}/activate`);
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/accounts/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
};
