import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { PurchaseOrder, PurchaseOrderListParams } from "../types/po";
import type { PoHistoryData } from "../types/poHistory";

const BASE = "/v1/procurement-inventory";

export const poApi = {
  list(params: PurchaseOrderListParams) {
    return apiClient.get<PaginatedResponse<PurchaseOrder>>(`${BASE}/purchase-orders`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: PurchaseOrder }>(`${BASE}/purchase-orders/${id}`);
  },
  create(values: Partial<PurchaseOrder>) {
    return apiClient.post<ApiMessageResponse<PurchaseOrder>>(`${BASE}/purchase-orders`, values);
  },
  convertFromPr(prId: number) {
    return apiClient.post<ApiMessageResponse<PurchaseOrder>>(`${BASE}/purchase-requests/${prId}/convert-to-po`, {});
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<PurchaseOrder>>(`${BASE}/purchase-orders/${id}/submit`, {});
  },
  sendToVendor(id: number) {
    return apiClient.post<ApiMessageResponse<PurchaseOrder>>(`${BASE}/purchase-orders/${id}/send-to-vendor`, {});
  },
  sendEmail(id: number, values: { organization_id: number; email: string; subject?: string; message?: string }) {
    return apiClient.post<ApiMessageResponse<PurchaseOrder>>(`${BASE}/purchase-orders/${id}/send-email`, values);
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/purchase-orders/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<PurchaseOrder>>(`${BASE}/purchase-orders/${id}/cancel`, {});
  },
  /** Jejak lengkap 1 PO: PR pengaju -> RFQ (semua vendor quotation + file
   * bukti) -> keputusan vendor pemenang -> PO ini (+ lampiran) -> Goods
   * Receipt (BAST) -> Payment Request - dipakai halaman "History PO". */
  history(id: number) {
    return apiClient.get<{ data: PoHistoryData }>(`${BASE}/purchase-orders/${id}/history`);
  },
};
