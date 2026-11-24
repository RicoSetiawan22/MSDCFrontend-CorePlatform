import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { PcProfitCenter, PcProfitCenterFormValues, PcProfitCenterListParams } from "../types/profitCenter";
import type { ProfitReport, ProfitComparison } from "../types/profitReport";

const BASE_PATH = "/v1/finance-accounting/profit-centers";

// Sama seperti Cost Center - endpoint ini TIDAK dipaginasi (jumlah profit
// center biasanya sedikit, satu per lini layanan).
export const profitCenterApi = {
  list(params: PcProfitCenterListParams) {
    return apiClient.get<{ data: PcProfitCenter[] }>(BASE_PATH, { params });
  },
  create(values: PcProfitCenterFormValues) {
    return apiClient.post<ApiMessageResponse<PcProfitCenter>>(BASE_PATH, values);
  },
  report(profitCenterId: number, dateFrom?: string, dateTo?: string, includeDescendants = true) {
    return apiClient.get<{ data: ProfitReport }>(`${BASE_PATH}/${profitCenterId}/profit-report`, {
      params: { date_from: dateFrom, date_to: dateTo, include_descendants: includeDescendants },
    });
  },
  comparison(dateFrom?: string, dateTo?: string) {
    return apiClient.get<{ data: ProfitComparison }>(`${BASE_PATH}/comparison`, { params: { date_from: dateFrom, date_to: dateTo } });
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
  /** PDF laporan per profit center — endpoint: /profit-centers/{id}/report/print-pdf */
  printProfitCenterReportPdf(profitCenterId: number, params: {
    organizationId: number;
    date_from?: string;
    date_to?: string;
    include_descendants?: boolean;
  }) {
    return apiClient.get<Blob>(
      `${BASE_PATH}/${profitCenterId}/report/print-pdf`,
      {
        params: {
          organization_id: params.organizationId,
          date_from: params.date_from,
          date_to: params.date_to,
          include_descendants: params.include_descendants,
        },
        responseType: "blob",
      }
    );
  },
  printComparisonPdf(params: {
    organizationId: number;
    date_from?: string;
    date_to?: string;
  }) {
    // Lives under /v1/finance-accounting/financial-reports/
    return apiClient.get<Blob>(`v1/finance-accounting/financial-reports/profit-center-comparison/print-pdf`, {
      params: {
        organization_id: params.organizationId,
        date_from: params.date_from,
        date_to: params.date_to,
      },
      responseType: "blob",
    });
  },
};
