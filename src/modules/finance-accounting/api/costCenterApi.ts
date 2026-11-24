import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { CostCenter, CostCenterFormValues, CostCenterListParams } from "../types/costCenter";
import type { CostReport } from "../types/costReport";

const BASE_PATH = "/v1/finance-accounting";

// CATATAN: endpoint ini TIDAK dipaginasi Laravel (beda dari Account/ArInvoice/
// ApBill) - backend balas { data: CostCenter[] } polos. Lihat
// CcCostCenterController::index() - sengaja begitu karena jumlah cost center
// biasanya sedikit (puluhan, bukan ribuan), jadi tabel struktur pohon lebih
// bermakna ditampilkan LENGKAP sekaligus daripada dipotong per halaman.
export const costCenterApi = {
  list(params: CostCenterListParams) {
    return apiClient.get<{ data: CostCenter[] }>(`${BASE_PATH}/cost-centers`, { params });
  },
  create(values: CostCenterFormValues) {
    return apiClient.post<ApiMessageResponse<CostCenter>>(`${BASE_PATH}/cost-centers`, values);
  },
  /** BUKAN endpoint PUT terpisah - CcCostCenterController::store() sendiri
   * yang create-atau-update tergantung ada/tidaknya 'id' di body (lihat
   * CostCenterService::setCostCenter()). 'code' SENGAJA tidak dikirim -
   * backend cuma whitelist name/type/parent_id/is_active/notes untuk
   * update, code permanen sejak dibuat. */
  update(id: number, values: Omit<CostCenterFormValues, "code">) {
    return apiClient.post<ApiMessageResponse<CostCenter>>(`${BASE_PATH}/cost-centers`, { ...values, id });
  },
  /** Backend tolak (409) kalau cost center ini punya child atau sudah
   * dipakai di jurnal GL - lihat CostCenterService::deleteCostCenter(). */
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE_PATH}/cost-centers/${id}`);
  },
  /** include_descendants default TRUE di backend - laporan cost center
   * INDUK otomatis roll-up semua sub-cost-center di bawahnya (mis. total
   * biaya "Surabaya DC" mencakup semua rack/ruangan di bawahnya). */
  costReport(costCenterId: number, dateFrom?: string, dateTo?: string, includeDescendants = true) {
    return apiClient.get<{ data: CostReport }>(`${BASE_PATH}/cost-centers/${costCenterId}/cost-report`, {
      params: { date_from: dateFrom, date_to: dateTo, include_descendants: includeDescendants },
    });
  },
  printPdf(organizationId: number) {
    return apiClient.get<Blob>(`${BASE_PATH}/cost-centers/print-pdf`, { params: { organization_id: organizationId }, responseType: "blob" });
  },
  printCostCenterReportPdf(costCenterId: number, params: {
    organizationId: number;
    date_from?: string;
    date_to?: string;
    include_descendants?: boolean;
  }) {
    return apiClient.get<Blob>(
      `${BASE_PATH}/cost-centers/${costCenterId}/print-report-pdf`,
      { params: {
        organization_id: params.organizationId,
        date_from: params.date_from,
        date_to: params.date_to,
        include_descendants: params.include_descendants,
      }, responseType: "blob" }
    );
  },
};

