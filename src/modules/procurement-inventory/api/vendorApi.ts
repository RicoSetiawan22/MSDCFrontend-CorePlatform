import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Vendor, VendorFormValues, VendorListParams, VendorStatus } from "../types/vendor";

const BASE_PATH = "/v1/procurement-inventory/vendors";

export const vendorApi = {
  list(params: VendorListParams) {
    return apiClient.get<PaginatedResponse<Vendor>>(BASE_PATH, { params });
  },
  create(values: VendorFormValues) {
    return apiClient.post<ApiMessageResponse<Vendor>>(BASE_PATH, values);
  },
  update(id: number | string, values: Partial<VendorFormValues>) {
    return apiClient.put<ApiMessageResponse<Vendor>>(`${BASE_PATH}/${id}`, values);
  },
  setStatus(id: number | string, status: VendorStatus) {
    return apiClient.post<ApiMessageResponse<Vendor>>(`${BASE_PATH}/${id}/status`, { status });
  },
};
