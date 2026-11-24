import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { GoodsHandover, GoodsHandoverListParams, HandoverAvailability, CreateGoodsHandoverValues, AvailableGrnForHandover } from "../types/goodsHandover";

const BASE = "/v1/procurement-inventory";

export const goodsHandoverApi = {
  list(params: GoodsHandoverListParams) {
    return apiClient.get<PaginatedResponse<GoodsHandover>>(`${BASE}/goods-handovers`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: GoodsHandover }>(`${BASE}/goods-handovers/${id}`);
  },
  // GRN yang SEMUA barisnya sudah tuntas diserahkan TIDAK ikut di sini -
  // difilter di backend (GoodsHandoverController::receiptsAvailable()), BUKAN
  // client-side, supaya benar walau daftar GRN posted-nya banyak.
  receiptsAvailableForHandover(search?: string) {
    return apiClient.get<{ data: AvailableGrnForHandover[] }>(`${BASE}/goods-receipts-available-for-handover`, { params: { search: search || undefined } });
  },
  receiptAvailability(goodsReceiptId: number) {
    return apiClient.get<{ data: HandoverAvailability }>(`${BASE}/goods-receipts/${goodsReceiptId}/handover-availability`);
  },
  create(values: CreateGoodsHandoverValues) {
    return apiClient.post<ApiMessageResponse<GoodsHandover>>(`${BASE}/goods-handovers`, values);
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/goods-handovers/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
};
