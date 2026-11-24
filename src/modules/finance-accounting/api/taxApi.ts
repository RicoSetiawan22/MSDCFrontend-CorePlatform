import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { TaxType, TaxTypeFormValues, TaxTypeListParams } from "../types/taxType";
import type { TaxEFaktur, TaxEFakturFormValues, TaxEFakturListParams } from "../types/taxEFaktur";
import type { TaxWithholdingCertificate, TaxWithholdingFormValues, TaxWithholdingListParams } from "../types/taxWithholding";
import type { PpnSummary, PphSummary } from "../types/taxReport";
import type {
  TaxCustomerProfile, TaxCustomerProfileFormValues, TaxCustomerProfileListParams,
  TaxVendorProfile, TaxVendorProfileFormValues, TaxVendorProfileListParams,
} from "../types/taxProfile";

const BASE_PATH = "/v1/finance-accounting/tax";

export const taxTypeApi = {
  list(params: TaxTypeListParams) {
    return apiClient.get<{ data: TaxType[] }>(`${BASE_PATH}/types`, { params });
  },
  create(values: TaxTypeFormValues) {
    return apiClient.post<ApiMessageResponse<TaxType>>(`${BASE_PATH}/types`, values);
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/types/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
};

export const taxEFakturApi = {
  list(params: TaxEFakturListParams) {
    return apiClient.get<PaginatedResponse<TaxEFaktur>>(`${BASE_PATH}/efaktur`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: TaxEFaktur }>(`${BASE_PATH}/efaktur/${id}`);
  },
  create(values: TaxEFakturFormValues) {
    return apiClient.post<ApiMessageResponse<TaxEFaktur>>(`${BASE_PATH}/efaktur`, values);
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<TaxEFaktur>>(`${BASE_PATH}/efaktur/${id}/cancel`);
  },
};

export const taxWithholdingApi = {
  list(params: TaxWithholdingListParams) {
    return apiClient.get<PaginatedResponse<TaxWithholdingCertificate>>(`${BASE_PATH}/withholding-certificates`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: TaxWithholdingCertificate }>(`${BASE_PATH}/withholding-certificates/${id}`);
  },
  create(values: TaxWithholdingFormValues) {
    return apiClient.post<ApiMessageResponse<TaxWithholdingCertificate>>(`${BASE_PATH}/withholding-certificates`, values);
  },
  /** Cuma valid untuk sertifikat direction=withheld_by_us yang belum
   * disetor - lihat catatan unremitted_only di TaxWithholdingListParams. */
  remit(id: number, remittedDate: string, withdrawalAccountCode: string) {
    return apiClient.post<ApiMessageResponse<TaxWithholdingCertificate>>(`${BASE_PATH}/withholding-certificates/${id}/remit`, {
      remitted_date: remittedDate,
      withdrawal_account_code: withdrawalAccountCode,
    });
  },
};

export const taxProfileApi = {
  customerList(params: TaxCustomerProfileListParams) {
    return apiClient.get<PaginatedResponse<TaxCustomerProfile>>(`${BASE_PATH}/customers`, { params });
  },
  saveCustomer(values: TaxCustomerProfileFormValues) {
    return apiClient.post<ApiMessageResponse<TaxCustomerProfile>>(`${BASE_PATH}/customers`, values);
  },
  vendorList(params: TaxVendorProfileListParams) {
    return apiClient.get<PaginatedResponse<TaxVendorProfile>>(`${BASE_PATH}/vendors`, { params });
  },
  saveVendor(values: TaxVendorProfileFormValues) {
    return apiClient.post<ApiMessageResponse<TaxVendorProfile>>(`${BASE_PATH}/vendors`, values);
  },
};

export const taxReportApi = {
  ppnSummary(dateFrom: string, dateTo: string) {
    return apiClient.get<{ data: PpnSummary }>(`${BASE_PATH}/reports/ppn-summary`, { params: { date_from: dateFrom, date_to: dateTo } });
  },
  pphSummary(periodMonth: number, periodYear: number) {
    return apiClient.get<{ data: PphSummary }>(`${BASE_PATH}/reports/pph-summary`, { params: { period_month: periodMonth, period_year: periodYear } });
  },
  printPdf(params: {
    organizationId: number;
    date_from?: string;
    date_to?: string;
    period_month?: number;
    period_year?: number;
  }) {
    return apiClient.get<Blob>(`${BASE_PATH}/reports/print-pdf`, {
      params: {
        organization_id: params.organizationId,
        date_from: params.date_from,
        date_to: params.date_to,
        period_month: params.period_month,
        period_year: params.period_year,
      },
      responseType: "blob",
    });
  },
};
