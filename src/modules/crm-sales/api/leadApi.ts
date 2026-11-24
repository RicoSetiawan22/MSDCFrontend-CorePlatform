import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Lead, LeadFormValues, LeadListParams, LeadStatus, SalesEmployeeOption, PicUserOption } from "../types/lead";

const BASE_PATH = "/v1/crm-sales";

export const leadApi = {
  salesEmployees() {
    return apiClient.get<{ data: SalesEmployeeOption[] }>(`${BASE_PATH}/sales-employees`);
  },
  picUsers() {
    return apiClient.get<{ data: PicUserOption[] }>(`${BASE_PATH}/pic-users`);
  },
  list(params: LeadListParams) {
    return apiClient.get<PaginatedResponse<Lead>>(`${BASE_PATH}/leads`, { params });
  },
  search(query: string) {
    return apiClient.get<PaginatedResponse<Lead>>(`${BASE_PATH}/leads`, {
      params: { search: query || undefined, per_page: 20, open_only: true },
    });
  },
  show(id: number) {
    return apiClient.get<{ data: Lead }>(`${BASE_PATH}/leads/${id}`);
  },
  create(values: LeadFormValues) {
    return apiClient.post<ApiMessageResponse<Lead>>(`${BASE_PATH}/leads`, values);
  },
  updateStatus(id: number, status: LeadStatus) {
    return apiClient.post<ApiMessageResponse<Lead>>(`${BASE_PATH}/leads/${id}/status`, { status });
  },
  convert(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE_PATH}/leads/${id}/convert`, {});
  },
};