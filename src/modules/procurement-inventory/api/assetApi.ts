import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { Asset, AssetListParams, AssetHistory, MaintenanceSchedule, MaintenanceLog } from "../types/asset";

const BASE = "/v1/procurement-inventory";

export const assetApi = {
  list(params: AssetListParams) {
    return apiClient.get<PaginatedResponse<Asset>>(`${BASE}/assets`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: Asset }>(`${BASE}/assets/${id}`);
  },
  // Jejak lengkap 1 aset - asal (PO/GRN/FSTB) dan SEMUA dokumen yang
  // pernah menyinggung aset ini (Klaim Garansi/FGBG, Peminjaman/FPBG,
  // Pengembalian Rusak/FPRG) - lihat AssetMaintenanceController::history().
  history(id: number) {
    return apiClient.get<{ data: AssetHistory }>(`${BASE}/assets/${id}/history`);
  },
  create(values: {
    asset_name: string;
    category?: string;
    site_id?: number;
    vendor_id?: number;
    purchase_date?: string;
    warranty_expiry?: string;
    notes?: string;
  }) {
    return apiClient.post<ApiMessageResponse<Asset>>(`${BASE}/assets`, values);
  },
  update(id: number, values: Partial<{
    asset_name: string;
    category?: string;
    site_id?: number;
    vendor_id?: number;
    purchase_date?: string;
    warranty_expiry?: string;
    notes?: string;
  }>) {
    return apiClient.put<ApiMessageResponse<Asset>>(`${BASE}/assets/${id}`, values);
  },
  delete(id: number) {
    return apiClient.delete<ApiMessageResponse<void>>(`${BASE}/assets/${id}`);
  },
  setStatus(id: number, status: string) {
    return apiClient.post<ApiMessageResponse<Asset>>(`${BASE}/assets/${id}/status`, { status });
  },
  createSchedule(assetId: number, values: {
    maintenance_type?: string;
    title: string;
    frequency_days?: number;
    next_due_date: string;
    notes?: string;
  }) {
    return apiClient.post<ApiMessageResponse<MaintenanceSchedule>>(`${BASE}/assets/${assetId}/maintenance-schedules`, values);
  },
  createLog(assetId: number, values: {
    schedule_id?: number;
    maintenance_date?: string;
    findings?: string;
    actions_taken?: string;
    next_recommended_date?: string;
  }) {
    return apiClient.post<ApiMessageResponse<MaintenanceLog>>(`${BASE}/assets/${assetId}/maintenance-logs`, values);
  },
  overdueSchedules() {
    return apiClient.get<{ data: MaintenanceSchedule[] }>(`${BASE}/maintenance/overdue-schedules`);
  },
};
