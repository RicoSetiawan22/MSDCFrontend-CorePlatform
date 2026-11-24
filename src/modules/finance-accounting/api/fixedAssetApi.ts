import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { FaAsset, FaAssetFormValues, FaAssetListParams, AssetRelocation } from "../types/fixedAsset";
import type { DepreciationSchedule, RunDepreciationResult } from "../types/depreciation";

const BASE_PATH = "/v1/finance-accounting/assets";

export const fixedAssetApi = {
  list(params: FaAssetListParams) {
    return apiClient.get<PaginatedResponse<FaAsset>>(BASE_PATH, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: FaAsset }>(`${BASE_PATH}/${id}`);
  },
  create(values: FaAssetFormValues) {
    return apiClient.post<ApiMessageResponse<FaAsset>>(BASE_PATH, values);
  },
  update(id: number, values: Partial<FaAssetFormValues>) {
    return apiClient.put<ApiMessageResponse<FaAsset>>(`${BASE_PATH}/${id}`, values);
  },
  relocate(id: number, toLocation: string, relocationDate?: string, reason?: string) {
    return apiClient.post<ApiMessageResponse<AssetRelocation>>(`${BASE_PATH}/${id}/relocate`, {
      to_location: toLocation, relocation_date: relocationDate, reason,
    });
  },
  dispose(id: number, values: { disposal_date?: string; disposal_proceeds?: number; proceeds_account_code?: string; gain_loss_account_code?: string }) {
    return apiClient.post<ApiMessageResponse<FaAsset>>(`${BASE_PATH}/${id}/dispose`, values);
  },
  depreciationSchedule(id: number) {
    return apiClient.get<{ data: DepreciationSchedule }>(`${BASE_PATH}/${id}/depreciation-schedule`);
  },
  /** assetId dikosongkan = jalankan SEMUA aset in_service sekaligus. */
  runDepreciation(periodDate: string, assetId?: number) {
    return apiClient.post<ApiMessageResponse<RunDepreciationResult>>(`${BASE_PATH}/run-depreciation`, { period_date: periodDate, asset_id: assetId });
  },
  printPdf(organizationId: number, params?: { asset_category?: string; status?: string; search?: string }) {
    return apiClient.get<Blob>(`${BASE_PATH}/print-pdf`, { params: { organization_id: organizationId, ...params }, responseType: "blob" });
  },
  printDepreciationSchedulePdf(organizationId: number, params?: { asset_category?: string; status?: string }) {
    return apiClient.get<Blob>(`${BASE_PATH}/depreciation-schedule/print-pdf`, { params: { organization_id: organizationId, ...params }, responseType: "blob" });
  },
};
