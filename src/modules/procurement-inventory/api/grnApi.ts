import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { GoodsReceipt, GoodsReceiptListParams, CreateGrnDraftValues } from "../types/grn";

const BASE = "/v1/procurement-inventory";

export const grnApi = {
  list(params: GoodsReceiptListParams) {
    return apiClient.get<PaginatedResponse<GoodsReceipt>>(`${BASE}/goods-receipts`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: GoodsReceipt }>(`${BASE}/goods-receipts/${id}`);
  },
  createDraft(poId: number, values: CreateGrnDraftValues) {
    return apiClient.post<ApiMessageResponse<GoodsReceipt>>(`${BASE}/purchase-orders/${poId}/goods-receipts`, values);
  },
  post(id: number, values?: { item_links?: Array<{ purchase_order_line_id: number; item_id: number }> }) {
    return apiClient.post<ApiMessageResponse<GoodsReceipt>>(`${BASE}/goods-receipts/${id}/post`, values ?? {});
  },
};
