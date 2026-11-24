import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Rack, RackListParams, RackOccupancy, RackAllocation } from "../types/rack";

const BASE = "/v1/data-center-ops";

/** Alokasi rack aktif/reserved milik 1 contract, dengan rack+room di-eager-load -
 * dipakai DeviceFormModal supaya device yang ditautkan ke contract cuma bisa
 * ditempatkan di slot yang MEMANG sudah dikunci contract itu (lihat
 * RackController::allocationsForContract() / DeviceService::
 * assertWithinContractAllocation()). */
export interface ContractRackAllocationOption {
  id: number;
  rack_id: number;
  start_u: number;
  end_u: number;
  status: string;
  rack: {
    id: number;
    site_room_id: number;
    rack_code: string;
    rack_name: string | null;
    total_u: number;
    site_room: { id: number; site_id: number; room_code: string; room_name: string } | null;
  } | null;
}

export const rackApi = {
  list(params: RackListParams) {
    return apiClient.get<PaginatedResponse<Rack>>(`${BASE}/racks`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Rack }>(`${BASE}/racks/${id}`);
  },
  create(values: Record<string, unknown>) {
    return apiClient.post<ApiMessageResponse<Rack>>(`${BASE}/racks`, values);
  },
  setStatus(id: number, status: string) {
    return apiClient.post<ApiMessageResponse<Rack>>(`${BASE}/racks/${id}/status`, { status });
  },
  /** Peta okupansi per-slot U (1..total_u) - dipakai RackVisualPicker. */
  occupancy(id: number) {
    return apiClient.get<{ data: RackOccupancy }>(`${BASE}/racks/${id}/occupancy`);
  },
  /** Kunci rentang U spesifik yang dipilih user di RackVisualPicker -
   * endpoint MANUAL, beda dari auto-pick findAndAllocateInSite() yang
   * dipakai reservasi Sales Order (lihat SalesOrderResourceService). */
  allocate(rackId: number, values: {
    start_u: number; end_u: number;
    customer_id?: number | null; contract_id?: number | null; sales_order_id?: number | null;
    status?: "active" | "reserved"; allocated_date?: string; notes?: string;
  }) {
    return apiClient.post<ApiMessageResponse<RackAllocation>>(`${BASE}/racks/${rackId}/allocate`, values);
  },
  releaseAllocation(allocationId: number) {
    return apiClient.post<ApiMessageResponse<RackAllocation>>(`${BASE}/rack-allocations/${allocationId}/release`, {});
  },
  /** Ajukan pelepasan alokasi lewat Workflow Engine (approval Manager) -
   * BEDA dari releaseAllocation() di atas yang langsung lepas tanpa approval
   * (masih dipakai RackVisualPicker). Lihat RackController::requestRelease(). */
  requestReleaseAllocation(allocationId: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<null>>(`${BASE}/rack-allocations/${allocationId}/request-release`, { reason });
  },
  /** Ajukan pemindahan alokasi ke rack/slot lain - approval Manager, lihat
   * RackController::requestMove(). */
  requestMoveAllocation(allocationId: number, targetRackId: number, targetStartU: number, reason?: string) {
    return apiClient.post<ApiMessageResponse<null>>(`${BASE}/rack-allocations/${allocationId}/request-move`, {
      target_rack_id: targetRackId, target_start_u: targetStartU, reason,
    });
  },
  /** Staf DC Ops konfirmasi device fisik dari kontrak yang sudah berakhir
   * SUDAH dilepas dari rack - dipakai panel "Rak Perlu Dilepas" Dashboard. */
  completeRelease(allocationId: number) {
    return apiClient.post<ApiMessageResponse<RackAllocation>>(`${BASE}/rack-allocations/${allocationId}/complete-release`, {});
  },
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<unknown>>(`${BASE}/racks/${id}`);
  },
  /** Slot rack yang sudah dikunci/dipesan untuk 1 contract - lihat
   * RackController::allocationsForContract(). */
  allocationsForContract(contractId: number) {
    return apiClient.get<{ data: ContractRackAllocationOption[] }>(`${BASE}/racks/allocations-for-contract`, { params: { contract_id: contractId } });
  },
};
