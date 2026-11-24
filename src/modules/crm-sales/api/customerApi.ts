import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Customer, CustomerFormValues, CustomerListParams, CustomerStatus } from "../types/customer";

// Base path modul ini SAJA - konsisten dengan konvensi backend
// {{base_url}}/v1/crm-sales/... yang sudah dipakai di seluruh collection Postman Team 2.
const BASE_PATH = "/v1/crm-sales";

export const customerApi = {
  list(params: CustomerListParams) {
    return apiClient.get<PaginatedResponse<Customer>>(`${BASE_PATH}/customers`, { params });
  },

  show(id: number) {
    return apiClient.get<{ data: Customer }>(`${BASE_PATH}/customers/${id}`);
  },

  create(values: CustomerFormValues) {
    return apiClient.post<ApiMessageResponse<Customer>>(`${BASE_PATH}/customers`, values);
  },

  update(id: number, values: CustomerFormValues) {
    return apiClient.put<ApiMessageResponse<Customer>>(`${BASE_PATH}/customers/${id}`, values);
  },

  setStatus(id: number, status: CustomerStatus) {
    return apiClient.post<ApiMessageResponse<Customer>>(`${BASE_PATH}/customers/${id}/status`, { status });
  },

  // Backend (CustomerService::delete()) menolak (409) kalau customer ini
  // masih ditautkan ke Contract/Sales Order/Quotation/dst - lihat pesan
  // error di response, ditampilkan apa adanya ke user.
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<null>>(`${BASE_PATH}/customers/${id}`);
  },
};
