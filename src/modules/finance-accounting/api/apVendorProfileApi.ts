import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ApVendorProfile, ApVendorProfileFormValues, ApVendorProfileListParams, ApOutstandingBalance } from "../types/apVendorProfile";

const BASE_PATH = "/v1/finance-accounting/ap";

export const apVendorProfileApi = {
  list(params: ApVendorProfileListParams) {
    return apiClient.get<PaginatedResponse<ApVendorProfile>>(`${BASE_PATH}/vendors`, { params });
  },
  /** vendorId di sini BUKAN id baris ApVendorProfile - itu vendor_id dari
   * modul Procurement Team 5 (soft reference). */
  show(vendorId: number) {
    return apiClient.get<{ data: ApOutstandingBalance }>(`${BASE_PATH}/vendors/${vendorId}`);
  },
  /** save() ini UPSERT (updateOrCreate berdasar vendor_id). */
  save(values: ApVendorProfileFormValues) {
    return apiClient.post<ApiMessageResponse<ApVendorProfile>>(`${BASE_PATH}/vendors`, values);
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/vendors/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
};
