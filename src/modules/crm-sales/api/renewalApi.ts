import { apiClient } from "@shared/lib/api-client";
import type { ApiMessageResponse } from "@shared/types/api";
import type { Contract } from "../types/contract";
import type { ContractCloseValues, ContractRenewValues } from "../types/renewal";

const BASE_PATH = "/v1/crm-sales";

export const renewalApi = {
  /** Buat Contract perpanjangan (draft) dari kontrak lama. */
  renew(id: number, values: ContractRenewValues) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/${id}/renew`, values);
  },
  /** Selesaikan kontrak TANPA perpanjangan (alasan wajib dicatat). */
  close(id: number, values: ContractCloseValues) {
    return apiClient.post<ApiMessageResponse<Contract>>(`${BASE_PATH}/contracts/${id}/close`, values);
  },
};
