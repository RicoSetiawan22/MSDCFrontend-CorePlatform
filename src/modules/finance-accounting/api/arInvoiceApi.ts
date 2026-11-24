import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { ArInvoice, ArInvoiceFormValues, ArInvoiceListParams } from "../types/arInvoice";
import type { ArAgingReport } from "../types/arAging";

// CATATAN prefix: endpoint AR punya prefix TAMBAHAN "/ar/" di belakang
// base path modul (beda dari /accounts atau /cost-centers yang langsung
// nempel ke base path) - lihat Route::prefix('ar')->group(...) di
// Modules/FinanceAccounting/routes/api.php.
const BASE_PATH = "/v1/finance-accounting/ar";

export const arInvoiceApi = {
  list(params: ArInvoiceListParams) {
    return apiClient.get<PaginatedResponse<ArInvoice>>(`${BASE_PATH}/invoices`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: ArInvoice }>(`${BASE_PATH}/invoices/${id}`);
  },
  create(values: ArInvoiceFormValues) {
    return apiClient.post<ApiMessageResponse<ArInvoice>>(`${BASE_PATH}/invoices`, values);
  },
  void(id: number) {
    return apiClient.post<ApiMessageResponse<ArInvoice>>(`${BASE_PATH}/invoices/${id}/void`);
  },
  sendReminder(id: number, email: string) {
    return apiClient.post<ApiMessageResponse<ArInvoice>>(`${BASE_PATH}/invoices/${id}/send-reminder`, { email });
  },
  agingReport(asOfDate?: string) {
    return apiClient.get<{ data: ArAgingReport }>(`${BASE_PATH}/aging-report`, { params: { as_of_date: asOfDate } });
  },
  printPdf(id: number, organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/invoices/${id}/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
  agingArPdf(asOfDate: string, organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/aging-report/print-pdf`, { params: { organization_id: organizationId, as_of_date: asOfDate }, responseType: "blob" });
  },
};

