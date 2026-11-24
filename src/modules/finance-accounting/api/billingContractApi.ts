import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { BiBillingContract, BiBillingContractFormValues, BiBillingContractUpdateValues, BiBillingContractListParams } from "../types/billingContract";
import type { RunBillingResult, BillingHistoryEntry } from "../types/billingRun";

// CATATAN prefix: rute Billing Integration pakai "/billing/" (BUKAN "/bi/"
// walau nama entity/controller-nya BiXxx) - lihat Route::prefix('billing')
// di routes/api.php.
const BASE_PATH = "/v1/finance-accounting/billing";

export const billingContractApi = {
  list(params: BiBillingContractListParams) {
    return apiClient.get<PaginatedResponse<BiBillingContract>>(`${BASE_PATH}/contracts`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: BiBillingContract }>(`${BASE_PATH}/contracts/${id}`);
  },
  create(values: BiBillingContractFormValues) {
    return apiClient.post<ApiMessageResponse<BiBillingContract>>(`${BASE_PATH}/contracts`, values);
  },
  update(id: number, values: BiBillingContractUpdateValues) {
    return apiClient.put<ApiMessageResponse<BiBillingContract>>(`${BASE_PATH}/contracts/${id}`, values);
  },
  suspend(id: number) {
    return apiClient.post<ApiMessageResponse<BiBillingContract>>(`${BASE_PATH}/contracts/${id}/suspend`);
  },
  reactivate(id: number) {
    return apiClient.post<ApiMessageResponse<BiBillingContract>>(`${BASE_PATH}/contracts/${id}/reactivate`);
  },
  terminate(id: number) {
    return apiClient.post<ApiMessageResponse<BiBillingContract>>(`${BASE_PATH}/contracts/${id}/terminate`);
  },
  history(id: number) {
    return apiClient.get<{ data: BillingHistoryEntry[] }>(`${BASE_PATH}/contracts/${id}/history`);
  },
  /** contractId dikosongkan = jalankan SEMUA kontrak active sekaligus. */
  run(periodDate: string, contractId?: number) {
    return apiClient.post<ApiMessageResponse<RunBillingResult>>(`${BASE_PATH}/run`, { period_date: periodDate, contract_id: contractId });
  },
};
