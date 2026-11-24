import { apiClient } from "@shared/lib/api-client";
import type { PaginatedResponse, ApiMessageResponse } from "@shared/types/api";
import type { PaymentRequest, PaymentRequestListParams } from "../types/paymentRequest";

const BASE = "/v1/procurement-inventory";

export const paymentRequestApi = {
  list(params: PaymentRequestListParams) {
    return apiClient.get<PaginatedResponse<PaymentRequest>>(`${BASE}/payment-requests`, { params });
  },
  show(id: number) {
    return apiClient.get<{ data: PaymentRequest }>(`${BASE}/payment-requests/${id}`);
  },
  create(values: {
    purchase_order_id: number;
    employee_id?: number;
    payment_type: string;
    percentage?: number;
    amount: number;
    tax_withholding_amount?: number;
    payment_method?: string;
    supporting_doc_notes?: string;
    notes?: string;
  }) {
    return apiClient.post<ApiMessageResponse<PaymentRequest>>(`${BASE}/payment-requests`, values);
  },
  submit(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/payment-requests/${id}/submit`);
  },
  cancel(id: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/payment-requests/${id}/cancel`);
  },
  postAdvance(id: number, bankAccountId: number) {
    return apiClient.post<ApiMessageResponse<unknown>>(`${BASE}/payment-requests/${id}/post-advance`, { bank_account_id: bankAccountId });
  },
  downloadPdf(id: number, organizationId: number) {
    return apiClient.get(`${BASE}/payment-requests/${id}/pdf`, { params: { organization_id: organizationId }, responseType: "blob" as const });
  },
};
