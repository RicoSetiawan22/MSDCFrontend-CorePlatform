import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Otb, OtbFormValues, OtbListParams, OtbPort, OtbPortAllocateValues, OtbPortListParams } from "../types/otb";

const BASE = "/v1/data-center-ops";

export const otbApi = {
  list(params: OtbListParams) {
    return apiClient.get<PaginatedResponse<Otb>>(`${BASE}/otbs`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Otb }>(`${BASE}/otbs/${id}`);
  },
  create(values: OtbFormValues) {
    return apiClient.post<ApiMessageResponse<Otb>>(`${BASE}/otbs`, values);
  },
  update(id: number, values: Partial<OtbFormValues>) {
    return apiClient.put<ApiMessageResponse<Otb>>(`${BASE}/otbs/${id}`, values);
  },
  ports(otbId: number, params: OtbPortListParams) {
    return apiClient.get<PaginatedResponse<OtbPort>>(`${BASE}/otbs/${otbId}/ports`, { params });
  },
  allocatePort(portId: number, values: OtbPortAllocateValues) {
    return apiClient.post<ApiMessageResponse<OtbPort>>(`${BASE}/otb-ports/${portId}/allocate`, values);
  },
  releasePort(portId: number) {
    return apiClient.post<ApiMessageResponse<OtbPort>>(`${BASE}/otb-ports/${portId}/release`, {});
  },
  markPortDamaged(portId: number) {
    return apiClient.post<ApiMessageResponse<OtbPort>>(`${BASE}/otb-ports/${portId}/mark-damaged`, {});
  },
  repairPort(portId: number) {
    return apiClient.post<ApiMessageResponse<OtbPort>>(`${BASE}/otb-ports/${portId}/repair`, {});
  },
};
