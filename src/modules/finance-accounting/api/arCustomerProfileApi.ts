import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ArCustomerProfile, ArCustomerProfileFormValues, ArCustomerProfileListParams, ArOutstandingBalance } from "../types/arCustomerProfile";

const BASE_PATH = "/v1/finance-accounting/ar";

export const arCustomerProfileApi = {
  list(params: ArCustomerProfileListParams) {
    return apiClient.get<PaginatedResponse<ArCustomerProfile>>(`${BASE_PATH}/customers`, { params });
  },
  /** customerId di sini BUKAN id baris ArCustomerProfile - itu customer_id
   * dari modul CRM Team 2 (soft reference), lihat catatan di
   * ArCustomerProfileController::show(). */
  show(customerId: number) {
    return apiClient.get<{ data: ArOutstandingBalance }>(`${BASE_PATH}/customers/${customerId}`);
  },
  /** store() ini UPSERT (updateOrCreate berdasar customer_id) - dipakai
   * baik untuk BUAT profil kredit baru maupun UBAH limit yang sudah ada. */
  save(values: ArCustomerProfileFormValues) {
    return apiClient.post<ApiMessageResponse<ArCustomerProfile>>(`${BASE_PATH}/customers`, values);
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/customers/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
};
