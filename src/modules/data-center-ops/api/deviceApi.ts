import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Device, DeviceListParams } from "../types/device";

const BASE = "/v1/data-center-ops";

export const deviceApi = {
  list(params: DeviceListParams) {
    return apiClient.get<PaginatedResponse<Device>>(`${BASE}/devices`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Device }>(`${BASE}/devices/${id}`);
  },
  create(values: Partial<Device>) {
    return apiClient.post<ApiMessageResponse<Device>>(`${BASE}/devices`, values);
  },
  update(id: number, values: {
    device_name?: string; manufacturer?: string; model?: string; serial_number?: string;
    power_watt?: number | null;
    customer_id?: number | null; contract_id?: number | null; contract_service_id?: number | null; fixed_asset_id?: number;
    purchase_date?: string; warranty_expiry?: string; notes?: string;
  }) {
    return apiClient.put<ApiMessageResponse<Device>>(`${BASE}/devices/${id}`, values);
  },
  /** Pindah lokasi fisik device - site_id/site_room_id/rack_id/rack_position_u
   * SEMUA nullable di backend (bisa "cabut" device dari rack ke gudang/site
   * saja tanpa room/rack spesifik). */
  move(id: number, values: { site_id?: number | null; site_room_id?: number | null; rack_id?: number | null; rack_position_u?: number | null; rack_position_u_end?: number | null }) {
    return apiClient.post<ApiMessageResponse<Device>>(`${BASE}/devices/${id}/move`, values);
  },
  setStatus(id: number, status: string) {
    return apiClient.post<ApiMessageResponse<Device>>(`${BASE}/devices/${id}/status`, { status });
  },
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/devices/${id}`);
  },
};
